const REQUIRED_ENV = [
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET',
  'JWT_EXPIRY',
  'ENCRYPTION_KEY',
  'LEMONADE_API_KEY',
  'LEMONADE_API_URL',
  'LEMONADE_ASSISTANT_ID',
];

function validateEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
  return true;
}

module.exports = { validateEnv };
