import { describe, expect, it } from 'vitest';
import { computeMonth, topExpenses, topProducts, worstProducts } from '../month';
import { makeEmptyMonth, makeKnownMonth, makeSettings } from './fixtures';

const s = makeSettings();

function expectAllFinite(obj: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'number') {
      expect(Number.isFinite(value), `${key} трябва да е крайно число`).toBe(true);
    }
  }
}

describe('computeMonth — известен месец (ръчно изчислен)', () => {
  const d = computeMonth(makeKnownMonth(), s);

  it('оборот и разходи', () => {
    expect(d.totalRevenue).toBe(9700);
    expect(d.totalExpenses).toBe(4900);
  });

  it('ДДС и общо към държавата', () => {
    expect(d.vatDue).toBe(800); // 1616,67 − 816,67 — точно, без float грешка
    expect(d.totalToState).toBe(1370); // 800 + 420 + 0 + 150 + 0
  });

  it('печалби и марж', () => {
    expect(d.grossProfit).toBe(4800);
    expect(d.netProfit).toBe(3430);
    expect(d.margin).toBeCloseTo(3430 / 9700, 10);
  });

  it('среден чек и оборот на работен ден', () => {
    expect(d.avgTicket).toBeCloseTo(9700 / 210, 10);
    expect(d.revenuePerWorkingDay).toBeCloseTo(9700 / 22, 10);
  });

  it('кеш', () => {
    expect(d.cashChange).toBe(3200);
    expect(d.computedCashEnd).toBe(5300); // 2000 + 9700 − 6400
    expect(d.cashDiscrepancy).toBe(-100);
  });

  it('дял на разходите и кеш буфер (без история → текущият месец)', () => {
    expect(d.expenseRatio).toBeCloseTo(4900 / 9700, 10);
    expect(d.cashBufferMonths).toBeCloseTo(5200 / 6270, 10);
  });

  it('продукти', () => {
    const [cut, dye, shampoo] = d.products;
    expect(cut!.revenue).toBe(2500);
    expect(cut!.profit).toBe(2000);
    expect(cut!.margin).toBeCloseTo(0.8, 10);
    expect(cut!.profitPerHour).toBeCloseTo(40, 10); // 2000 € / 50 часа
    expect(dye!.profitPerHour).toBeCloseTo(28, 10); // 1260 € / 45 часа
    expect(shampoo!.profitPerHour).toBeNull(); // без времетраене
  });

  it('кеш буфер с история — средно от последните до 6 месеца', () => {
    const history = [
      computeMonth(makeKnownMonth({ month: 4 }), s),
      computeMonth(makeKnownMonth({ month: 5 }), s),
    ];
    const withHistory = computeMonth(makeKnownMonth(), s, history);
    // всяка история има разход 4900 + 1370 = 6270 → средно 6270
    expect(withHistory.cashBufferMonths).toBeCloseTo(5200 / 6270, 10);
  });
});

describe('computeMonth — нулев вход', () => {
  const d = computeMonth(makeEmptyMonth(), s);

  it('нищо не е NaN или Infinity', () => {
    expectAllFinite(d as unknown as Record<string, unknown>);
  });

  it('всички деления връщат 0', () => {
    expect(d.margin).toBe(0);
    expect(d.avgTicket).toBe(0);
    expect(d.revenuePerWorkingDay).toBe(0);
    expect(d.expenseRatio).toBe(0);
    expect(d.cashBufferMonths).toBe(0);
  });

  it('невалидни числа във входа стават 0', () => {
    const dirty = computeMonth(
      makeEmptyMonth({
        revenue: { services: Number.NaN },
        expenses: { rent: Number.POSITIVE_INFINITY },
        clients: Number.NaN,
      }),
      s,
    );
    expect(dirty.totalRevenue).toBe(0);
    expect(dirty.totalExpenses).toBe(0);
    expect(dirty.clients).toBe(0);
  });

  it('float събиране е точно през центове', () => {
    const f = computeMonth(
      makeEmptyMonth({ revenue: { services: 0.1, products: 0.2 } }),
      s,
    );
    expect(f.totalRevenue).toBe(0.3); // не 0.30000000000000004
  });
});

describe('класации', () => {
  const d = computeMonth(makeKnownMonth(), s);

  it('топ разходи — низходящо, с дялове', () => {
    const top = topExpenses(d, s, 5);
    expect(top.map((e) => e.categoryId)).toEqual([
      'salaries',
      'rent',
      'materials',
      'marketing',
    ]);
    expect(top[0]!.name).toBe('Заплати');
    expect(top[0]!.shareOfRevenue).toBeCloseTo(2600 / 9700, 10);
    expect(top[0]!.shareOfExpenses).toBeCloseTo(2600 / 4900, 10);
  });

  it('топ и слаби продукти по печалба', () => {
    expect(topProducts(d.products, 2).map((p) => p.name)).toEqual([
      'Подстрижка',
      'Боядисване',
    ]);
    expect(worstProducts(d.products, 1).map((p) => p.name)).toEqual(['Шампоан']);
  });

  it('празен месец → празни класации', () => {
    const empty = computeMonth(makeEmptyMonth(), s);
    expect(topExpenses(empty, s)).toEqual([]);
    expect(topProducts(empty.products)).toEqual([]);
  });
});
