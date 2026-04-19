import { db } from './database';
import { logger } from '../utils/logger';

/**
 * Affiliate Service
 * Handles referral tracking, commission calculation, and payout management
 */
class AffiliateService {
  private readonly defaultCommissionRate = 10.0; // 10% per referral
  private readonly commissionTriggerAmount = 0; // Trigger commission on any bet

  /**
   * Get or create affiliate code for user
   */
  async getOrCreateAffiliateCode(userId: string): Promise<{
    success: boolean;
    code?: string;
    commissionRate?: number;
    error?: string;
  }> {
    try {
      // Check if user already has affiliate code
      let code = await db.getAffiliateCodeByUserId(userId);

      if (!code) {
        // Create new affiliate code
        code = await db.createAffiliateCode(userId, this.defaultCommissionRate);
      }

      logger.info(`Affiliate code for user ${userId}: ${code.code}`);

      return {
        success: true,
        code: code.code,
        commissionRate: code.commission_rate,
      };
    } catch (error) {
      logger.error('Failed to get/create affiliate code', error);
      return { success: false, error: 'Failed to create affiliate code' };
    }
  }

  /**
   * Register affiliate referral (when referred user joins)
   */
  async registerReferral(referredUserId: string, affiliateCode: string): Promise<{
    success: boolean;
    affiliateId?: string;
    error?: string;
  }> {
    try {
      // Get affiliate code details
      const code = await db.getAffiliateCodeByCode(affiliateCode);
      if (!code) {
        return { success: false, error: 'Invalid affiliate code' };
      }

      // Check if referred user already has a referrer
      const existingReferral = await db.getAffiliateCodeByUserId(referredUserId);
      if (existingReferral) {
        return { success: false, error: 'User already registered with referral' };
      }

      // Create referral record
      const referral = await db.createAffiliateReferral(code.user_id, referredUserId, affiliateCode);

      if (referral) {
        logger.info(`Referral registered: ${code.user_id} → ${referredUserId}`);
        return { success: true, affiliateId: code.user_id };
      } else {
        return { success: false, error: 'Referral already exists' };
      }
    } catch (error) {
      logger.error('Failed to register referral', error);
      return { success: false, error: 'Failed to register referral' };
    }
  }

  /**
   * Calculate and award commission on bet
   */
  async recordBetCommission(userId: string, betAmount: number, payout: number): Promise<void> {
    try {
      // Get user's referrer (if any)
      const referrals = await db.pool.query(
        `SELECT id, affiliate_id FROM affiliate_referrals WHERE referred_user_id = $1`,
        [userId]
      );

      if (referrals.rows.length === 0) {
        return; // User has no referrer
      }

      const referral = referrals.rows[0];
      const affiliateId = referral.affiliate_id;

      // Get affiliate code commission rate
      const affiliateCode = await db.getAffiliateCodeByUserId(affiliateId);
      if (!affiliateCode || !affiliateCode.is_active) {
        return;
      }

      // Calculate commission based on net loss (house profit)
      const houseProfitOnBet = betAmount - payout;
      const commission = (houseProfitOnBet * affiliateCode.commission_rate) / 100;

      if (commission > 0) {
        // Update affiliate referral with commission earned
        await db.updateAffiliateCommission(referral.id, commission);

        logger.info(`Commission awarded: ${affiliateId} earned ${commission} from ${userId}`);
      }
    } catch (error) {
      logger.error('Failed to record bet commission', error);
      // Don't fail the bet if commission recording fails
    }
  }

  /**
   * Get affiliate dashboard stats
   */
  async getAffiliateStats(affiliateId: string): Promise<{
    success: boolean;
    stats?: any;
    error?: string;
  }> {
    try {
      const stats = await db.getAffiliateStats(affiliateId);

      if (!stats) {
        return {
          success: true,
          stats: {
            affiliateId,
            totalReferrals: 0,
            totalCommissionEarned: 0,
            totalPaidOut: 0,
            pendingPayout: 0,
            commissionRate: this.defaultCommissionRate,
          },
        };
      }

      return { success: true, stats };
    } catch (error) {
      logger.error('Failed to get affiliate stats', error);
      return { success: false, error: 'Failed to fetch affiliate stats' };
    }
  }

  /**
   * Get affiliate referrals list
   */
  async getReferrals(affiliateId: string, limit: number = 50): Promise<{
    success: boolean;
    referrals?: any[];
    count?: number;
    error?: string;
  }> {
    try {
      const referrals = await db.getAffiliateReferrals(affiliateId, limit);

      return {
        success: true,
        referrals,
        count: referrals.length,
      };
    } catch (error) {
      logger.error('Failed to get referrals', error);
      return { success: false, error: 'Failed to fetch referrals' };
    }
  }

  /**
   * Request affiliate payout
   */
  async requestPayout(affiliateId: string, amount: number, paymentMethod: string = 'bank_transfer'): Promise<{
    success: boolean;
    payoutId?: string;
    error?: string;
  }> {
    try {
      // Get affiliate stats
      const stats = await db.getAffiliateStats(affiliateId);
      const availableBalance = (stats?.total_commission_earned || 0) - (stats?.total_paid_out || 0);

      if (amount > availableBalance) {
        return {
          success: false,
          error: `Insufficient commission balance. Available: ${availableBalance}`,
        };
      }

      if (amount < 10) {
        return {
          success: false,
          error: 'Minimum payout amount is $10',
        };
      }

      // Create payout request
      const payout = await db.requestAffiliatePayout(affiliateId, amount, paymentMethod);

      logger.info(`Payout requested: ${affiliateId} - ${amount} (${paymentMethod})`);

      return {
        success: true,
        payoutId: payout.id,
      };
    } catch (error) {
      logger.error('Failed to request payout', error);
      return { success: false, error: 'Failed to request payout' };
    }
  }

  /**
   * Get affiliate payout history
   */
  async getPayouts(affiliateId: string, limit: number = 50): Promise<{
    success: boolean;
    payouts?: any[];
    count?: number;
    error?: string;
  }> {
    try {
      const payouts = await db.getAffiliatePayouts(affiliateId, limit);

      return {
        success: true,
        payouts,
        count: payouts.length,
      };
    } catch (error) {
      logger.error('Failed to get payouts', error);
      return { success: false, error: 'Failed to fetch payouts' };
    }
  }

  /**
   * Process payout completion (admin/system function)
   */
  async completePayout(payoutId: string, providerReference: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await db.pool.query(
        `UPDATE affiliate_payouts
         SET status = 'completed', reference = $1, completed_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [providerReference, payoutId]
      );

      logger.info(`Payout completed: ${payoutId}`);

      return { success: true };
    } catch (error) {
      logger.error('Failed to complete payout', error);
      return { success: false, error: 'Failed to complete payout' };
    }
  }

  /**
   * Fail payout (admin/system function)
   */
  async failPayout(payoutId: string, reason: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await db.pool.query(
        `UPDATE affiliate_payouts
         SET status = 'failed', failed_reason = $1, failed_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [reason, payoutId]
      );

      logger.info(`Payout failed: ${payoutId} - ${reason}`);

      return { success: true };
    } catch (error) {
      logger.error('Failed to fail payout', error);
      return { success: false, error: 'Failed to fail payout' };
    }
  }
}

export const affiliateService = new AffiliateService();
