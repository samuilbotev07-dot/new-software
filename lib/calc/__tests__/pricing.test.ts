import { describe, expect, it } from 'vitest';
import {
  bundle,
  discount,
  marginCalc,
  productPrice,
  salesTarget,
  servicePrice,
  whatIf,
} from '../pricing';

describe('1. Цена на продукт', () => {
  it('нормален случай: себестойност 10, желан марж 40%', () => {
    const r = productPrice({ cost: 10, extraPerUnit: 2, desiredMarginPct: 40 });
    expect(r.realCost).toBe(12);
    expect(r.minPrice).toBe(20); // 12 / 0.6
    expect(r.recommendedPrice).toBe(23); // 20 × 1.15
    expect(r.profitPerUnitAtMin).toBe(8);
    expect(r.profitPerUnitAtRecommended).toBe(11);
  });

  it('марж 0% → минималната цена е себестойността', () => {
    const r = productPrice({ cost: 10, extraPerUnit: 0, desiredMarginPct: 0 });
    expect(r.minPrice).toBe(10);
    expect(r.profitPerUnitAtMin).toBe(0);
  });

  it('марж 100%+ се ограничава, не дели на нула', () => {
    const r = productPrice({ cost: 10, extraPerUnit: 0, desiredMarginPct: 100 });
    expect(Number.isFinite(r.minPrice)).toBe(true);
    expect(r.minPrice).toBeGreaterThan(10);
  });

  it('нулев вход → нули, без NaN', () => {
    const r = productPrice({ cost: 0, extraPerUnit: 0, desiredMarginPct: 0 });
    expect(r.minPrice).toBe(0);
    expect(r.recommendedPrice).toBe(0);
  });
});

describe('2. Цена на услуга', () => {
  it('60 мин при 20 €/час + 5 материали', () => {
    const r = servicePrice({
      minutes: 60,
      laborPerHour: 20,
      materials: 5,
      extra: 0,
      desiredMarginPct: 50,
    });
    expect(r.laborCost).toBe(20);
    expect(r.realCost).toBe(25);
    expect(r.minPrice).toBe(50);
  });

  it('нулево време → само материали', () => {
    const r = servicePrice({
      minutes: 0,
      laborPerHour: 20,
      materials: 8,
      extra: 0,
      desiredMarginPct: 0,
    });
    expect(r.laborCost).toBe(0);
    expect(r.minPrice).toBe(8);
  });
});

describe('3. Марж', () => {
  it('цена 50, себестойност 30 → 40% марж', () => {
    const r = marginCalc(50, 30, 0.3);
    expect(r.margin).toBeCloseTo(0.4, 10);
    expect(r.profit).toBe(20);
    expect(r.meetsMin).toBe(true);
  });

  it('себестойност над цената → отрицателен марж, не покрива минимума', () => {
    const r = marginCalc(20, 30, 0.3);
    expect(r.margin).toBeCloseTo(-0.5, 10);
    expect(r.meetsMin).toBe(false);
  });

  it('нулева цена → марж 0, без деление на нула', () => {
    const r = marginCalc(0, 10, 0.3);
    expect(r.margin).toBe(0);
  });
});

describe('4. Какво става ако', () => {
  const rows = whatIf(20, 8, 100);

  it('седем стъпки от −10% до +20%', () => {
    expect(rows.map((r) => r.changePct)).toEqual([-10, -5, 0, 5, 10, 15, 20]);
  });

  it('базовият ред (0%) е текущото състояние', () => {
    const base = rows.find((r) => r.changePct === 0)!;
    expect(base.newPrice).toBe(20);
    expect(base.profitPerUnit).toBe(12);
    expect(base.totalProfit).toBe(1200);
    expect(base.diffVsNow).toBe(0);
  });

  it('+10%: колко клиенти може да загубиш', () => {
    const up = rows.find((r) => r.changePct === 10)!;
    expect(up.newPrice).toBe(22);
    expect(up.profitPerUnit).toBe(14);
    // 1 − 12/14 = 14.28…%
    expect(up.maxClientLossPct).toBeCloseTo((1 - 12 / 14) * 100, 6);
  });

  it('намаление на цената → няма „можеш да загубиш" колона', () => {
    const down = rows.find((r) => r.changePct === -10)!;
    expect(down.maxClientLossPct).toBeNull();
  });

  it('нулев вход не гърми', () => {
    const zero = whatIf(0, 0, 0);
    for (const r of zero) {
      expect(Number.isFinite(r.totalProfit)).toBe(true);
    }
  });
});

describe('5. Цел за продажби', () => {
  it('цел 5000 €, марж 40%, чек 50 € → 250 продажби', () => {
    const r = salesTarget({
      targetProfit: 5000,
      avgMarginPct: 40,
      avgTicket: 50,
      workingDays: 22,
    });
    expect(r.profitPerSale).toBe(20);
    expect(r.neededTotal).toBe(250);
    expect(r.perDay).toBeCloseTo(250 / 30, 10);
    expect(r.perWorkingDay).toBeCloseTo(250 / 22, 10);
  });

  it('нулев марж или чек → 0 нужни продажби, без Infinity', () => {
    const r = salesTarget({ targetProfit: 5000, avgMarginPct: 0, avgTicket: 50, workingDays: 22 });
    expect(r.neededTotal).toBe(0);
    expect(Number.isFinite(r.perWorkingDay)).toBe(true);
  });
});

describe('6. Отстъпка', () => {
  it('20% отстъпка на цена 50 със себестойност 30', () => {
    const r = discount(50, 30, 20);
    expect(r.newPrice).toBe(40);
    expect(r.newMargin).toBeCloseTo(0.25, 10);
    expect(r.profitLossPerUnit).toBe(10); // 20 → 10
    expect(r.requiredSalesIncreasePct).toBeCloseTo(100, 6); // двойно повече
  });

  it('отстъпка 100% → продаваш на 0, компенсация невъзможна', () => {
    const r = discount(50, 30, 100);
    expect(r.newPrice).toBe(0);
    expect(r.requiredSalesIncreasePct).toBeNull();
  });

  it('отстъпка под себестойността → невъзможна компенсация', () => {
    const r = discount(50, 45, 20); // нова цена 40 < 45
    expect(r.requiredSalesIncreasePct).toBeNull();
  });
});

describe('7. Пакет', () => {
  const items = [
    { name: 'А', price: 30, cost: 10 },
    { name: 'Б', price: 25, cost: 8 },
    { name: 'В', price: 20, cost: 5 },
  ];

  it('пакет от 3 позиции на 60 €', () => {
    const r = bundle(items, 60, 0.3);
    expect(r.sumPrice).toBe(75);
    expect(r.discountPct).toBeCloseTo(20, 10);
    expect(r.totalCost).toBe(23);
    expect(r.profit).toBe(37);
    expect(r.margin).toBeCloseTo(37 / 60, 10);
    expect(r.belowMinMargin).toBe(false);
  });

  it('пакет под минималния марж се маркира', () => {
    const r = bundle(items, 30, 0.3);
    expect(r.margin).toBeCloseTo(7 / 30, 10);
    expect(r.belowMinMargin).toBe(true);
  });

  it('празен пакет и нулева цена не гърмят', () => {
    const r = bundle([], 0, 0.3);
    expect(r.sumPrice).toBe(0);
    expect(r.margin).toBe(0);
    expect(r.discountPct).toBe(0);
  });

  it('повече от 5 позиции се отрязват до 5', () => {
    const many = Array.from({ length: 8 }, (_, i) => ({
      name: `П${i}`,
      price: 10,
      cost: 4,
    }));
    const r = bundle(many, 45, 0.3);
    expect(r.sumPrice).toBe(50); // само първите 5
  });
});
