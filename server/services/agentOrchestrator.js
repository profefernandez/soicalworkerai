const axios = require('axios');

const AGENT_ROLES = {
  CHATBOT: 'chatbot',
  SOCIAL_WORKER: 'social_worker',
  SEARCH: 'search',
  COMMS: 'comms',
  AUDIT: 'audit',
};

const ROLE_TO_ENV = {
  [AGENT_ROLES.CHATBOT]: 'LEMONADE_AGENT_CHATBOT_ID',
  [AGENT_ROLES.SOCIAL_WORKER]: 'LEMONADE_AGENT_SOCIAL_WORKER_ID',
  [AGENT_ROLES.SEARCH]: 'LEMONADE_AGENT_SEARCH_ID',
  [AGENT_ROLES.COMMS]: 'LEMONADE_AGENT_COMMS_ID',
  [AGENT_ROLES.AUDIT]: 'LEMONADE_AGENT_AUDIT_ID',
};

function resolveAgentId(role) {
  const envKey = ROLE_TO_ENV[role];
  if (!envKey) {
    throw new Error(`Unknown agent role: ${role}`);
  }
  return process.env[envKey];
}

/**
 * Call a Launch Lemonade agent by role.
 * @param {string} role — one of AGENT_ROLES values
 * @param {string} input — message/context to send
 * @param {string|null} conversationId — existing conversation (null for new)
 * @returns {Promise<{conversationId: string, response: string}>}
 */
async function callAgent(role, input, conversationId = null) {
  const assistantId = resolveAgentId(role);
  const apiKey = process.env.LEMONADE_API_KEY;
  const apiUrl = process.env.LEMONADE_API_URL;

  if (!assistantId || !apiKey) {
    throw new Error(`Agent ${role} not configured`);
  }

  const payload = {
    assistant_id: assistantId,
    conversation_id: conversationId || '',
    input,
  };

  const response = await axios.post(apiUrl, payload, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  const data = response.data;
  if (data.Error && data.Error !== 'No') {
    throw new Error(`Agent ${role} error: ${data.Error_Reason}`);
  }

  return {
    conversationId: data.Conversation_ID || null,
    response: data.response || data.Response || '',
  };
}

module.exports = { AGENT_ROLES, resolveAgentId, callAgent };
