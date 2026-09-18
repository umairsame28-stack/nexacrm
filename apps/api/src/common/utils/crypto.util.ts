import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV for GCM
const AUTH_TAG_LENGTH = 16;
const SALT = 'nexacrm-aes-salt-v1';

/**
 * Derives a 32-byte AES key from a passphrase using scrypt.
 */
function deriveKey(secret: string): Buffer {
  return scryptSync(secret, SALT, 32) as Buffer;
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a base64-encoded string: iv:authTag:ciphertext
 */
export function encrypt(plaintext: string, secret: string): string {
  const key = deriveKey(secret);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  const result = Buffer.concat([iv, authTag, encrypted]);
  return result.toString('base64');
}

/**
 * Decrypts an AES-256-GCM base64-encoded string.
 * Input format: base64(iv:authTag:ciphertext)
 */
export function decrypt(ciphertext: string, secret: string): string {
  const key = deriveKey(secret);
  const data = Buffer.from(ciphertext, 'base64');

  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Safely encrypts a nullable value — returns null if input is null/undefined.
 */
export function encryptNullable(value: string | null | undefined, secret: string): string | null {
  if (value == null) return null;
  return encrypt(value, secret);
}

/**
 * Safely decrypts a nullable value — returns null if input is null/undefined.
 */
export function decryptNullable(value: string | null | undefined, secret: string): string | null {
  if (value == null) return null;
  return decrypt(value, secret);
}
