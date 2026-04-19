import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { affiliateService } from '../services/affiliate';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /affiliate/code
 * Get user's affiliate code (or create if doesn't exist)
 * Requires authentication
 */
router.get('/code', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const result = await affiliateService.getOrCreateAffiliateCode(userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json({
      success: true,
      code: result.code,
      commissionRate: result.commissionRate,
      shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}?ref=${result.code}`,
    });
  } catch (error) {
    logger.error('Get affiliate code error', error);
    res.status(500).json({ success: false, error: 'Failed to fetch affiliate code' });
  }
});

/**
 * GET /affiliate/stats
 * Get affiliate statistics (referrals, earnings, payouts)
 * Requires authentication
 */
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const result = await affiliateService.getAffiliateStats(userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json({
      success: true,
      stats: result.stats,
    });
  } catch (error) {
    logger.error('Get affiliate stats error', error);
    res.status(500).json({ success: false, error: 'Failed to fetch affiliate stats' });
  }
});

/**
 * GET /affiliate/referrals
 * Get list of referred users
 * Requires authentication
 */
router.get('/referrals', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await affiliateService.getReferrals(userId, limit);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json({
      success: true,
      referrals: result.referrals,
      count: result.count,
    });
  } catch (error) {
    logger.error('Get referrals error', error);
    res.status(500).json({ success: false, error: 'Failed to fetch referrals' });
  }
});

/**
 * POST /affiliate/payout-request
 * Request affiliate payout
 * Requires authentication
 */
router.post('/payout-request', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { amount, paymentMethod = 'bank_transfer' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Payout amount is required and must be positive',
      });
    }

    const result = await affiliateService.requestPayout(userId, amount, paymentMethod);

    if (!result.success) {
      return res.status(400).json(result);
    }

    logger.info(`Payout requested: ${userId} - $${amount}`);

    res.status(201).json({
      success: true,
      payoutId: result.payoutId,
      message: 'Payout request submitted',
    });
  } catch (error) {
    logger.error('Request payout error', error);
    res.status(500).json({ success: false, error: 'Failed to request payout' });
  }
});

/**
 * GET /affiliate/payouts
 * Get payout history
 * Requires authentication
 */
router.get('/payouts', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await affiliateService.getPayouts(userId, limit);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json({
      success: true,
      payouts: result.payouts,
      count: result.count,
    });
  } catch (error) {
    logger.error('Get payouts error', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payouts' });
  }
});

/**
 * POST /affiliate/register
 * Register as referral (when joining with referral code)
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { userId, affiliateCode } = req.body;

    if (!userId || !affiliateCode) {
      return res.status(400).json({
        success: false,
        error: 'userId and affiliateCode are required',
      });
    }

    const result = await affiliateService.registerReferral(userId, affiliateCode);

    if (!result.success) {
      return res.status(400).json(result);
    }

    logger.info(`User ${userId} registered with affiliate code ${affiliateCode}`);

    res.status(200).json({
      success: true,
      message: 'Referral registered successfully',
    });
  } catch (error) {
    logger.error('Register referral error', error);
    res.status(500).json({ success: false, error: 'Failed to register referral' });
  }
});

export default router;
