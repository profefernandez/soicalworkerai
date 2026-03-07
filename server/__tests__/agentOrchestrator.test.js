const { resolveAgentId, AGENT_ROLES } = require('../services/agentOrchestrator');

describe('agentOrchestrator', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      LEMONADE_API_KEY: 'test-key',
      LEMONADE_API_URL: 'https://test.api/run_assistant',
      LEMONADE_AGENT_CHATBOT_ID: 'chatbot-123',
      LEMONADE_AGENT_SOCIAL_WORKER_ID: 'sw-456',
      LEMONADE_AGENT_SEARCH_ID: 'search-789',
      LEMONADE_AGENT_COMMS_ID: 'comms-101',
      LEMONADE_AGENT_AUDIT_ID: 'audit-202',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('AGENT_ROLES', () => {
    test('defines all 5 agent roles', () => {
      expect(AGENT_ROLES).toEqual({
        CHATBOT: 'chatbot',
        SOCIAL_WORKER: 'social_worker',
        SEARCH: 'search',
        COMMS: 'comms',
        AUDIT: 'audit',
      });
    });
  });

  describe('resolveAgentId', () => {
    test('resolves chatbot agent ID from env', () => {
      expect(resolveAgentId(AGENT_ROLES.CHATBOT)).toBe('chatbot-123');
    });

    test('resolves social worker agent ID from env', () => {
      expect(resolveAgentId(AGENT_ROLES.SOCIAL_WORKER)).toBe('sw-456');
    });

    test('resolves search agent ID from env', () => {
      expect(resolveAgentId(AGENT_ROLES.SEARCH)).toBe('search-789');
    });

    test('resolves comms agent ID from env', () => {
      expect(resolveAgentId(AGENT_ROLES.COMMS)).toBe('comms-101');
    });

    test('resolves audit agent ID from env', () => {
      expect(resolveAgentId(AGENT_ROLES.AUDIT)).toBe('audit-202');
    });

    test('throws for unknown role', () => {
      expect(() => resolveAgentId('unknown')).toThrow('Unknown agent role');
    });
  });
});
