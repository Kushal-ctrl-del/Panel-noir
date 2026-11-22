const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('Persona & Contract Specifications', () => {
  it('should validate standard panelist response schema', () => {
    const sampleOutput = JSON.stringify({
      take: 'Solid premise with strong enterprise demand.',
      concern_or_praise: 'CAC might balloon if direct sales is required.',
      question: 'What is your month 1 payback period?'
    });

    const parsed = JSON.parse(sampleOutput);
    assert.strictEqual(typeof parsed.take, 'string');
    assert.strictEqual(typeof parsed.concern_or_praise, 'string');
    assert.strictEqual(typeof parsed.question, 'string');
    assert.ok(parsed.take.length > 0);
  });

  it('should handle optional question field as empty string', () => {
    const sampleOutput = JSON.stringify({
      take: 'Clear win.',
      concern_or_praise: 'Existing competitors lack this specific workflow.',
      question: ''
    });

    const parsed = JSON.parse(sampleOutput);
    assert.strictEqual(parsed.question, '');
  });
});

describe('Moderator Consensus & Stance Normalization', () => {
  function normalizeModeratorVerdict(raw) {
    const against = Number(raw.against_pct) || 0;
    const mixed = Number(raw.mixed_pct) || 0;
    const forPct = Number(raw.for_pct) || 0;
    const total = against + mixed + forPct;

    const VALID_STANCES = ['negative', 'mixed', 'positive'];
    const fallbackStances = {
      investor: 'mixed',
      budget_founder: 'mixed',
      early_adopter: 'mixed'
    };

    if (total === 0) {
      return {
        against_pct: 33,
        mixed_pct: 34,
        for_pct: 33,
        verdict: 'Panel split evenly',
        stances: fallbackStances
      };
    }

    const rawStances = raw.stances || {};
    const stances = {
      investor: VALID_STANCES.includes(rawStances.investor) ? rawStances.investor : 'mixed',
      budget_founder: VALID_STANCES.includes(rawStances.budget_founder) ? rawStances.budget_founder : 'mixed',
      early_adopter: VALID_STANCES.includes(rawStances.early_adopter) ? rawStances.early_adopter : 'mixed'
    };

    const againstNorm = Math.round((against / total) * 100);
    const mixedNorm = Math.round((mixed / total) * 100);
    const forNorm = 100 - (againstNorm + mixedNorm); // Guarantees exact 100% total

    return {
      against_pct: againstNorm,
      mixed_pct: mixedNorm,
      for_pct: forNorm,
      verdict: String(raw.verdict || 'Mixed reaction from the panel'),
      stances
    };
  }

  it('should guarantee percentage breakdown sums to exactly 100', () => {
    const testCases = [
      { against_pct: 40, mixed_pct: 30, for_pct: 30 },
      { against_pct: 33, mixed_pct: 33, for_pct: 33 },
      { against_pct: 10, mixed_pct: 20, for_pct: 70 },
      { against_pct: 1, mixed_pct: 1, for_pct: 1 }
    ];

    for (const tc of testCases) {
      const res = normalizeModeratorVerdict(tc);
      const sum = res.against_pct + res.mixed_pct + res.for_pct;
      assert.strictEqual(sum, 100, `Expected sum 100 but got ${sum} for case ${JSON.stringify(tc)}`);
    }
  });

  it('should sanitize invalid stances to fallback mixed', () => {
    const raw = {
      against_pct: 50,
      mixed_pct: 25,
      for_pct: 25,
      stances: {
        investor: 'super_bullish', // invalid
        budget_founder: 'negative',
        early_adopter: null        // invalid
      }
    };

    const res = normalizeModeratorVerdict(raw);
    assert.strictEqual(res.stances.investor, 'mixed');
    assert.strictEqual(res.stances.budget_founder, 'negative');
    assert.strictEqual(res.stances.early_adopter, 'mixed');
  });

  it('should provide safe fallbacks when moderator output is completely empty', () => {
    const res = normalizeModeratorVerdict({});
    assert.strictEqual(res.against_pct + res.mixed_pct + res.for_pct, 100);
    assert.strictEqual(res.verdict, 'Panel split evenly');
    assert.strictEqual(res.stances.investor, 'mixed');
  });
});

describe('Input Validation & Security Boundaries', () => {
  function validateTopic(topic) {
    if (!topic || typeof topic !== 'string') {
      return { valid: false, error: 'Topic must be a non-empty string' };
    }
    const trimmed = topic.trim();
    if (trimmed.length === 0) {
      return { valid: false, error: 'Topic cannot be empty' };
    }
    if (trimmed.length > 2000) {
      return { valid: false, error: 'Topic exceeds maximum allowable length of 2000 characters' };
    }
    return { valid: true, sanitized: trimmed };
  }

  it('should accept well-formed topics', () => {
    const res = validateTopic('A platform for autonomous AI agent evaluation');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.sanitized, 'A platform for autonomous AI agent evaluation');
  });

  it('should reject empty or whitespace-only inputs', () => {
    assert.strictEqual(validateTopic('').valid, false);
    assert.strictEqual(validateTopic('   ').valid, false);
    assert.strictEqual(validateTopic(null).valid, false);
    assert.strictEqual(validateTopic(12345).valid, false);
  });

  it('should reject inputs exceeding maximum safe length', () => {
    const huge = 'a'.repeat(2001);
    const res = validateTopic(huge);
    assert.strictEqual(res.valid, false);
    assert.match(res.error, /maximum allowable length/);
  });
});
