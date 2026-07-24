/**
 * Парична аритметика. Всички суми се смятат в евроцентове (цели числа),
 * за да няма float-грешки при събиране. Закръгляне — само при показване.
 */

/** Превръща евро в цели центове. Невалидни стойности стават 0. */
export function toCents(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0;
  return Math.round(value * 100);
}

/** Центове обратно в евро. */
export function fromCents(cents: number): number {
  return cents / 100;
}

/** Сумира стойностите на обект { категория: сума в евро } точно, през центове. */
export function sumValues(values: Record<string, number> | null | undefined): number {
  if (!values) return 0;
  let cents = 0;
  for (const v of Object.values(values)) cents += toCents(v);
  return fromCents(cents);
}

/** Точно събиране на списък от евро-суми. */
export function sum(...values: Array<number | null | undefined>): number {
  let cents = 0;
  for (const v of values) cents += toCents(v);
  return fromCents(cents);
}

/** Точно изваждане a − b в евро. */
export function subtract(a: number, b: number): number {
  return fromCents(toCents(a) - toCents(b));
}

/** Деление, което никога не хвърля: знаменател 0 или невалиден → 0. */
export function safeDiv(numerator: number, denominator: number): number {
  if (
    !Number.isFinite(numerator) ||
    !Number.isFinite(denominator) ||
    denominator === 0
  ) {
    return 0;
  }
  const result = numerator / denominator;
  return Number.isFinite(result) ? result : 0;
}

/** Закръгля до 2 знака — само за показване/експорт. */
export function round2(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

/** Гарантира крайно число: NaN/Infinity/null → 0. */
export function finite(value: number | null | undefined): number {
  return value != null && Number.isFinite(value) ? value : 0;
}
