const axios = require('axios');

const PROVIDERS = {
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    formatRequest: (input, conversationHistory, config) => ({
      model: config.model || 'gpt-4o-mini',
      messages: [
        ...(config.systemPrompt ? [{ role: 'system', content: config.systemPrompt }] : []),
        ...conversationHistory,
        { role: 'user', content: input },
      ],
      max_tokens: 1024,
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content || '',
    parseFullResponse: (data) => ({
      content: data.choices?.[0]?.message?.content || '',
      toolCalls: [],
    }),
    authHeader: (apiKey) => ({ Authorization: `Bearer ${apiKey}` }),
  },
  mistral: {
    url: 'https://api.mistral.ai/v1/conversations',
    formatRequest: (input, conversationHistory, config) => ({
      agent_id: config.agentId || process.env.MISTRAL_AGENT_ID,
      inputs: [
        ...conversationHistory,
        { role: 'user', content: input },
      ],
    }),
    parseResponse: (data) => {
      const outputs = data.outputs || [];
      const assistantMsg = outputs.find((o) => o.role === 'assistant');
      return assistantMsg?.content || '';
    },
    parseFullResponse: (data) => {
      const outputs = data.outputs || [];
      const assistantMsg = outputs.find((o) => o.role === 'assistant');
      const content = assistantMsg?.content || '';
      const rawToolCalls = assistantMsg?.tool_calls || [];
      const toolCalls = rawToolCalls.map((tc) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: typeof tc.function.arguments === 'string'
          ? JSON.parse(tc.function.arguments)
          : tc.function.arguments,
      }));
      return { content, toolCalls };
    },
    authHeader: (apiKey) => ({ Authorization: `Bearer ${apiKey}` }),
  },
};

/**
 * Forward a message to the company's AI provider.
 * @param {string} input - user's message
 * @param {Array} conversationHistory - previous messages [{role, content}]
 * @param {Object} config - { provider, apiKey, model, systemPrompt, agentId, returnFullResponse }
 * @returns {Promise<string|{content: string, toolCalls: Array}>}
 *   If returnFullResponse is true, returns { content, toolCalls }.
 *   Otherwise returns just the content string (backward compatible).
 */
async function proxyToProvider(input, conversationHistory = [], config = {}) {
  const providerName = config.provider || 'openai';
  const provider = PROVIDERS[providerName];
  if (!provider) {
    throw new Error(`Unknown AI provider: ${providerName}`);
  }

  const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(`API key not configured for provider: ${providerName}`);
  }

  const body = provider.formatRequest(input, conversationHistory, config);

  const response = await axios.post(provider.url, body, {
    headers: {
      ...provider.authHeader(apiKey),
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  if (config.returnFullResponse) {
    return provider.parseFullResponse(response.data);
  }
  return provider.parseResponse(response.data);
}

module.exports = { proxyToProvider, PROVIDERS };
