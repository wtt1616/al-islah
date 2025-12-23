/**
 * Encryption utility for sensitive data (IC numbers, bank accounts, etc.)
 * Uses AES-256-GCM for authenticated encryption
 */
import crypto from 'crypto';

// Encryption key from environment variable (32 bytes for AES-256)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

// Validate encryption key on module load
if (!ENCRYPTION_KEY) {
  console.warn('WARNING: ENCRYPTION_KEY not set. Encryption/decryption will fail.');
}

// Algorithm configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes for GCM
const AUTH_TAG_LENGTH = 16; // 16 bytes for GCM auth tag
const ENCODING = 'hex';

/**
 * Encrypt sensitive data
 * @param plainText - The plain text to encrypt
 * @returns Encrypted string in format: iv:authTag:encryptedData (hex encoded)
 */
export function encrypt(plainText: string): string {
  if (!plainText) return '';

  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  try {
    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher with key (must be 32 bytes for AES-256)
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    if (key.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
    }

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt the data
    let encrypted = cipher.update(plainText, 'utf8', ENCODING);
    encrypted += cipher.final(ENCODING);

    // Get auth tag for GCM
    const authTag = cipher.getAuthTag();

    // Return format: iv:authTag:encryptedData
    return `${iv.toString(ENCODING)}:${authTag.toString(ENCODING)}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt encrypted data
 * @param encryptedText - The encrypted string in format: iv:authTag:encryptedData
 * @returns Decrypted plain text
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';

  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  try {
    // Check if data is in encrypted format (contains colons)
    if (!encryptedText.includes(':')) {
      // Data is not encrypted (plain text), return as-is
      // This handles backward compatibility with existing unencrypted data
      return encryptedText;
    }

    // Parse the encrypted format
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      // Invalid format, return as-is (might be plain text with colons)
      return encryptedText;
    }

    const [ivHex, authTagHex, encrypted] = parts;

    // Validate hex format
    if (!/^[0-9a-fA-F]+$/.test(ivHex) || !/^[0-9a-fA-F]+$/.test(authTagHex)) {
      // Not valid hex, probably plain text
      return encryptedText;
    }

    const iv = Buffer.from(ivHex, ENCODING);
    const authTag = Buffer.from(authTagHex, ENCODING);
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');

    if (key.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
    }

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt the data
    let decrypted = decipher.update(encrypted, ENCODING, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    // If decryption fails, the data might be plain text
    // Return as-is for backward compatibility
    console.warn('Decryption failed, returning original value:', error);
    return encryptedText;
  }
}

/**
 * Check if a string is encrypted (in our format)
 * @param text - The text to check
 * @returns true if the text appears to be encrypted
 */
export function isEncrypted(text: string): boolean {
  if (!text || !text.includes(':')) return false;

  const parts = text.split(':');
  if (parts.length !== 3) return false;

  const [ivHex, authTagHex] = parts;

  // Check if IV and auth tag are valid hex with expected lengths
  return (
    ivHex.length === IV_LENGTH * 2 &&
    authTagHex.length === AUTH_TAG_LENGTH * 2 &&
    /^[0-9a-fA-F]+$/.test(ivHex) &&
    /^[0-9a-fA-F]+$/.test(authTagHex)
  );
}

/**
 * Mask sensitive data for display (show only last 4 characters)
 * @param text - The text to mask
 * @param visibleChars - Number of characters to show at the end (default: 4)
 * @returns Masked string like ****1234
 */
export function maskSensitiveData(text: string, visibleChars: number = 4): string {
  if (!text) return '';

  // First decrypt if encrypted
  const plainText = decrypt(text);

  if (plainText.length <= visibleChars) {
    return '*'.repeat(plainText.length);
  }

  const masked = '*'.repeat(plainText.length - visibleChars);
  const visible = plainText.slice(-visibleChars);

  return masked + visible;
}

/**
 * Generate a new encryption key (for initial setup)
 * @returns A random 32-byte hex string suitable for ENCRYPTION_KEY
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}
