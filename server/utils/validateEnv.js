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
  'LEMONADE_AGENT_CHATBOT_ID',
  'LEMONADE_AGENT_SOCIAL_WORKER_ID',
  'LEMONADE_AGENT_SEARCH_ID',
  'LEMONADE_AGENT_COMMS_ID',
  'LEMONADE_AGENT_AUDIT_ID',
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
