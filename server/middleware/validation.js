const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  if (email.length > 255) return false;
  return EMAIL_REGEX.test(email);
}

function validatePassword(password) {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 8 && password.length <= 128;
}

function validateUUID(uuid) {
  if (!uuid || typeof uuid !== 'string') return false;
  return UUID_REGEX.test(uuid);
}

function validateMessageLength(message) {
  if (!message || typeof message !== 'string') return false;
  return message.length > 0 && message.length <= 5000;
}

function sanitizeString(str) {
  if (str === null || str === undefined) return '';
  return String(str).trim();
}

module.exports = {
  validateEmail,
  validatePassword,
  validateUUID,
  validateMessageLength,
  sanitizeString,
};
