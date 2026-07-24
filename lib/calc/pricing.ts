/**
 * Седемте калкулатора за ценообразуване. Чисти функции.
 * Маржовете са дялове 0..1. Никое деление не хвърля — невъзможен
 * резултат е 0 или null (UI показва „—").
 */
import { fromCents, safeDiv, subtract, sum, toCents, finite } from './money';

/** Марж, подаден като процент (напр. 40) → дял 0..1, ограничен до [0, 0.99]. */
function marginShare(pct: number): number {
  const v = finite(pct) / 100;
  return Math.min(0.99, Math.max(0, v));
}

// 1. Цена на продукт
export interface ProductPriceInput {
  cost: number;
  extraPerUnit: number;
  desiredMarginPct: number;
}
export interface ProductPriceResult {
  realCost: number;
  minPrice: number;
  recommendedPrice: number;
  profitPerUnitAtMin: number;
  profitPerUnitAtRecommended: number;
}
export function productPrice(input: ProductPriceInput): ProductPriceResult {
  const realCost = sum(input.cost, input.extraPerUnit);
  const m = marginShare(input.desiredMarginPct);
  const minPrice = fromCents(Math.round(toCents(realCost) / (1 - m)));
  const recommendedPrice = fromCents(Math.round(toCents(minPrice) * 1.15));
  return {
    realCost,
    minPrice,
    recommendedPrice,
    profitPerUnitAtMin: subtract(minPrice, realCost),
    profitPerUnitAtRecommended: subtract(recommendedPrice, realCost),
  };
}

// 2. Цена на услуга
export interface ServicePriceInput {
  minutes: number;
  laborPerHour: number;
  materials: number;
  extra: number;
  desiredMarginPct: number;
}
export interface ServicePriceResult extends ProductPriceResult {
  laborCost: number;
}
export function servicePrice(input: ServicePriceInput): ServicePriceResult {
  const laborCost = fromCents(
    Math.round((finite(input.minutes) / 60) * toCents(input.laborPerHour)),
  );
  const base = productPrice({
    cost: sum(laborCost, input.materials),
    extraPerUnit: finite(input.extra),
    desiredMarginPct: input.desiredMarginPct,
  });
  return { ...base, laborCost };
}

// 3. Марж
export interface MarginResult {
  margin: number;
  profit: number;
  meetsMin: boolean;
}
export function marginCalc(price: number, cost: number, minMargin: number): MarginResult {
  const profit = subtract(finite(price), finite(cost));
  const margin = safeDiv(profit, finite(price));
  return { margin, profit, meetsMin: margin >= minMargin };
}

// 4. Какво става ако (промяна на цената)
export interface WhatIfRow {
  /** Промяна в проценти: −10, −5, 0, +5, +10, +15, +20. */
  changePct: number;
  newPrice: number;
  profitPerUnit: number;
  totalProfit: number;
  diffVsNow: number;
  /**
   * До колко % клиенти може да загубиш и пак да си поне на текущата
   * обща печалба. null когато не е приложимо (по-ниска печалба на бройка
   * или продажба на загуба).
   */
  maxClientLossPct: number | null;
}
export const WHAT_IF_STEPS = [-10, -5, 0, 5, 10, 15, 20] as const;
export function whatIf(price: number, cost: number, monthlySales: number): WhatIfRow[] {
  const sales = Math.max(0, Math.trunc(finite(monthlySales)));
  const currentProfitPerUnit = subtract(finite(price), finite(cost));
  const currentTotal = fromCents(toCents(currentProfitPerUnit) * sales);

  return WHAT_IF_STEPS.map((changePct) => {
    const newPrice = fromCents(Math.round(toCents(price) * (1 + changePct / 100)));
    const profitPerUnit = subtract(newPrice, finite(cost));
    const totalProfit = fromCents(toCents(profitPerUnit) * sales);
    const diffVsNow = subtract(totalProfit, currentTotal);

    let maxClientLossPct: number | null = null;
    if (profitPerUnit > 0 && profitPerUnit > currentProfitPerUnit) {
      // profitPerUnit × sales × (1 − x) ≥ currentProfitPerUnit × sales
      maxClientLossPct = (1 - safeDiv(currentProfitPerUnit, profitPerUnit)) * 100;
    }

    return { changePct, newPrice, profitPerUnit, totalProfit, diffVsNow, maxClientLossPct };
  });
}

// 5. Цел за продажби
export interface SalesTargetInput {
  targetProfit: number;
  avgMarginPct: number;
  avgTicket: number;
  workingDays: number;
}
export interface SalesTargetResult {
  profitPerSale: number;
  neededTotal: number;
  perDay: number;
  perWorkingDay: number;
}
export function salesTarget(input: SalesTargetInput): SalesTargetResult {
  const m = marginShare(input.avgMarginPct);
  const profitPerSale = fromCents(Math.round(toCents(input.avgTicket) * m));
  const neededTotal =
    profitPerSale > 0 ? Math.ceil(safeDiv(finite(input.targetProfit), profitPerSale)) : 0;
  const workingDays = Math.max(0, Math.trunc(finite(input.workingDays)));
  return {
    profitPerSale,
    neededTotal,
    perDay: safeDiv(neededTotal, 30),
    perWorkingDay: safeDiv(neededTotal, workingDays),
  };
}

// 6. Отстъпка
export interface DiscountResult {
  newPrice: number;
  newMargin: number;
  profitLossPerUnit: number;
  /**
   * С колко % повече продажби трябва за същата обща печалба.
   * null когато е невъзможно (нулева или отрицателна нова печалба).
   */
  requiredSalesIncreasePct: number | null;
}
export function discount(price: number, cost: number, discountPct: number): DiscountResult {
  const pct = Math.min(100, Math.max(0, finite(discountPct)));
  const newPrice = fromCents(Math.round(toCents(price) * (1 - pct / 100)));
  const oldProfit = subtract(finite(price), finite(cost));
  const newProfit = subtract(newPrice, finite(cost));
  const requiredSalesIncreasePct =
    newProfit > 0 && oldProfit > 0
      ? (safeDiv(oldProfit, newProfit) - 1) * 100
      : null;
  return {
    newPrice,
    newMargin: safeDiv(newProfit, newPrice),
    profitLossPerUnit: subtract(oldProfit, newProfit),
    requiredSalesIncreasePct,
  };
}

// 7. Пакет
export interface BundleItem {
  name: string;
  price: number;
  cost: number;
}
export interface BundleResult {
  sumPrice: number;
  discountPct: number;
  totalCost: number;
  profit: number;
  margin: number;
  belowMinMargin: boolean;
}
export function bundle(
  items: BundleItem[],
  bundlePrice: number,
  minMargin: number,
): BundleResult {
  const list = items.slice(0, 5);
  const sumPrice = fromCents(list.reduce((acc, i) => acc + toCents(i.price), 0));
  const totalCost = fromCents(list.reduce((acc, i) => acc + toCents(i.cost), 0));
  const priceC = toCents(bundlePrice);
  const profit = fromCents(priceC - toCents(totalCost));
  const margin = safeDiv(profit, fromCents(priceC));
  return {
    sumPrice,
    discountPct: safeDiv(toCents(sumPrice) - priceC, toCents(sumPrice)) * 100,
    totalCost,
    profit,
    margin,
    belowMinMargin: margin < minMargin,
  };
}
