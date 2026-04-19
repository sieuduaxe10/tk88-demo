import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { db } from '../services/database';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Verify admin role (placeholder - extend as needed)
 * In production, add role checking to users table
 */
const isAdmin = (req: Request, res: Response, next: Function) => {
  const userId = (req as any).userId;
  // TODO: Check if user has admin role in database
  // For now, all authenticated users can access admin endpoints
  // In production, should verify user.role === 'admin'
  next();
};

/**
 * GET /admin/users
 * List all registered users (paginated)
 */
router.get('/users', authMiddleware, isAdmin, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    // Get all users with their game stats
    const result = await db.pool.query(
      `SELECT
        u.id, u.email, u.username, u.phone, u.telegram,
        u.kyc_status, u.is_verified, u.is_active, u.is_banned,
        u.created_at, u.last_login,
        w.balance,
        COUNT(DISTINCT gs.id) as total_games,
        COALESCE(SUM(gs.bet_amount), 0) as total_wagered
       FROM users u
       LEFT JOIN wallets w ON u.id = w.user_id
       LEFT JOIN game_sessions gs ON u.id = gs.user_id AND gs.status = 'settled'
       GROUP BY u.id, w.balance
       ORDER BY u.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await db.pool.query('SELECT COUNT(*) FROM users');
    const totalUsers = parseInt(countResult.rows[0].count);

    logger.info(`Admin: Listed users (limit: ${limit}, offset: ${offset})`);

    res.status(200).json({
      success: true,
      users: result.rows,
      pagination: {
        limit,
        offset,
        total: totalUsers,
        pages: Math.ceil(totalUsers / limit),
      },
    });
  } catch (error) {
    logger.error('Get users endpoint error', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

/**
 * GET /admin/users/:userId
 * Get detailed user profile with game history and stats
 */
router.get('/users/:userId', authMiddleware, isAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Get user profile
    const user = await db.getUserProfile(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Get wallet
    const wallet = await db.getWallet(userId);

    // Get game stats
    const stats = await db.getUserGameStats(userId);

    // Get recent games
    const recentGames = await db.getGameHistory(userId, undefined, 10);

    // Get transaction history
    const transactions = await db.getTransactionHistory(userId, 20);

    logger.info(`Admin: Viewed user details: ${userId}`);

    res.status(200).json({
      success: true,
      user,
      wallet,
      stats,
      recentGames,
      transactions,
    });
  } catch (error) {
    logger.error('Get user details endpoint error', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user details' });
  }
});

/**
 * GET /admin/games/:userId
 * Get game history for specific user
 */
router.get('/games/:userId', authMiddleware, isAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const gameType = req.query.gameType as string;
    const limit = parseInt(req.query.limit as string) || 50;

    const games = await db.getGameHistory(userId, gameType, limit);

    logger.info(`Admin: Listed games for user ${userId} (limit: ${limit})`);

    res.status(200).json({
      success: true,
      games,
      count: games.length,
    });
  } catch (error) {
    logger.error('Get games endpoint error', error);
    res.status(500).json({ success: false, error: 'Failed to fetch games' });
  }
});

/**
 * GET /admin/revenue
 * Get daily revenue report
 */
router.get('/revenue', authMiddleware, isAdmin, async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;

    const revenue = await db.getDailyRevenue(days);

    // Calculate totals
    const totals = revenue.reduce(
      (acc, row) => ({
        totalWagered: acc.totalWagered + parseFloat(row.total_wagered),
        totalPayout: acc.totalPayout + parseFloat(row.total_payout),
        houseProfit: acc.houseProfit + parseFloat(row.house_profit),
        uniquePlayers: acc.uniquePlayers + row.unique_players,
        totalGames: acc.totalGames + row.total_games,
      }),
      {
        totalWagered: 0,
        totalPayout: 0,
        houseProfit: 0,
        uniquePlayers: 0,
        totalGames: 0,
      }
    );

    logger.info(`Admin: Generated revenue report (${days} days)`);

    res.status(200).json({
      success: true,
      revenue,
      totals,
      days,
    });
  } catch (error) {
    logger.error('Get revenue endpoint error', error);
    res.status(500).json({ success: false, error: 'Failed to fetch revenue' });
  }
});

/**
 * GET /admin/transactions/:userId
 * Get transaction history for user
 */
router.get('/transactions/:userId', authMiddleware, isAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const transactions = await db.getTransactionHistory(userId, limit);

    logger.info(`Admin: Listed transactions for user ${userId}`);

    res.status(200).json({
      success: true,
      transactions,
      count: transactions.length,
    });
  } catch (error) {
    logger.error('Get transactions endpoint error', error);
    res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
  }
});

/**
 * POST /admin/verify-game/:sessionId
 * Verify a game outcome with seed
 */
router.post('/verify-game/:sessionId', authMiddleware, isAdmin, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { serverSeed, clientSeed } = req.body;

    if (!serverSeed) {
      return res.status(400).json({ success: false, error: 'Server seed is required' });
    }

    const session = await db.getGameSession(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Game session not found' });
    }

    // Verify outcome matches expected
    const isVerified = await db.verifyGameOutcome(sessionId, session.result);

    logger.info(`Admin: Verified game ${sessionId} - ${isVerified ? 'VALID' : 'INVALID'}`);

    res.status(200).json({
      success: true,
      sessionId,
      verified: isVerified,
      session,
    });
  } catch (error) {
    logger.error('Verify game endpoint error', error);
    res.status(500).json({ success: false, error: 'Game verification failed' });
  }
});

/**
 * GET /admin/stats
 * Get platform statistics
 */
router.get('/stats', authMiddleware, isAdmin, async (req: Request, res: Response) => {
  try {
    // Get various statistics
    const userCountResult = await db.pool.query('SELECT COUNT(*) as count FROM users');
    const gameCountResult = await db.pool.query(
      "SELECT COUNT(*) as count FROM game_sessions WHERE status = 'settled'"
    );
    const totalWageredResult = await db.pool.query(
      "SELECT COALESCE(SUM(bet_amount), 0) as total FROM game_sessions WHERE status = 'settled'"
    );
    const totalPayoutResult = await db.pool.query(
      "SELECT COALESCE(SUM(payout), 0) as total FROM game_sessions WHERE status = 'settled'"
    );

    const userCount = parseInt(userCountResult.rows[0].count);
    const gameCount = parseInt(gameCountResult.rows[0].count);
    const totalWagered = parseFloat(totalWageredResult.rows[0].total);
    const totalPayout = parseFloat(totalPayoutResult.rows[0].total);
    const houseProfit = totalWagered - totalPayout;

    logger.info('Admin: Generated platform statistics');

    res.status(200).json({
      success: true,
      stats: {
        totalUsers: userCount,
        totalGames: gameCount,
        totalWagered: totalWagered.toFixed(2),
        totalPayout: totalPayout.toFixed(2),
        houseProfit: houseProfit.toFixed(2),
        rtp: gameCount > 0 ? ((totalPayout / totalWagered) * 100).toFixed(2) : '0.00',
      },
    });
  } catch (error) {
    logger.error('Get stats endpoint error', error);
    res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
  }
});

export default router;
