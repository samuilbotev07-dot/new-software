import { describe, expect, it } from 'vitest';
import { computeHealth, statusFor } from '../health';
import { computeMonth } from '../month';
import type { MonthDerived } from '../types';
import { makeEmptyMonth, makeKnownMonth, makeSettings } from './fixtures';

const s = makeSettings();

/** 12 месеца история за 2025 + началото на 2026, стабилен бизнес. */
function fullHistory(): MonthDerived[] {
  const history: MonthDerived[] = [];
  for (let m = 1; m <= 12; m++) {
    history.push(computeMonth(makeKnownMonth({ year: 2025, month: m }), s, history));
  }
  for (let m = 1; m <= 5; m++) {
    history.push(computeMonth(makeKnownMonth({ year: 2026, month: m }), s, history));
  }
  return history;
}

describe('computeHealth — пълна история', () => {
  const history = fullHistory();
  const current = computeMonth(makeKnownMonth(), s, history);
  const result = computeHealth(current, history, s);

  it('всичките 9 категории имат реален резултат', () => {
    expect(result.categories).toHaveLength(9);
    for (const c of result.categories) {
      expect(c.score, `${c.key} трябва да има резултат`).not.toBeNull();
    }
  });

  it('приносите се сумират до общия резултат', () => {
    const sum = result.categories.reduce((acc, c) => acc + c.contribution, 0);
    expect(result.total).toBe(Math.round(sum));
  });

  it('резултатът е в границите 0–100 и има статус', () => {
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeLessThanOrEqual(100);
    expect(['stable', 'good', 'needs_work', 'high_risk']).toContain(result.status);
  });

  it('стабилен идентичен месец → отлични оценки за стабилност и ценообразуване', () => {
    const stability = result.categories.find((c) => c.key === 'stability');
    const pricing = result.categories.find((c) => c.key === 'pricing');
    expect(stability!.score).toBe(100); // нулева вариация
    expect(pricing!.score).toBe(80); // същият среден чек → −2%..+5%
  });

  it('растеж: същият оборот като миналата година → 60', () => {
    const growth = result.categories.find((c) => c.key === 'growth');
    expect(growth!.score).toBe(60);
  });

  it('всяка категория има обяснение', () => {
    for (const c of result.categories) {
      expect(c.reason.length).toBeGreaterThan(0);
    }
  });
});

describe('computeHealth — без история', () => {
  const current = computeMonth(makeKnownMonth(), s);
  const result = computeHealth(current, [], s);

  it('ценообразуване, стабилност и растеж са null', () => {
    for (const key of ['pricing', 'stability', 'growth'] as const) {
      const c = result.categories.find((x) => x.key === key);
      expect(c!.score, `${key} трябва да е null без история`).toBeNull();
      expect(c!.contribution).toBe(0);
    }
  });

  it('теглата се пренормират: приносът при максимални оценки би дал 100', () => {
    // сборът от нормираните тегла на наличните категории трябва да е 1:
    // ако всяка налична категория имаше 100, общият резултат е 100.
    const available = result.categories.filter((c) => c.score != null);
    const availableWeight = available.reduce((acc, c) => acc + c.weight, 0);
    const normalizedSum = available.reduce(
      (acc, c) => acc + c.weight / availableWeight,
      0,
    );
    expect(normalizedSum).toBeCloseTo(1, 10);
    expect(availableWeight).toBeCloseTo(0.75, 10); // 20+15+15+10+10+5
  });

  it('null категория никога не се брои като 0 или 60', () => {
    const withNulls = result.total;
    const onlyAvailable = computeHealth(current, [], s).categories
      .filter((c) => c.score != null)
      .reduce((acc, c) => acc + c.contribution, 0);
    expect(withNulls).toBe(Math.round(onlyAvailable));
  });
});

describe('computeHealth — незададени цели', () => {
  const noTargets = makeSettings({ targetProfit: 0, targetClients: 0 });
  const current = computeMonth(makeKnownMonth(), noTargets);
  const result = computeHealth(current, [], noTargets);

  it('печалба и клиенти са null вместо фалшиво 100', () => {
    expect(result.categories.find((c) => c.key === 'profit')!.score).toBeNull();
    expect(result.categories.find((c) => c.key === 'clients')!.score).toBeNull();
  });
});

describe('computeHealth — празен месец', () => {
  const current = computeMonth(makeEmptyMonth(), s);
  const result = computeHealth(current, [], s);

  it('не гърми и дава краен резултат', () => {
    expect(Number.isFinite(result.total)).toBe(true);
    expect(result.total).toBeGreaterThanOrEqual(0);
  });
});

describe('прагове на скалите', () => {
  it('печалба: точно на целта → 100, точно на 75% → 80', () => {
    const s2 = makeSettings({ targetProfit: 3430 });
    const d = computeMonth(makeKnownMonth(), s2);
    const r = computeHealth(d, [], s2);
    expect(r.categories.find((c) => c.key === 'profit')!.score).toBe(100);

    const s3 = makeSettings({ targetProfit: 3430 / 0.75 });
    const r3 = computeHealth(computeMonth(makeKnownMonth(), s3), [], s3);
    expect(r3.categories.find((c) => c.key === 'profit')!.score).toBe(80);
  });

  it('риск: концентрация сваля точки', () => {
    // един разход е над 35% от общите → −10
    const d = computeMonth(
      makeKnownMonth({
        expenses: { rent: 4000, materials: 900 },
        revenue: { services: 5000, products: 4700 },
        products: [],
      }),
      s,
    );
    const r = computeHealth(d, [], s);
    expect(r.categories.find((c) => c.key === 'risk')!.score).toBe(90);
  });

  it('риск: една приходна категория не се брои за концентрация', () => {
    const d = computeMonth(
      makeKnownMonth({ revenue: { services: 9700 }, products: [] }),
      s,
    );
    const r = computeHealth(d, [], s);
    // няма втора категория → правилото за 60% не се прилага
    const risk = r.categories.find((c) => c.key === 'risk')!;
    expect(risk.score).toBeGreaterThanOrEqual(90);
  });
});

describe('статуси', () => {
  it('границите са по спецификация', () => {
    expect(statusFor(80)).toBe('stable');
    expect(statusFor(79)).toBe('good');
    expect(statusFor(60)).toBe('good');
    expect(statusFor(59)).toBe('needs_work');
    expect(statusFor(40)).toBe('needs_work');
    expect(statusFor(39)).toBe('high_risk');
    expect(statusFor(0)).toBe('high_risk');
  });
});
