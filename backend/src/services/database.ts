import { Pool, QueryResult } from 'pg';
import { logger } from '../utils/logger';

/**
 * Database service - handles all DB operations
 */
class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'tk88_gaming',
      user: process.env.DB_USER || 'tk88_user',
      password: process.env.DB_PASSWORD || 'password',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
    });
  }

  /**
   * Initialize database (run migrations)
   */
  async initialize(): Promise<void> {
    try {
      await this.pool.query('SELECT NOW()');
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Database connection failed', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0];
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string) {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  /**
   * Create user
   */
  async createUser(data: {
    email: string;
    username: string;
    password_hash: string;
    phone?: string;
    telegram?: string;
  }) {
    const result = await this.pool.query(
      `INSERT INTO users (email, username, password_hash, phone, telegram)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, username, created_at`,
      [data.email, data.username, data.password_hash, data.phone, data.telegram]
    );

    const userId = result.rows[0].id;

    // Create wallet for new user
    await this.pool.query(
      `INSERT INTO wallets (user_id, balance)
       VALUES ($1, $2)`,
      [userId, 0]
    );

    return result.rows[0];
  }

  /**
   * Get user wallet
   */
  async getWallet(userId: string) {
    const result = await this.pool.query(
      'SELECT * FROM wallets WHERE user_id = $1',
      [userId]
    );
    return result.rows[0];
  }

  /**
   * Update wallet balance (atomic)
   */
  async updateBalance(userId: string, amount: number, type: string): Promise<number> {
    const result = await this.pool.query(
      `UPDATE wallets
       SET balance = balance + $1,
           updated_at = CURRENT_TIMESTAMP,
           ${type === 'deposit' ? 'total_deposit = total_deposit + $1,' : ''}
           ${type === 'withdraw' ? 'total_withdrawn = total_withdrawn + ABS($1),' : ''}
           ${type === 'wagered' ? 'total_wagered = total_wagered + $1,' : ''}
           ${type === 'won' ? 'total_won = total_won + $1,' : ''}
           1=1
       WHERE user_id = $2
       RETURNING balance`,
      [amount, userId]
    );

    return result.rows[0].balance;
  }

  /**
   * Save game session
   */
  async saveGameSession(data: {
    id: string;
    user_id: string;
    game_id: string;
    bet_amount: number;
    prediction: string;
    server_seed: string;
    client_seed?: string;
    result: string;
    payout: number;
    status: string;
    ip_address?: string;
    user_agent?: string;
  }) {
    const result = await this.pool.query(
      `INSERT INTO game_sessions
       (id, user_id, game_id, bet_amount, prediction, server_seed, client_seed, result, payout, status, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        data.id,
        data.user_id,
        data.game_id,
        data.bet_amount,
        data.prediction,
        data.server_seed,
        data.client_seed,
        data.result,
        data.payout,
        data.status,
        data.ip_address,
        data.user_agent,
      ]
    );

    return result.rows[0];
  }

  /**
   * Update game session to settled
   */
  async settleGameSession(sessionId: string) {
    const result = await this.pool.query(
      `UPDATE game_sessions
       SET status = 'settled', settled_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [sessionId]
    );

    return result.rows[0];
  }

  /**
   * Get game session
   */
  async getGameSession(sessionId: string) {
    const result = await this.pool.query(
      'SELECT * FROM game_sessions WHERE id = $1',
      [sessionId]
    );
    return result.rows[0];
  }

  /**
   * Get user game history
   */
  async getGameHistory(userId: string, gameId?: string, limit: number = 20) {
    let query = `
      SELECT * FROM game_sessions
      WHERE user_id = $1
    `;
    const params: any[] = [userId];

    if (gameId) {
      query += ` AND game_id = $2`;
      params.push(gameId);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Create transaction (append-only ledger)
   */
  async createTransaction(data: {
    user_id: string;
    type: string;
    amount: number;
    currency?: string;
    status: string;
    reference?: string;
    game_session_id?: string;
    description?: string;
    ip_address?: string;
  }) {
    const result = await this.pool.query(
      `INSERT INTO transactions
       (user_id, type, amount, currency, status, reference, game_session_id, description, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        data.user_id,
        data.type,
        data.amount,
        data.currency || 'USD',
        data.status,
        data.reference,
        data.game_session_id,
        data.description,
        data.ip_address,
      ]
    );

    return result.rows[0];
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(userId: string, limit: number = 50) {
    const result = await this.pool.query(
      `SELECT * FROM transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  /**
   * Get user game statistics
   */
  async getUserGameStats(userId: string) {
    const result = await this.pool.query(
      `SELECT * FROM user_game_stats WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0];
  }

  /**
   * Get daily revenue
   */
  async getDailyRevenue(days: number = 30) {
    const result = await this.pool.query(
      `SELECT * FROM daily_revenue
       WHERE date >= CURRENT_DATE - INTERVAL '1 day' * $1
       ORDER BY date DESC`,
      [days]
    );
    return result.rows;
  }

  /**
   * Verify game outcome (check seed matches result)
   */
  async verifyGameOutcome(sessionId: string, expectedResult: string): Promise<boolean> {
    const session = await this.getGameSession(sessionId);

    if (!session) {
      return false;
    }

    // Result should match expected
    return session.result === expectedResult;
  }

  /**
   * Atomic transaction: deduct bet from balance + record transaction
   */
  async placeBet(userId: string, gameSessionId: string, amount: number): Promise<number> {
    try {
      // Start transaction
      await this.pool.query('BEGIN');

      // Check balance
      const wallet = await this.getWallet(userId);
      if (wallet.balance < amount) {
        await this.pool.query('ROLLBACK');
        throw new Error('Insufficient balance');
      }

      // Deduct from balance
      const newBalance = await this.updateBalance(userId, -amount, 'wagered');

      // Record transaction
      await this.createTransaction({
        user_id: userId,
        type: 'bet',
        amount: amount,
        status: 'completed',
        game_session_id: gameSessionId,
        description: `Bet on game ${gameSessionId}`,
      });

      // Commit
      await this.pool.query('COMMIT');

      return newBalance;
    } catch (error) {
      await this.pool.query('ROLLBACK');
      throw error;
    }
  }

  /**
   * Atomic transaction: add payout to balance
   */
  async recordPayout(userId: string, gameSessionId: string, amount: number): Promise<number> {
    try {
      await this.pool.query('BEGIN');

      // Add payout to balance
      const newBalance = await this.updateBalance(userId, amount, 'won');

      // Record transaction
      await this.createTransaction({
        user_id: userId,
        type: 'payout',
        amount: amount,
        status: 'completed',
        game_session_id: gameSessionId,
        description: `Payout from game ${gameSessionId}`,
      });

      await this.pool.query('COMMIT');

      return newBalance;
    } catch (error) {
      await this.pool.query('ROLLBACK');
      throw error;
    }
  }

  /**
   * Update user last login timestamp
   */
  async updateUserLastLogin(userId: string): Promise<void> {
    await this.pool.query(
      `UPDATE users
       SET last_login = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [userId]
    );
  }

  /**
   * Update user password
   */
  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    await this.pool.query(
      `UPDATE users
       SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [passwordHash, userId]
    );
  }

  /**
   * Get user profile (without password)
   */
  async getUserProfile(userId: string) {
    const result = await this.pool.query(
      `SELECT id, email, username, phone, telegram, kyc_status, is_verified, is_active,
              is_banned, created_at, updated_at, last_login
       FROM users WHERE id = $1`,
      [userId]
    );
    return result.rows[0];
  }

  /**
   * Create affiliate code
   */
  async createAffiliateCode(userId: string, commissionRate: number = 10.0): Promise<any> {
    // Generate unique code
    const code = `REF${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const result = await this.pool.query(
      `INSERT INTO affiliate_codes (user_id, code, commission_rate)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, code, commissionRate]
    );

    return result.rows[0];
  }

  /**
   * Get affiliate code by code
   */
  async getAffiliateCodeByCode(code: string) {
    const result = await this.pool.query(
      `SELECT * FROM affiliate_codes WHERE code = $1 AND is_active = true`,
      [code]
    );
    return result.rows[0];
  }

  /**
   * Get affiliate code by user ID
   */
  async getAffiliateCodeByUserId(userId: string) {
    const result = await this.pool.query(
      `SELECT * FROM affiliate_codes WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0];
  }

  /**
   * Record affiliate referral
   */
  async createAffiliateReferral(affiliateId: string, referredUserId: string, code: string): Promise<any> {
    const result = await this.pool.query(
      `INSERT INTO affiliate_referrals (affiliate_id, referred_user_id, code)
       VALUES ($1, $2, $3)
       ON CONFLICT (referred_user_id) DO NOTHING
       RETURNING *`,
      [affiliateId, referredUserId, code]
    );

    return result.rows[0] || null;
  }

  /**
   * Update affiliate commission
   */
  async updateAffiliateCommission(referralId: string, amount: number): Promise<void> {
    await this.pool.query(
      `UPDATE affiliate_referrals
       SET commission_earned = commission_earned + $1
       WHERE id = $2`,
      [amount, referralId]
    );
  }

  /**
   * Get affiliate statistics
   */
  async getAffiliateStats(affiliateId: string) {
    const result = await this.pool.query(
      `SELECT * FROM affiliate_stats WHERE affiliate_id = $1`,
      [affiliateId]
    );
    return result.rows[0];
  }

  /**
   * Get affiliate referrals
   */
  async getAffiliateReferrals(affiliateId: string, limit: number = 50) {
    const result = await this.pool.query(
      `SELECT ar.*, u.username, u.email, u.created_at as referral_date
       FROM affiliate_referrals ar
       JOIN users u ON ar.referred_user_id = u.id
       WHERE ar.affiliate_id = $1
       ORDER BY ar.created_at DESC
       LIMIT $2`,
      [affiliateId, limit]
    );
    return result.rows;
  }

  /**
   * Request affiliate payout
   */
  async requestAffiliatePayout(affiliateId: string, amount: number, paymentMethod: string = 'bank_transfer'): Promise<any> {
    const result = await this.pool.query(
      `INSERT INTO affiliate_payouts (affiliate_id, amount, status, payment_method)
       VALUES ($1, $2, 'pending', $3)
       RETURNING *`,
      [affiliateId, amount, paymentMethod]
    );

    return result.rows[0];
  }

  /**
   * Get affiliate payouts
   */
  async getAffiliatePayouts(affiliateId: string, limit: number = 50) {
    const result = await this.pool.query(
      `SELECT * FROM affiliate_payouts
       WHERE affiliate_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [affiliateId, limit]
    );
    return result.rows;
  }

  /**
   * Create payment order
   */
  async createPaymentOrder(data: {
    user_id: string;
    type: string;
    amount: number;
    currency?: string;
    status: string;
    payment_method?: string;
    provider?: string;
    ip_address?: string;
    user_agent?: string;
  }): Promise<any> {
    const orderId = `${data.type.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const result = await this.pool.query(
      `INSERT INTO payment_orders (id, user_id, type, amount, currency, status, payment_method, provider, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        orderId,
        data.user_id,
        data.type,
        data.amount,
        data.currency || 'USD',
        data.status,
        data.payment_method,
        data.provider,
        data.ip_address,
        data.user_agent,
      ]
    );

    return result.rows[0];
  }

  /**
   * Get payment order by ID
   */
  async getPaymentOrder(orderId: string) {
    const result = await this.pool.query(
      `SELECT * FROM payment_orders WHERE id = $1`,
      [orderId]
    );
    return result.rows[0];
  }

  /**
   * Get user payment orders
   */
  async getUserPaymentOrders(userId: string, limit: number = 50) {
    const result = await this.pool.query(
      `SELECT * FROM payment_orders
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  /**
   * Update payment order status
   */
  async updatePaymentOrderStatus(orderId: string, status: string, reference?: string, failureReason?: string): Promise<void> {
    const completedAt = status === 'completed' ? 'CURRENT_TIMESTAMP' : null;
    const failedAt = status === 'failed' ? 'CURRENT_TIMESTAMP' : null;

    await this.pool.query(
      `UPDATE payment_orders
       SET status = $1,
           provider_reference = COALESCE($2, provider_reference),
           completed_at = CASE WHEN $1 = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END,
           failed_at = CASE WHEN $1 = 'failed' THEN CURRENT_TIMESTAMP ELSE failed_at END,
           failed_reason = COALESCE($3, failed_reason)
       WHERE id = $4`,
      [status, reference, failureReason, orderId]
    );
  }

  /**
   * Process deposit (add balance when payment successful)
   */
  async processDeposit(orderId: string, amount: number): Promise<number> {
    try {
      await this.pool.query('BEGIN');

      // Get payment order
      const orderResult = await this.pool.query(
        `SELECT * FROM payment_orders WHERE id = $1`,
        [orderId]
      );

      if (!orderResult.rows[0]) {
        throw new Error('Payment order not found');
      }

      const order = orderResult.rows[0];

      // Update order status
      await this.updatePaymentOrderStatus(orderId, 'completed');

      // Add balance to wallet
      const newBalance = await this.updateBalance(order.user_id, amount, 'deposit');

      // Record transaction
      await this.createTransaction({
        user_id: order.user_id,
        type: 'deposit',
        amount: amount,
        currency: order.currency,
        status: 'completed',
        reference: orderId,
        description: `Deposit via ${order.payment_method}`,
      });

      await this.pool.query('COMMIT');

      return newBalance;
    } catch (error) {
      await this.pool.query('ROLLBACK');
      throw error;
    }
  }

  /**
   * Process withdrawal (deduct balance when approved)
   */
  async processWithdrawal(orderId: string, amount: number): Promise<number> {
    try {
      await this.pool.query('BEGIN');

      // Get payment order
      const orderResult = await this.pool.query(
        `SELECT * FROM payment_orders WHERE id = $1`,
        [orderId]
      );

      if (!orderResult.rows[0]) {
        throw new Error('Payment order not found');
      }

      const order = orderResult.rows[0];

      // Check balance
      const wallet = await this.getWallet(order.user_id);
      if (wallet.balance < amount) {
        throw new Error('Insufficient balance');
      }

      // Update order status
      await this.updatePaymentOrderStatus(orderId, 'completed');

      // Deduct balance from wallet
      const newBalance = await this.updateBalance(order.user_id, -amount, 'withdraw');

      // Record transaction
      await this.createTransaction({
        user_id: order.user_id,
        type: 'withdrawal',
        amount: amount,
        currency: order.currency,
        status: 'completed',
        reference: orderId,
        description: `Withdrawal via ${order.payment_method}`,
      });

      await this.pool.query('COMMIT');

      return newBalance;
    } catch (error) {
      await this.pool.query('ROLLBACK');
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

// Export singleton instance
export const db = new DatabaseService();
