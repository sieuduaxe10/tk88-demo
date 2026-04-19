import { Router, Request, Response } from 'express';
import { authService } from '../services/auth';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /auth/register
 * Register new user
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, username, password, phone, telegram } = req.body;

    // Validate required fields
    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email, username, and password are required',
      });
    }

    const result = await authService.register({
      email,
      username,
      password,
      phone,
      telegram,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    logger.info(`User registration API: ${result.userId}`);

    res.status(201).json({
      success: true,
      userId: result.userId,
      token: result.token,
      message: 'Registration successful',
    });
  } catch (error) {
    logger.error('Register endpoint error', error);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

/**
 * POST /auth/login
 * Login user
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    const result = await authService.login(email, password);

    if (!result.success) {
      return res.status(401).json(result);
    }

    logger.info(`User login API: ${result.userId}`);

    res.status(200).json({
      success: true,
      userId: result.userId,
      token: result.token,
      user: result.user,
      message: 'Login successful',
    });
  } catch (error) {
    logger.error('Login endpoint error', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

/**
 * POST /auth/verify
 * Verify JWT token
 */
router.post('/verify', (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required',
      });
    }

    const result = authService.verifyToken(token);

    res.status(200).json({
      success: result.valid,
      userId: result.userId,
      error: result.error,
    });
  } catch (error) {
    logger.error('Verify endpoint error', error);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

/**
 * GET /auth/profile
 * Get current user profile (requires authentication)
 */
router.get('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const profile = await require('../services/database').db.getUserProfile(userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found',
      });
    }

    res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    logger.error('Profile endpoint error', error);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

/**
 * POST /auth/change-password
 * Change user password (requires authentication)
 */
router.post('/change-password', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Old password and new password are required',
      });
    }

    const result = await authService.changePassword(userId, oldPassword, newPassword);

    if (!result.success) {
      return res.status(400).json(result);
    }

    logger.info(`Password changed for user: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    logger.error('Change password endpoint error', error);
    res.status(500).json({ success: false, error: 'Password change failed' });
  }
});

export default router;
