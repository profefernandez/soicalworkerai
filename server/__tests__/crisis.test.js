const { detectCrisis } = require('../services/crisis');

describe('Crisis Detection', () => {
  test('detects direct keyword: suicide', () => {
    const result = detectCrisis('I am thinking about suicide');
    expect(result.isCrisis).toBe(true);
    expect(result.triggers).toContain('suicide');
  });

  test('detects phrase: kill myself', () => {
    const result = detectCrisis('I want to kill myself');
    expect(result.isCrisis).toBe(true);
    expect(result.triggers).toContain('kill myself');
  });

  test('detects regex: i want to die', () => {
    const result = detectCrisis('i want to die right now');
    expect(result.isCrisis).toBe(true);
  });

  test('detects regex: thinking about ending it', () => {
    const result = detectCrisis('I am thinking about ending my life');
    expect(result.isCrisis).toBe(true);
  });

  test('detects case-insensitive', () => {
    const result = detectCrisis('SUICIDE is on my mind');
    expect(result.isCrisis).toBe(true);
  });

  test('does not trigger on safe messages', () => {
    const result = detectCrisis('I had a great day today');
    expect(result.isCrisis).toBe(false);
    expect(result.triggers).toHaveLength(0);
  });

  test('does not trigger on therapy discussion about concepts', () => {
    const result = detectCrisis('Today we discussed coping strategies');
    expect(result.isCrisis).toBe(false);
  });

  test('returns multiple triggers when present', () => {
    const result = detectCrisis('I feel hopeless and suicidal');
    expect(result.isCrisis).toBe(true);
    expect(result.triggers.length).toBeGreaterThanOrEqual(2);
  });

  test('deduplicates triggers', () => {
    const result = detectCrisis('suicide suicide suicide');
    expect(result.isCrisis).toBe(true);
    const unique = new Set(result.triggers);
    expect(result.triggers.length).toBe(unique.size);
  });

  test('handles empty string', () => {
    const result = detectCrisis('');
    expect(result.isCrisis).toBe(false);
  });
});
