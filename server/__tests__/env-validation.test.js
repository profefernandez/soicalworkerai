const { validateEnv } = require('../utils/validateEnv');

describe('validateEnv', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  test('throws when required env vars are missing', () => {
    delete process.env.DB_HOST;
    delete process.env.JWT_SECRET;
    expect(() => validateEnv()).toThrow('Missing required environment variables');
  });

  test('returns true when all required vars present', () => {
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '3306';
    process.env.DB_USER = 'test';
    process.env.DB_PASSWORD = 'test';
    process.env.DB_NAME = 'test';
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRY = '24h';
    process.env.ENCRYPTION_KEY = 'test-key-at-least-32-chars-long!!';
    process.env.LEMONADE_API_KEY = 'test';
    process.env.LEMONADE_API_URL = 'https://example.com';
    process.env.LEMONADE_ASSISTANT_ID = 'test';
    expect(validateEnv()).toBe(true);
  });

  test('lists all missing vars in error message', () => {
    delete process.env.DB_HOST;
    delete process.env.JWT_SECRET;
    delete process.env.ENCRYPTION_KEY;
    try {
      validateEnv();
    } catch (e) {
      expect(e.message).toContain('DB_HOST');
      expect(e.message).toContain('JWT_SECRET');
      expect(e.message).toContain('ENCRYPTION_KEY');
    }
  });
});
