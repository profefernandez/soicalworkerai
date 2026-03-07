describe('Encryption', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    process.env.ENCRYPTION_KEY = 'test-encryption-key-must-be-32-chars!';
    jest.resetModules();
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  test('encrypt returns encrypted string and IV', () => {
    const { encrypt } = require('../middleware/encryption');
    const result = encrypt('hello world');
    expect(result).toHaveProperty('encrypted');
    expect(result).toHaveProperty('iv');
    expect(result.encrypted).not.toBe('hello world');
    expect(result.iv).toHaveLength(32);
  });

  test('decrypt returns original plaintext', () => {
    const { encrypt, decrypt } = require('../middleware/encryption');
    const plaintext = 'This is a crisis message that must be encrypted';
    const { encrypted, iv } = encrypt(plaintext);
    const decrypted = decrypt(encrypted, iv);
    expect(decrypted).toBe(plaintext);
  });

  test('each encryption produces unique IV', () => {
    const { encrypt } = require('../middleware/encryption');
    const r1 = encrypt('same message');
    const r2 = encrypt('same message');
    expect(r1.iv).not.toBe(r2.iv);
    expect(r1.encrypted).not.toBe(r2.encrypted);
  });

  test('decrypt fails with wrong IV', () => {
    const { encrypt, decrypt } = require('../middleware/encryption');
    const { encrypted } = encrypt('secret');
    const wrongIv = 'a'.repeat(32);
    expect(() => decrypt(encrypted, wrongIv)).toThrow();
  });

  test('handles unicode content', () => {
    const { encrypt, decrypt } = require('../middleware/encryption');
    const unicode = 'I feel hopeless \u{1F622} please help';
    const { encrypted, iv } = encrypt(unicode);
    expect(decrypt(encrypted, iv)).toBe(unicode);
  });
});
