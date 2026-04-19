import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from './database';
import { logger } from '../utils/logger';

/**
 * Authentication Service
 * Handles user registration, login, token generation, and verification
 */
class AuthService {
  private readonly jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  private readonly jwtExpiry = process.env.JWT_EXPIRY || '7d';
  private readonly bcryptRounds = 10;

  /**
   * Register new user
   */
  async register(data: {
    email: string;
    username: string;
    password: string;
    phone?: string;
    telegram?: string;
  }): Promise<{
    success: boolean;
    userId?: string;
    token?: string;
    error?: string;
  }> {
    try {
      // Validate email format
      if (!this.isValidEmail(data.email)) {
        return { success: false, error: 'Invalid email format' };
      }

      // Validate password strength
      if (!this.isStrongPassword(data.password)) {
        return {
          success: false,
          error: 'Password must be at least 8 characters with uppercase, lowercase, and numbers',
        };
      }

      // Check if user already exists
      const existingUser = await db.getUserByEmail(data.email);
      if (existingUser) {
        return { success: false, error: 'Email already registered' };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, this.bcryptRounds);

      // Create user
      const user = await db.createUser({
        email: data.email,
        username: data.username,
        password_hash: passwordHash,
        phone: data.phone,
        telegram: data.telegram,
      });

      // Generate JWT token
      const token = this.generateToken(user.id);

      logger.info(`User registered: ${user.id} (${user.email})`);

      return {
        success: true,
        userId: user.id,
        token,
      };
    } catch (error) {
      logger.error('User registration failed', error);
      return { success: false, error: 'Registration failed' };
    }
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<{
    success: boolean;
    userId?: string;
    token?: string;
    user?: any;
    error?: string;
  }> {
    try {
      // Find user by email
      const user = await db.getUserByEmail(email);
      if (!user) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Check if user is active
      if (!user.is_active) {
        return { success: false, error: 'Account is inactive' };
      }

      // Check if user is banned
      if (user.is_banned) {
        return { success: false, error: 'Account is banned' };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Generate JWT token
      const token = this.generateToken(user.id);

      // Update last login
      try {
        await db.updateUserLastLogin(user.id);
      } catch (err) {
        logger.warn('Failed to update last login', err);
      }

      logger.info(`User logged in: ${user.id} (${user.email})`);

      return {
        success: true,
        userId: user.id,
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          kyc_status: user.kyc_status,
          is_verified: user.is_verified,
        },
      };
    } catch (error) {
      logger.error('Login failed', error);
      return { success: false, error: 'Login failed' };
    }
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): { valid: boolean; userId?: string; error?: string } {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as { userId: string };
      return { valid: true, userId: decoded.userId };
    } catch (error) {
      return { valid: false, error: 'Invalid or expired token' };
    }
  }

  /**
   * Generate JWT token
   */
  private generateToken(userId: string): string {
    return jwt.sign({ userId }, this.jwtSecret, {
      expiresIn: this.jwtExpiry,
    });
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   * - At least 8 characters
   * - At least one uppercase letter
   * - At least one lowercase letter
   * - At least one number
   */
  private isStrongPassword(password: string): boolean {
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    return true;
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await db.getUserById(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Verify old password
      const isPasswordValid = await bcrypt.compare(oldPassword, user.password_hash);
      if (!isPasswordValid) {
        return { success: false, error: 'Current password is incorrect' };
      }

      // Validate new password
      if (!this.isStrongPassword(newPassword)) {
        return {
          success: false,
          error: 'New password must be at least 8 characters with uppercase, lowercase, and numbers',
        };
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, this.bcryptRounds);

      // Update password in database
      await db.updateUserPassword(userId, passwordHash);

      logger.info(`Password changed for user: ${userId}`);

      return { success: true };
    } catch (error) {
      logger.error('Password change failed', error);
      return { success: false, error: 'Password change failed' };
    }
  }
}

export const authService = new AuthService();
