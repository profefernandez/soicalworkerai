const REQUIRED_ENV = [
  'DB_HOST',
  'DB_USER',
  'DB_NAME',
  'JWT_SECRET',
  'ENCRYPTION_KEY',
];

const RECOMMENDED_ENV = [
  'LEMONADE_API_KEY',
  'LEMONADE_API_URL',
  'LEMONADE_AGENT_SOCIAL_WORKER_ID',
];

function validateEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  const missingRecommended = RECOMMENDED_ENV.filter((key) => !process.env[key]);
  if (missingRecommended.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      `Warning: Missing recommended env vars (some features disabled): ${missingRecommended.join(', ')}`
    );
  }
  return true;
}

module.exports = { validateEnv };
