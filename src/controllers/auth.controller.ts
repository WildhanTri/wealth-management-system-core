import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { User } from '../models/User.js';
import { UserProfile } from '../models/UserProfile.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../validations/auth.schema.js';
import {
  hashPassword,
  verifyPassword,
  decryptPasswordPayload,
  generateResetToken,
  hashResetToken,
} from '../utils/crypto.js';
import { generateToken } from '../middlewares/auth.js';

export class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   * Payload password must be AES-256 encrypted string
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = registerSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await User.findOne({
        where: {
          email: validatedData.email.toLowerCase().trim(),
          is_deleted: false,
        },
      });

      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'An account with this email address already exists.',
        });
        return;
      }

      // Decrypt AES payload
      let plainPassword = '';
      try {
        plainPassword = decryptPasswordPayload(validatedData.password);
      } catch (err: any) {
        res.status(400).json({
          success: false,
          message: err.message || 'Invalid encrypted password payload.',
        });
        return;
      }

      if (plainPassword.length < 6) {
        res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long.',
        });
        return;
      }

      // Hash password using Argon2id
      const hashedPassword = await hashPassword(plainPassword);

      // Create user
      const user = await User.create({
        id: undefined as any,
        fullname: validatedData.fullname.trim(),
        email: validatedData.email.toLowerCase().trim(),
        password: hashedPassword,
        created_by: 'self_registration',
        updated_by: 'self_registration',
        is_active: true,
        is_deleted: false,
      });

      // Automatically initialize default profile for new user
      await UserProfile.create({
        id: undefined as any,
        user_id: user.id,
        name: user.fullname,
        description: 'Personal Wealth Portfolio',
        industry: 'Technology / Professional',
        job_role: 'Professional Specialist',
        age: 28,
        monthly_income: 15000000,
        is_married: false,
        has_dependents: false,
        dependents_count: 0,
        monthly_installments: 0,
        joined_at: new Date(),
        is_onboarded: true,
        created_by: user.id,
        updated_by: user.id,
        is_active: true,
        is_deleted: false,
      });

      const token = generateToken(user);

      res.status(201).json({
        success: true,
        message: 'Account registered successfully',
        data: {
          user: user.toSafeJSON(),
          token,
        },
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors,
        });
        return;
      }

      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error occurred while registering user.',
      });
    }
  }

  /**
   * Login user with credentials
   * POST /api/auth/login
   * Payload password must be AES-256 encrypted string
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = loginSchema.parse(req.body);

      const user = await User.findOne({
        where: {
          email: validatedData.email.toLowerCase().trim(),
          is_deleted: false,
        },
      });

      if (!user || !user.is_active) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password combination.',
        });
        return;
      }

      // Decrypt AES payload
      let plainPassword = '';
      try {
        plainPassword = decryptPasswordPayload(validatedData.password);
      } catch (err: any) {
        res.status(400).json({
          success: false,
          message: err.message || 'Invalid encrypted password payload.',
        });
        return;
      }

      // Verify password with Argon2
      const isValidPassword = await verifyPassword(user.password, plainPassword);
      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password combination.',
        });
        return;
      }

      const token = generateToken(user);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: user.toSafeJSON(),
          token,
        },
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors,
        });
        return;
      }

      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error occurred during login.',
      });
    }
  }

  /**
   * Request password reset token
   * POST /api/auth/forgot-password
   */
  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = forgotPasswordSchema.parse(req.body);

      const user = await User.findOne({
        where: {
          email: validatedData.email.toLowerCase().trim(),
          is_active: true,
          is_deleted: false,
        },
      });

      if (!user) {
        // Return success message even if email not found to prevent user enumeration
        res.status(200).json({
          success: true,
          message: 'If the email is registered, a password reset token has been generated.',
        });
        return;
      }

      const { token, hashedToken, expiresAt } = generateResetToken();

      user.reset_password_token = hashedToken;
      user.reset_password_expires = expiresAt;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Password reset token generated successfully. In production this would be sent to your email.',
        data: {
          resetToken: token,
          expiresAt,
        },
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors,
        });
        return;
      }

      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error occurred while processing forgot password request.',
      });
    }
  }

  /**
   * Reset password with valid token
   * POST /api/auth/reset-password
   * Payload newPassword must be AES-256 encrypted string
   */
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = resetPasswordSchema.parse(req.body);

      const hashedToken = hashResetToken(validatedData.token);

      const user = await User.findOne({
        where: {
          reset_password_token: hashedToken,
          reset_password_expires: {
            [Op.gt]: new Date(),
          },
          is_active: true,
          is_deleted: false,
        },
      });

      if (!user) {
        res.status(400).json({
          success: false,
          message: 'Password reset token is invalid or has expired.',
        });
        return;
      }

      // Decrypt AES payload
      let plainNewPassword = '';
      try {
        plainNewPassword = decryptPasswordPayload(validatedData.newPassword);
      } catch (err: any) {
        res.status(400).json({
          success: false,
          message: err.message || 'Invalid encrypted password payload.',
        });
        return;
      }

      if (plainNewPassword.length < 6) {
        res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long.',
        });
        return;
      }

      // Hash with Argon2
      const hashedPassword = await hashPassword(plainNewPassword);

      user.password = hashedPassword;
      user.reset_password_token = null;
      user.reset_password_expires = null;
      user.updated_by = user.id;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Password has been reset successfully. You can now log in with your new password.',
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors,
        });
        return;
      }

      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error occurred while resetting password.',
      });
    }
  }

  /**
   * Change password for authenticated user
   * POST /api/auth/change-password
   * Payload oldPassword and newPassword must be AES-256 encrypted strings
   */
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required.',
        });
        return;
      }

      const validatedData = changePasswordSchema.parse(req.body);

      // Decrypt AES payloads
      let plainOldPassword = '';
      let plainNewPassword = '';
      try {
        plainOldPassword = decryptPasswordPayload(validatedData.oldPassword);
        plainNewPassword = decryptPasswordPayload(validatedData.newPassword);
      } catch (err: any) {
        res.status(400).json({
          success: false,
          message: err.message || 'Invalid encrypted password payload.',
        });
        return;
      }

      // Verify old password with Argon2
      const isValidOld = await verifyPassword(req.user.password, plainOldPassword);
      if (!isValidOld) {
        res.status(400).json({
          success: false,
          message: 'The current password provided is incorrect.',
        });
        return;
      }

      if (plainNewPassword.length < 6) {
        res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long.',
        });
        return;
      }

      // Hash new password with Argon2
      const newHashedPassword = await hashPassword(plainNewPassword);

      req.user.password = newHashedPassword;
      req.user.updated_by = req.user.id;
      await req.user.save();

      res.status(200).json({
        success: true,
        message: 'Password changed successfully.',
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors,
        });
        return;
      }

      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error occurred while changing password.',
      });
    }
  }

  /**
   * Get current authenticated user details
   * GET /api/auth/me
   */
  static async getMe(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: req.user.toSafeJSON(),
      },
    });
  }
}

