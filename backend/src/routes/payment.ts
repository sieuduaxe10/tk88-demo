import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { paymentService } from '../services/payment';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /payment/limits
 * Get deposit and withdrawal limits
 */
router.get('/limits', (req: Request, res: Response) => {
  try {
    res.status(200).json({
      success: true,
      deposit: paymentService.getDepositLimits(),
      withdrawal: paymentService.getWithdrawalLimits(),
    });
  } catch (error) {
    logger.error('Get limits error', error);
    res.status(500).json({ success: false, error: 'Failed to fetch limits' });
  }
});

/**
 * POST /payment/deposit
 * Request deposit
 * Requires authentication
 */
router.post('/deposit', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { amount, paymentMethod = 'stripe_card' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Deposit amount is required and must be positive',
      });
    }

    const result = await paymentService.requestDeposit(
      userId,
      amount,
      paymentMethod,
      req.ip,
      req.headers['user-agent']
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    logger.info(`Deposit request: ${userId} - $${amount}`);

    res.status(201).json({
      success: true,
      orderId: result.orderId,
      amount,
      paymentMethod,
      message: 'Deposit request created',
      // In production, would return Stripe client secret here
      // clientSecret: stripePaymentIntent.client_secret
    });
  } catch (error) {
    logger.error('Request deposit error', error);
    res.status(500).json({ success: false, error: 'Failed to create deposit order' });
  }
});

/**
 * POST /payment/withdrawal
 * Request withdrawal
 * Requires authentication
 */
router.post('/withdrawal', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { amount, paymentMethod = 'bank_transfer' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Withdrawal amount is required and must be positive',
      });
    }

    const result = await paymentService.requestWithdrawal(
      userId,
      amount,
      paymentMethod,
      req.ip,
      req.headers['user-agent']
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    logger.info(`Withdrawal request: ${userId} - $${amount}`);

    res.status(201).json({
      success: true,
      orderId: result.orderId,
      amount,
      paymentMethod,
      message: 'Withdrawal request submitted for review',
    });
  } catch (error) {
    logger.error('Request withdrawal error', error);
    res.status(500).json({ success: false, error: 'Failed to create withdrawal order' });
  }
});

/**
 * GET /payment/order/:orderId
 * Get payment order details
 * Requires authentication
 */
router.get('/order/:orderId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const result = await paymentService.getPaymentOrder(orderId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.status(200).json({
      success: true,
      order: result.order,
    });
  } catch (error) {
    logger.error('Get payment order error', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payment order' });
  }
});

/**
 * GET /payment/history
 * Get user payment history
 * Requires authentication
 */
router.get('/history', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const limit = parseInt(req.query.limit as string) || 50;
    const type = req.query.type as string; // 'deposit', 'withdrawal', or undefined for all

    const result = await paymentService.getPaymentHistory(userId, limit);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Filter by type if specified
    let payments = result.payments || [];
    if (type) {
      payments = payments.filter((p) => p.type === type);
    }

    res.status(200).json({
      success: true,
      payments,
      count: payments.length,
    });
  } catch (error) {
    logger.error('Get payment history error', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payment history' });
  }
});

/**
 * POST /payment/cancel/:orderId
 * Cancel pending payment order
 * Requires authentication
 */
router.post('/cancel/:orderId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const result = await paymentService.cancelPaymentOrder(orderId, 'Cancelled by user');

    if (!result.success) {
      return res.status(400).json(result);
    }

    logger.info(`Payment cancelled: ${orderId}`);

    res.status(200).json({
      success: true,
      message: 'Payment order cancelled',
    });
  } catch (error) {
    logger.error('Cancel payment error', error);
    res.status(500).json({ success: false, error: 'Failed to cancel payment' });
  }
});

/**
 * POST /payment/webhook/stripe
 * Stripe webhook for payment confirmations
 * Called by Stripe, not user
 */
router.post('/webhook/stripe', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    const rawBody = JSON.stringify(req.body);

    // Verify webhook signature
    const isValid = paymentService.validateStripeWebhook(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );

    if (!isValid) {
      logger.warn('Invalid Stripe webhook signature');
      return res.status(401).json({ success: false, error: 'Invalid signature' });
    }

    const event = req.body;

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        // Extract order ID from metadata
        const orderId = paymentIntent.metadata?.orderId;

        if (orderId) {
          const result = await paymentService.completeDeposit(orderId, paymentIntent.id);
          if (result.success) {
            logger.info(`Deposit processed via Stripe: ${orderId}`);
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata?.orderId;

        if (orderId) {
          logger.error(`Deposit failed: ${orderId} - ${paymentIntent.last_payment_error?.message}`);
        }
        break;
      }
    }

    // Return 200 to acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Stripe webhook error', error);
    res.status(500).json({ success: false, error: 'Webhook processing failed' });
  }
});

export default router;
