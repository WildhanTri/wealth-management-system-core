import { z } from 'zod';

export const registerSchema = z.object({
  fullname: z.string().min(2, 'Full name must be at least 2 characters').max(255),
  email: z.string().email('Valid email address is required'),
  password: z.string().min(1, 'Encrypted password payload is required'),
});

export const loginSchema = z.object({
  email: z.string().email('Valid email address is required'),
  password: z.string().min(1, 'Encrypted password payload is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email address is required'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(1, 'Encrypted new password payload is required'),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Encrypted current password payload is required'),
  newPassword: z.string().min(1, 'Encrypted new password payload is required'),
});

