/**
 * Security and Cryptographic Utilities for StepWise
 * Implements client-safe standard Web Crypto SHA-256 password hashing.
 */

const SALT = 'stepwise_college_salt_2026_mit';

/**
 * Computes SHA-256 hash of a password string with salt
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + SALT);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    // Fallback simple hex hash in case crypto.subtle is restricted
    let hash = 0;
    const str = password + SALT;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `fb_${Math.abs(hash).toString(16)}`;
  }
}

/**
 * Standard pre-hashed representation for default sample accounts
 * Password: "password123"
 */
export const DEFAULT_DEMO_PASSWORD = 'password123';
export const DEFAULT_PASSWORD_HASH = 'e9b30c14b27814b7e0bbdfa164b3602f37e408ec21c1794ee6a58bc8303d8df5';
