import { db } from './database';
import { logger } from '../utils/logger';

/**
 * Payment Service
 * Handles deposits, withdrawals, and payment processing
 */
class PaymentService {
  private readonly minDepositAmount = 1;
  private readonly maxDepositAmount = 100000;
  private readonly minWithdrawalAmount = 10;
  private readonly maxWithdrawalAmount = 50000;

  /**
   * Request deposit
   */
  async requestDeposit(
    userId: string,
    amount: number,
    paymentMethod: string = 'stripe_card',
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    success: boolean;
    orderId?: string;
    error?: string;
  }> {
    try {
      // Validate amount
      if (amount < this.minDepositAmount || amount > this.maxDepositAmount) {
        return {
          success: false,
          error: `Deposit amount must be between $${this.minDepositAmount} and $${this.maxDepositAmount}`,
        };
      }

      // Validate user exists
      const user = await db.getUserById(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Create payment order
      const order = await db.createPaymentOrder({
        user_id: userId,
        type: 'deposit',
        amount,
        currency: 'USD',
        status: 'pending',
        payment_method: paymentMethod,
        provider: 'stripe', // Default provider
        ip_address: ipAddress,
        user_agent: userAgent,
      });

      logger.info(`Deposit requested: ${userId} - $${amount}`);

      return {
        success: true,
        orderId: order.id,
      };
    } catch (error) {
      logger.error('Failed to request deposit', error);
      return { success: false, error: 'Failed to create deposit order' };
    }
  }

  /**
   * Request withdrawal
   */
  async requestWithdrawal(
    userId: string,
    amount: number,
    paymentMethod: string = 'bank_transfer',
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    success: boolean;
    orderId?: string;
    error?: string;
  }> {
    try {
      // Validate amount
      if (amount < this.minWithdrawalAmount || amount > this.maxWithdrawalAmount) {
        return {
          success: false,
          error: `Withdrawal amount must be between $${this.minWithdrawalAmount} and $${this.maxWithdrawalAmount}`,
        };
      }

      // Validate user exists
      const user = await db.getUserById(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Check user balance
      const wallet = await db.getWallet(userId);
      if (!wallet || wallet.balance < amount) {
        return { success: false, error: 'Insufficient balance' };
      }

      // Create payment order
      const order = await db.createPaymentOrder({
        user_id: userId,
        type: 'withdrawal',
        amount,
        currency: 'USD',
        status: 'pending',
        payment_method: paymentMethod,
        ip_address: ipAddress,
        user_agent: userAgent,
      });

      logger.info(`Withdrawal requested: ${userId} - $${amount}`);

      return {
        success: true,
        orderId: order.id,
      };
    } catch (error) {
      logger.error('Failed to request withdrawal', error);
      return { success: false, error: 'Failed to create withdrawal order' };
    }
  }

  /**
   * Process deposit completion (called by Stripe webhook)
   */
  async completeDeposit(
    orderId: string,
    stripePaymentIntentId: string
  ): Promise<{
    success: boolean;
    newBalance?: number;
    error?: string;
  }> {
    try {
      // Get payment order
      const order = await db.getPaymentOrder(orderId);
      if (!order) {
        return { success: false, error: 'Payment order not found' };
      }

      if (order.type !== 'deposit') {
        return { success: false, error: 'Invalid order type' };
      }

      // Process deposit (atomic transaction)
      const newBalance = await db.processDeposit(orderId, order.amount);

      logger.info(`Deposit completed: ${orderId} - ${order.user_id} - $${order.amount}`);

      return {
        success: true,
        newBalance,
      };
    } catch (error) {
      logger.error('Failed to complete deposit', error);
      // Update order as failed
      await db.updatePaymentOrderStatus(orderId, 'failed', undefined, error instanceof Error ? error.message : 'Unknown error');
      return { success: false, error: 'Failed to process deposit' };
    }
  }

  /**
   * Process withdrawal completion (called by admin/system)
   */
  async completeWithdrawal(
    orderId: string,
    reference?: string
  ): Promise<{
    success: boolean;
    newBalance?: number;
    error?: string;
  }> {
    try {
      // Get payment order
      const order = await db.getPaymentOrder(orderId);
      if (!order) {
        return { success: false, error: 'Payment order not found' };
      }

      if (order.type !== 'withdrawal') {
        return { success: false, error: 'Invalid order type' };
      }

      // Process withdrawal (atomic transaction)
      const newBalance = await db.processWithdrawal(orderId, order.amount);

      logger.info(`Withdrawal completed: ${orderId} - ${order.user_id} - $${order.amount}`);

      return {
        success: true,
        newBalance,
      };
    } catch (error) {
      logger.error('Failed to complete withdrawal', error);
      // Update order as failed
      await db.updatePaymentOrderStatus(orderId, 'failed', undefined, error instanceof Error ? error.message : 'Unknown error');
      return { success: false, error: 'Failed to process withdrawal' };
    }
  }

  /**
   * Cancel payment order
   */
  async cancelPaymentOrder(orderId: string, reason: string = 'Cancelled by user'): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const order = await db.getPaymentOrder(orderId);
      if (!order) {
        return { success: false, error: 'Payment order not found' };
      }

      if (order.status !== 'pending') {
        return { success: false, error: 'Only pending orders can be cancelled' };
      }

      await db.updatePaymentOrderStatus(orderId, 'cancelled', undefined, reason);

      logger.info(`Payment cancelled: ${orderId} - ${reason}`);

      return { success: true };
    } catch (error) {
      logger.error('Failed to cancel payment', error);
      return { success: false, error: 'Failed to cancel payment' };
    }
  }

  /**
   * Get payment order
   */
  async getPaymentOrder(orderId: string): Promise<{
    success: boolean;
    order?: any;
    error?: string;
  }> {
    try {
      const order = await db.getPaymentOrder(orderId);
      if (!order) {
        return { success: false, error: 'Payment order not found' };
      }

      return { success: true, order };
    } catch (error) {
      logger.error('Failed to get payment order', error);
      return { success: false, error: 'Failed to fetch payment order' };
    }
  }

  /**
   * Get user payment history
   */
  async getPaymentHistory(userId: string, limit: number = 50): Promise<{
    success: boolean;
    payments?: any[];
    count?: number;
    error?: string;
  }> {
    try {
      const payments = await db.getUserPaymentOrders(userId, limit);

      return {
        success: true,
        payments,
        count: payments.length,
      };
    } catch (error) {
      logger.error('Failed to get payment history', error);
      return { success: false, error: 'Failed to fetch payment history' };
    }
  }

  /**
   * Validate payment for Stripe (webhook signature verification)
   */
  validateStripeWebhook(rawBody: string, signature: string, secret: string): boolean {
    // This would use Stripe's webhook signature verification
    // For now, return true - implement with stripe library in production
    try {
      // import Stripe from 'stripe';
      // const stripe = new Stripe(secret);
      // const event = stripe.webhooks.constructEvent(rawBody, signature, secret);
      return true;
    } catch (error) {
      logger.error('Invalid Stripe webhook signature', error);
      return false;
    }
  }

  /**
   * Get deposit limits
   */
  getDepositLimits(): {
    min: number;
    max: number;
  } {
    return {
      min: this.minDepositAmount,
      max: this.maxDepositAmount,
    };
  }

  /**
   * Get withdrawal limits
   */
  getWithdrawalLimits(): {
    min: number;
    max: number;
  } {
    return {
      min: this.minWithdrawalAmount,
      max: this.maxWithdrawalAmount,
    };
  }
}

export const paymentService = new PaymentService();
