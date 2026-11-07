import argon2 from 'argon2';
import crypto from 'crypto';
import { env } from '../config/env.js';

/**
 * Hash a plain text password using Argon2id
 */
export async function hashPassword(plainText: string): Promise<string> {
  return argon2.hash(plainText, {
    type: argon2.argon2id,
  });
}

/**
 * Verify a plain text password against an Argon2 hash
 */
export async function verifyPassword(hash: string, plainText: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plainText);
  } catch {
    return false;
  }
}

/**
 * Decrypt an AES-256-CBC encrypted Base64 string payload into plain text password
 */
export function decryptPasswordPayload(encryptedBase64: string): string {
  if (!encryptedBase64) {
    throw new Error('Encrypted password payload is required');
  }
  try {
    const keyBuf = Buffer.from(env.aes.secretKey, 'utf8');
    const ivBuf = Buffer.from(env.aes.iv, 'utf8');
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuf, ivBuf);
    let decrypted = decipher.update(encryptedBase64, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err: any) {
    throw new Error('Failed to decrypt password payload: Invalid AES-256-CBC ciphertext');
  }
}

/**
 * Generate a cryptographically secure reset token, along with its SHA-256 hash and expiry
 */
export function generateResetToken(): { token: string; hashedToken: string; expiresAt: Date } {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry
  return { token, hashedToken, expiresAt };
}

/**
 * Hash a user-provided reset token to match the database hash
 */
export function hashResetToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}
