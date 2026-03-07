const {
  validateEmail,
  validatePassword,
  validateUUID,
  validateMessageLength,
  sanitizeString,
} = require('../middleware/validation');

describe('Input Validation', () => {
  describe('validateEmail', () => {
    test('accepts valid email', () => {
      expect(validateEmail('user@example.com')).toBe(true);
    });
    test('rejects invalid email', () => {
      expect(validateEmail('not-an-email')).toBe(false);
    });
    test('rejects empty string', () => {
      expect(validateEmail('')).toBe(false);
    });
    test('rejects email over 255 chars', () => {
      expect(validateEmail('a'.repeat(250) + '@b.com')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    test('accepts password >= 8 chars', () => {
      expect(validatePassword('password123')).toBe(true);
    });
    test('rejects password < 8 chars', () => {
      expect(validatePassword('short')).toBe(false);
    });
    test('rejects password > 128 chars', () => {
      expect(validatePassword('a'.repeat(129))).toBe(false);
    });
  });

  describe('validateUUID', () => {
    test('accepts valid UUID v4', () => {
      expect(validateUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });
    test('rejects invalid UUID', () => {
      expect(validateUUID('not-a-uuid')).toBe(false);
    });
    test('rejects SQL injection in UUID field', () => {
      expect(validateUUID("'; DROP TABLE sessions; --")).toBe(false);
    });
  });

  describe('validateMessageLength', () => {
    test('accepts message under 5000 chars', () => {
      expect(validateMessageLength('hello')).toBe(true);
    });
    test('rejects message over 5000 chars', () => {
      expect(validateMessageLength('a'.repeat(5001))).toBe(false);
    });
    test('rejects empty message', () => {
      expect(validateMessageLength('')).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    test('trims whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });
    test('handles null/undefined gracefully', () => {
      expect(sanitizeString(null)).toBe('');
      expect(sanitizeString(undefined)).toBe('');
    });
  });
});
