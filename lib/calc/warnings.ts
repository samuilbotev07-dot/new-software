import { bg } from '@/lib/i18n/bg';
import { safeDiv, finite } from './money';
import type { CalcSettings, MonthDerived, Warning } from './types';

const RENT_ID = 'rent';
const SALARIES_ID = 'salaries';

/**
 * Активни предупреждения за месеца.
 * @param prev Предходният месец или null.
 * @param yoy  Същият месец предходната година или null.
 */
export function computeWarnings(
  d: MonthDerived,
  prev: MonthDerived | null,
  yoy: MonthDerived | null,
  s: CalcSettings,
): Warning[] {
  const warnings: Warning[] = [];

  if (d.cashEnd < 0) {
    warnings.push({
      severity: 'critical',
      text: bg.warnings.negativeCash(d.cashEnd),
      action: bg.warnings.negativeCashAction,
    });
  }

  if (d.totalRevenue > 0 && d.expenseRatio > 0.8) {
    warnings.push({
      severity: 'warning',
      text: bg.warnings.highExpenseRatio(d.expenseRatio),
      action: bg.warnings.highExpenseRatioAction,
    });
  }

  if (d.totalRevenue > 0 && d.margin < s.minMargin) {
    warnings.push({
      severity: 'warning',
      text: bg.warnings.lowMargin(d.margin, s.minMargin),
      action: bg.warnings.lowMarginAction,
    });
  }

  if (s.minCashBuffer > 0 && d.cashEnd < s.minCashBuffer) {
    warnings.push({
      severity: 'warning',
      text: bg.warnings.lowCashBuffer(d.cashEnd, s.minCashBuffer),
    });
  }

  const rent = finite(d.expenses[RENT_ID]);
  if (d.totalRevenue > 0 && rent > 0) {
    const share = safeDiv(rent, d.totalRevenue);
    if (share > 0.25) {
      warnings.push({
        severity: 'warning',
        text: bg.warnings.highRent(share),
        action: bg.warnings.highExpenseRatioAction,
      });
    }
  }

  const salaries = finite(d.expenses[SALARIES_ID]);
  if (d.totalRevenue > 0 && salaries > 0) {
    const share = safeDiv(salaries, d.totalRevenue);
    if (share > 0.3) {
      warnings.push({
        severity: 'warning',
        text: bg.warnings.highSalaries(share),
        action: bg.warnings.highExpenseRatioAction,
      });
    }
  }

  if (prev && prev.totalRevenue > 0) {
    const drop = safeDiv(prev.totalRevenue - d.totalRevenue, prev.totalRevenue);
    if (drop > 0.15) {
      warnings.push({
        severity: 'warning',
        text: bg.warnings.revenueDropMoM(drop, prev.totalRevenue, d.totalRevenue),
      });
    }
  }

  if (yoy && yoy.totalRevenue > 0) {
    const drop = safeDiv(yoy.totalRevenue - d.totalRevenue, yoy.totalRevenue);
    if (drop > 0.2) {
      warnings.push({
        severity: 'warning',
        text: bg.warnings.revenueDropYoY(drop, yoy.totalRevenue, d.totalRevenue),
      });
    }
  }

  if (s.targetProfit > 0 && d.netProfit < s.targetProfit) {
    warnings.push({
      severity: 'warning',
      text: bg.warnings.belowTargetProfit(d.netProfit, s.targetProfit),
    });
  }

  if (s.targetClients > 0 && d.clients < s.targetClients) {
    warnings.push({
      severity: 'warning',
      text: bg.warnings.belowTargetClients(d.clients, s.targetClients),
    });
  }

  const cashflowEntered =
    d.cashflow.inCash !== 0 ||
    d.cashflow.inBank !== 0 ||
    d.cashflow.outCash !== 0 ||
    d.cashflow.outBank !== 0;
  if (
    cashflowEntered &&
    d.totalRevenue > 0 &&
    Math.abs(d.cashDiscrepancy) > 0.02 * d.totalRevenue
  ) {
    warnings.push({
      severity: 'info',
      text: bg.warnings.cashDiscrepancy(d.cashDiscrepancy),
      action: bg.warnings.cashDiscrepancyAction,
    });
  }

  return warnings;
}
