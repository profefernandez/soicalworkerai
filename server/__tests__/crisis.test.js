const { parseCrisisSignal, CRISIS_SIGNAL, MONITORING_SIGNAL } = require('../services/crisis');

describe('Agent-Driven Crisis Detection', () => {
  test('detects crisis signal in agent response', () => {
    const result = parseCrisisSignal('[CRISIS_PROTOCOL] This person needs immediate help.');
    expect(result.isCrisis).toBe(true);
    expect(result.cleanResponse).toBe('This person needs immediate help.');
  });

  test('detects crisis signal anywhere in response', () => {
    const result = parseCrisisSignal('I detect danger. [CRISIS_PROTOCOL] Activating now.');
    expect(result.isCrisis).toBe(true);
    expect(result.cleanResponse).toBe('I detect danger. Activating now.');
  });

  test('returns false for monitoring-only response', () => {
    const result = parseCrisisSignal('[MONITORING] Conversation appears normal.');
    expect(result.isCrisis).toBe(false);
    expect(result.cleanResponse).toBe('Conversation appears normal.');
  });

  test('returns false for response without any signal', () => {
    const result = parseCrisisSignal('User seems fine, no concerns.');
    expect(result.isCrisis).toBe(false);
    expect(result.cleanResponse).toBe('User seems fine, no concerns.');
  });

  test('handles empty string', () => {
    const result = parseCrisisSignal('');
    expect(result.isCrisis).toBe(false);
    expect(result.cleanResponse).toBe('');
  });

  test('handles null/undefined', () => {
    expect(parseCrisisSignal(null).isCrisis).toBe(false);
    expect(parseCrisisSignal(undefined).isCrisis).toBe(false);
  });

  test('strips both signal tags from response', () => {
    const result = parseCrisisSignal('[CRISIS_PROTOCOL] Help needed');
    expect(result.cleanResponse).not.toContain('[CRISIS_PROTOCOL]');
    expect(result.cleanResponse).not.toContain('[MONITORING]');
  });

  test('exports signal constants', () => {
    expect(CRISIS_SIGNAL).toBe('[CRISIS_PROTOCOL]');
    expect(MONITORING_SIGNAL).toBe('[MONITORING]');
  });
});
