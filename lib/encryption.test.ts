import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Store original env
const originalEnv = process.env;

describe('Encryption', () => {
  beforeEach(() => {
    // Reset modules to ensure clean state
    vi.resetModules();
    // Set up test encryption key (32 bytes in base64)
    process.env = {
      ...originalEnv,
      ENCRYPTION_KEY: 'dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcw==', // Test key
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should encrypt and decrypt JSON data correctly', async () => {
    // Import after setting env
    const { encryptJson, decryptJson } = await import('./encryption');

    const testData = {
      access_token: 'test_token_123',
      refresh_token: 'refresh_456',
      expires_in: 3600,
    };

    const encrypted = encryptJson(testData);

    // Encrypted data should be a string
    expect(typeof encrypted).toBe('string');

    // Encrypted data should be different from original
    expect(encrypted).not.toContain('test_token_123');

    // Should decrypt back to original
    const decrypted = decryptJson(encrypted);
    expect(decrypted).toEqual(testData);
  });

  it('should produce different ciphertexts for same data (due to IV)', async () => {
    const { encryptJson } = await import('./encryption');

    const testData = { secret: 'value' };

    const encrypted1 = encryptJson(testData);
    const encrypted2 = encryptJson(testData);

    // Due to random IV, same data should produce different ciphertext
    expect(encrypted1).not.toBe(encrypted2);
  });

  it('should handle complex nested objects', async () => {
    const { encryptJson, decryptJson } = await import('./encryption');

    const testData = {
      user: {
        id: 123,
        name: 'Test User',
        settings: {
          notifications: true,
          theme: 'dark',
        },
      },
      tokens: ['a', 'b', 'c'],
      meta: {
        created: new Date().toISOString(),
      },
    };

    const encrypted = encryptJson(testData);
    const decrypted = decryptJson(encrypted);

    expect(decrypted).toEqual(testData);
  });

  it('should throw error when decrypting tampered data', async () => {
    const { encryptJson, decryptJson } = await import('./encryption');

    const testData = { secret: 'value' };
    const encrypted = encryptJson(testData);

    // Tamper with the ciphertext
    const tampered = encrypted.slice(0, -10) + 'aaaaaaaaaa';

    expect(() => decryptJson(tampered)).toThrow();
  });

  it('should throw error when decrypting invalid base64', async () => {
    const { decryptJson } = await import('./encryption');

    expect(() => decryptJson('not-valid-base64!!!')).toThrow();
  });

  it('should handle empty objects', async () => {
    const { encryptJson, decryptJson } = await import('./encryption');

    const testData = {};
    const encrypted = encryptJson(testData);
    const decrypted = decryptJson(encrypted);

    expect(decrypted).toEqual(testData);
  });

  it('should handle arrays', async () => {
    const { encryptJson, decryptJson } = await import('./encryption');

    const testData = [1, 2, 3, 'test', { nested: true }];
    const encrypted = encryptJson(testData);
    const decrypted = decryptJson(encrypted);

    expect(decrypted).toEqual(testData);
  });
});
