/** Разбор на числа, въведени по български: „1 234,56" → 1234.56. */
export function parseDecimal(raw: string): number {
  const cleaned = raw.replace(/\s| /g, '').replace(',', '.');
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/** Число → стойност за поле при редакция (запетая, без групиране). */
export function toInputValue(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v) || v === 0) return '';
  return String(v).replace('.', ',');
}
