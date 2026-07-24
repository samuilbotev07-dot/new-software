/**
 * Формати за показване: `1 234,56 €`, `12,3%`, `дд.мм.гггг`.
 * Невалидни стойности (NaN/Infinity/null) винаги стават „—".
 */

const NBSP = ' ';

export const EM_DASH = '—';

function isBad(v: number | null | undefined): v is null | undefined {
  return v == null || !Number.isFinite(v);
}

function groupThousands(intPart: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
}

/** `1 234,56` — без валута. */
export function fmtNumber(v: number | null | undefined, decimals = 2): string {
  if (isBad(v)) return EM_DASH;
  const sign = v < 0 ? '−' : '';
  const abs = Math.abs(v);
  const fixed = abs.toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');
  const grouped = groupThousands(intPart ?? '0');
  return decPart ? `${sign}${grouped},${decPart}` : `${sign}${grouped}`;
}

/** `1 234,56 €` */
export function fmtMoney(v: number | null | undefined, decimals = 2): string {
  if (isBad(v)) return EM_DASH;
  return `${fmtNumber(v, decimals)}${NBSP}€`;
}

/** `+1 234,56 €` / `−1 234,56 €` — за разлики. */
export function fmtMoneySigned(v: number | null | undefined, decimals = 2): string {
  if (isBad(v)) return EM_DASH;
  const base = fmtMoney(Math.abs(v), decimals);
  if (v > 0) return `+${base}`;
  if (v < 0) return `−${base}`;
  return base;
}

/** Приема дял 0..1 → `12,3%`. */
export function fmtPct(share: number | null | undefined, decimals = 1): string {
  if (isBad(share)) return EM_DASH;
  return `${fmtNumber(share * 100, decimals)}%`;
}

/** Приема дял 0..1 → `+12,3%` / `−12,3%`. */
export function fmtPctSigned(share: number | null | undefined, decimals = 1): string {
  if (isBad(share)) return EM_DASH;
  const base = fmtPct(Math.abs(share), decimals);
  if (share > 0) return `+${base}`;
  if (share < 0) return `−${base}`;
  return base;
}

/** `цяло число` — за клиенти, дни, бройки. */
export function fmtInt(v: number | null | undefined): string {
  if (isBad(v)) return EM_DASH;
  return fmtNumber(Math.round(v), 0);
}

/** `дд.мм.гггг` */
export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return EM_DASH;
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return EM_DASH;
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${date.getFullYear()}`;
}

export const MONTH_NAMES = [
  'Януари',
  'Февруари',
  'Март',
  'Април',
  'Май',
  'Юни',
  'Юли',
  'Август',
  'Септември',
  'Октомври',
  'Ноември',
  'Декември',
] as const;

export const MONTH_NAMES_SHORT = [
  'яну',
  'фев',
  'мар',
  'апр',
  'май',
  'юни',
  'юли',
  'авг',
  'сеп',
  'окт',
  'ное',
  'дек',
] as const;

/** `Януари 2026` */
export function fmtMonth(year: number, month: number): string {
  const name = MONTH_NAMES[month - 1] ?? EM_DASH;
  return `${name} ${year}`;
}

/** `яну 26` — за оси на графики. */
export function fmtMonthShort(year: number, month: number): string {
  const name = MONTH_NAMES_SHORT[month - 1] ?? EM_DASH;
  return `${name} ${String(year).slice(-2)}`;
}

/** Ключ на месец `YYYY-MM`. */
export function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}
