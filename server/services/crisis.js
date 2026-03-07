// Crisis detection: agent-driven via Social Worker AI
//
// The Social Worker AI agent silently monitors every conversation.
// When it determines crisis protocol should activate, it includes
// [CRISIS_PROTOCOL] in its response. The server parses this signal.
// The agent's monitoring response is NEVER shown to the end user.

const CRISIS_SIGNAL = '[CRISIS_PROTOCOL]';
const MONITORING_SIGNAL = '[MONITORING]';

/**
 * Parse the Social Worker AI agent's monitoring response for a crisis signal.
 * @param {string} agentResponse — the full response from the monitoring agent
 * @returns {{ isCrisis: boolean, cleanResponse: string }}
 */
function parseCrisisSignal(agentResponse) {
  if (!agentResponse || typeof agentResponse !== 'string') {
    return { isCrisis: false, cleanResponse: '' };
  }

  const isCrisis = agentResponse.includes(CRISIS_SIGNAL);

  // Strip the signal tags from the response so the user never sees them
  const cleanResponse = agentResponse
    .replace(CRISIS_SIGNAL, '')
    .replace(MONITORING_SIGNAL, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return { isCrisis, cleanResponse };
}

module.exports = { parseCrisisSignal, CRISIS_SIGNAL, MONITORING_SIGNAL };
