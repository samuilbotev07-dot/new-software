import { describe, expect, it } from 'vitest';
import { computeMonth } from '../month';
import { computeWarnings } from '../warnings';
import { makeEmptyMonth, makeKnownMonth, makeSettings } from './fixtures';

const s = makeSettings();

describe('computeWarnings', () => {
  it('празен месец → нищо не гърми, само релевантни предупреждения', () => {
    const d = computeMonth(makeEmptyMonth(), s);
    const w = computeWarnings(d, null, null, s);
    // при нулев вход: под целта за печалба и клиенти (целите са зададени)
    expect(w.every((x) => x.text.length > 0)).toBe(true);
    expect(w.some((x) => x.severity === 'critical')).toBe(false);
  });

  it('отрицателен кеш → critical', () => {
    const d = computeMonth(makeKnownMonth({ cashEnd: -500 }), s);
    const w = computeWarnings(d, null, null, s);
    expect(w.some((x) => x.severity === 'critical')).toBe(true);
  });

  it('наем над 25% от оборота', () => {
    const d = computeMonth(
      makeKnownMonth({ expenses: { rent: 2600, salaries: 2300 } }),
      s,
    );
    const w = computeWarnings(d, null, null, s);
    expect(w.some((x) => x.text.includes('Наемът'))).toBe(true);
  });

  it('заплати над 30% от оборота', () => {
    const d = computeMonth(
      makeKnownMonth({ expenses: { rent: 1200, salaries: 3000 } }),
      s,
    );
    const w = computeWarnings(d, null, null, s);
    expect(w.some((x) => x.text.includes('Заплатите'))).toBe(true);
  });

  it('спад над 15% спрямо предходния месец', () => {
    const prev = computeMonth(
      makeKnownMonth({ revenue: { services: 12000 } }),
      s,
    );
    const d = computeMonth(makeKnownMonth(), s); // 9700 < 12000 × 0.85
    const w = computeWarnings(d, prev, null, s);
    expect(w.some((x) => x.text.includes('предходния месец'))).toBe(true);
  });

  it('спад над 20% спрямо година назад', () => {
    const yoy = computeMonth(
      makeKnownMonth({ year: 2025, revenue: { services: 13000 } }),
      s,
    );
    const d = computeMonth(makeKnownMonth(), s);
    const w = computeWarnings(d, null, yoy, s);
    expect(w.some((x) => x.text.includes('миналата година'))).toBe(true);
  });

  it('касова разлика над 2% от оборота → info', () => {
    // разликата във fixture е −100 при праг 194 → няма info
    const clean = computeWarnings(computeMonth(makeKnownMonth(), s), null, null, s);
    expect(clean.some((x) => x.severity === 'info')).toBe(false);

    const d = computeMonth(makeKnownMonth({ cashEnd: 5600 }), s); // разлика +300
    const w = computeWarnings(d, null, null, s);
    expect(w.some((x) => x.severity === 'info')).toBe(true);
  });

  it('под целите за печалба и клиенти', () => {
    const d = computeMonth(makeKnownMonth(), s); // 3430 < 5000, 210 ≥ 200
    const w = computeWarnings(d, null, null, s);
    expect(w.some((x) => x.text.includes('целта ти'))).toBe(true);
    expect(w.some((x) => x.text.includes('клиенти при цел'))).toBe(false);
  });

  it('без зададени цели → няма предупреждения за цели', () => {
    const s2 = makeSettings({ targetProfit: 0, targetClients: 0, minCashBuffer: 0 });
    const d = computeMonth(makeKnownMonth(), s2);
    const w = computeWarnings(d, null, null, s2);
    expect(w.some((x) => x.text.includes('целта ти'))).toBe(false);
  });
});
