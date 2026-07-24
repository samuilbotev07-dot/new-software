/**
 * Сглобява готов текст за AI консултант от реалните данни.
 * Нищо не се изпраща никъде — текстът се копира ръчно от потребителя.
 */
import { computeHealth } from '@/lib/calc/health';
import { topExpenses, topProducts, worstProducts } from '@/lib/calc/month';
import { computeWarnings } from '@/lib/calc/warnings';
import type { CalcSettings, MonthDerived, MonthInput } from '@/lib/calc/types';
import type { ProfileRow, SettingsRow } from '@/lib/db/types';
import { fmtInt, fmtMoney, fmtMonth, fmtPct } from '@/lib/format';
import { bg } from '@/lib/i18n/bg';

export type AiExportType =
  | 'monthly'
  | 'yearly'
  | 'expenses'
  | 'pricing'
  | 'health'
  | 'plan30'
  | 'offer';

export interface AiExportContext {
  profile: ProfileRow | null;
  settingsRow: SettingsRow | null;
  settings: CalcSettings;
  inputs: MonthInput[];
  derived: MonthDerived[];
  /** Индекс на избрания месец в derived/inputs. */
  index: number;
}

const CLOSING = 'Отговаряй на български, конкретно. Не измисляй числа, които не съм ти дал.';

function bizSection(ctx: AiExportContext): string {
  const p = ctx.profile;
  const s = ctx.settingsRow;
  const lines = [
    'ЗА БИЗНЕСА:',
    `- Бизнес: ${p?.business_name ?? 'не е посочено'} (${p?.business_type ?? 'тип не е посочен'}), град ${p?.city ?? '—'}`,
    `- Служители: ${p?.employees ?? '—'}, данъчен режим: ${p?.tax_regime ?? '—'}, ДДС регистрация: ${p?.vat_registered ? 'да' : 'не'}`,
    `- Целева месечна нетна печалба: ${fmtMoney(ctx.settings.targetProfit)}, минимален марж: ${fmtPct(ctx.settings.minMargin)}, целеви клиенти: ${fmtInt(ctx.settings.targetClients)}`,
  ];
  if (s?.goals_12m) lines.push(`- Цели 12 месеца: ${s.goals_12m}`);
  if (s?.biggest_problem) lines.push(`- Най-голям проблем според собственика: ${s.biggest_problem}`);
  if (s?.top3_priorities) lines.push(`- Топ 3 приоритета: ${s.top3_priorities}`);
  return lines.join('\n');
}

function metricsSection(d: MonthDerived): string {
  return [
    `ПОКАЗАТЕЛИ ЗА ${fmtMonth(d.year, d.month).toUpperCase()}:`,
    `- Оборот: ${fmtMoney(d.totalRevenue)}; Разходи: ${fmtMoney(d.totalExpenses)}; Брутна печалба: ${fmtMoney(d.grossProfit)}`,
    `- Към държавата: ${fmtMoney(d.totalToState)} (ДДС за внасяне ${fmtMoney(d.vatDue)}); Нетна печалба: ${fmtMoney(d.netProfit)}; Марж: ${d.totalRevenue > 0 ? fmtPct(d.margin) : '—'}`,
    `- Клиенти: ${fmtInt(d.clients)}; Среден чек: ${d.clients > 0 ? fmtMoney(d.avgTicket) : '—'}; Оборот на работен ден: ${d.workingDays > 0 ? fmtMoney(d.revenuePerWorkingDay) : '—'}`,
    `- Кеш: начало ${fmtMoney(d.cashStart)}, край ${fmtMoney(d.cashEnd)} (промяна ${fmtMoney(d.cashChange)}); Кеш буфер: ${d.cashBufferMonths.toFixed(1)} месеца разходи`,
  ].join('\n');
}

function expensesSection(d: MonthDerived, s: CalcSettings): string {
  const top = topExpenses(d, s, 5);
  if (top.length === 0) return 'ТОП РАЗХОДИ: няма въведени.';
  return [
    'ТОП РАЗХОДИ:',
    ...top.map(
      (e, i) =>
        `${i + 1}. ${e.name}: ${fmtMoney(e.amount)} (${fmtPct(e.shareOfRevenue)} от оборота, ${fmtPct(e.shareOfExpenses)} от разходите)`,
    ),
  ].join('\n');
}

function productsSection(d: MonthDerived): string {
  const top = topProducts(d.products, 5);
  const worst = worstProducts(d.products, 3);
  if (top.length === 0) return '';
  const lines = [
    'ПРОДУКТИ/УСЛУГИ (по печалба):',
    ...top.map(
      (p) =>
        `- ${p.name}: ${fmtInt(p.quantity)} бр. × ${fmtMoney(p.price)}, печалба ${fmtMoney(p.profit)}, марж ${fmtPct(p.margin)}${p.profitPerHour != null ? `, ${fmtMoney(p.profitPerHour)}/час` : ''}`,
    ),
  ];
  if (worst.length > 0 && worst[0]!.name !== top[0]!.name) {
    lines.push(
      'Най-слаби:',
      ...worst.map((p) => `- ${p.name}: печалба ${fmtMoney(p.profit)}`),
    );
  }
  return lines.join('\n');
}

function healthSection(ctx: AiExportContext, d: MonthDerived): string {
  const history = ctx.derived.filter(
    (x) => x.year < d.year || (x.year === d.year && x.month < d.month),
  );
  const h = computeHealth(d, history, ctx.settings);
  return [
    `БИЗНЕС ЗДРАВЕ: ${h.total}/100 (${bg.health.status[h.status]})`,
    ...h.categories.map(
      (c) => `- ${c.label}: ${c.score != null ? `${c.score}/100` : 'няма данни'} — ${c.reason}`,
    ),
  ].join('\n');
}

function warningsSection(ctx: AiExportContext, d: MonthDerived): string {
  const prev =
    ctx.derived.find(
      (x) =>
        x.year === (d.month === 1 ? d.year - 1 : d.year) &&
        x.month === (d.month === 1 ? 12 : d.month - 1),
    ) ?? null;
  const yoy = ctx.derived.find((x) => x.year === d.year - 1 && x.month === d.month) ?? null;
  const w = computeWarnings(d, prev, yoy, ctx.settings);
  if (w.length === 0) return 'ПРЕДУПРЕЖДЕНИЯ: няма активни.';
  return ['ПРЕДУПРЕЖДЕНИЯ:', ...w.map((x) => `- [${x.severity}] ${x.text}`)].join('\n');
}

function selfAnalysisSection(input: MonthInput): string {
  const sa = input.selfAnalysis ?? {};
  const map: Array<[string, string | undefined]> = [
    ['Какво мина добре', sa.wentWell],
    ['Какво не мина добре', sa.wentBad],
    ['Най-голям проблем', sa.biggestProblem],
    ['Най-добре продавано', sa.bestProduct],
    ['Най-зле продавано', sa.worstProduct],
    ['Какво ще подобри', sa.toImprove],
    ['Взети решения', sa.decisions],
    ['Въпроси', sa.questions],
  ];
  const filled = map.filter(([, v]) => v && v.trim().length > 0);
  if (filled.length === 0 && !input.notes?.trim()) return '';
  const lines = ['ДУМИТЕ НА СОБСТВЕНИКА:'];
  for (const [q, a] of filled) lines.push(`- ${q}: ${a}`);
  if (input.notes?.trim()) lines.push(`- Бележки: ${input.notes.trim()}`);
  return lines.join('\n');
}

function yearlyTable(ctx: AiExportContext, year: number): string {
  const months = ctx.derived.filter((d) => d.year === year);
  const lines = [`ГОДИНА ${year} ПО МЕСЕЦИ:`];
  for (const d of months) {
    lines.push(
      `- ${fmtMonth(d.year, d.month)}: оборот ${fmtMoney(d.totalRevenue)}, нетна печалба ${fmtMoney(d.netProfit)}, марж ${d.totalRevenue > 0 ? fmtPct(d.margin) : '—'}, клиенти ${fmtInt(d.clients)}`,
    );
  }
  const sum = (f: (d: MonthDerived) => number) => months.reduce((a, d) => a + f(d), 0);
  lines.push(
    `Общо: оборот ${fmtMoney(sum((d) => d.totalRevenue))}, нетна печалба ${fmtMoney(sum((d) => d.netProfit))}, клиенти ${fmtInt(sum((d) => d.clients))}`,
  );
  return lines.join('\n');
}

function intro(): string {
  return 'Ти си опитен бизнес консултант за малки физически бизнеси в България. По-долу са реалните ми числа.';
}

export function buildAiExport(type: AiExportType, ctx: AiExportContext): string {
  const d = ctx.derived[ctx.index];
  const input = ctx.inputs[ctx.index];
  if (!d || !input) return '';

  const parts: string[] = [intro(), '', bizSection(ctx), ''];

  switch (type) {
    case 'monthly':
      parts.push(
        metricsSection(d),
        '',
        expensesSection(d, ctx.settings),
        '',
        productsSection(d),
        '',
        healthSection(ctx, d),
        '',
        warningsSection(ctx, d),
        '',
        selfAnalysisSection(input),
        '',
        'КАКВО ИСКАМ ОТ ТЕБ:',
        '1. Кои са трите най-важни неща в тези числа, които трябва да видя?',
        '2. Кой е най-големият теч на пари и как да го спра?',
        '3. Дай ми 3 конкретни действия за следващия месец, подредени по ефект.',
        '4. Какво НЕ трябва да правя в момента?',
      );
      break;
    case 'yearly':
      parts.push(
        yearlyTable(ctx, d.year),
        '',
        healthSection(ctx, d),
        '',
        'КАКВО ИСКАМ ОТ ТЕБ:',
        '1. Какви тенденции виждаш в годината — кое расте, кое пада?',
        '2. Кои месеци са проблемни и каква може да е причината?',
        '3. Реалистична цел за следващата година на база тези числа?',
        '4. Топ 3 приоритета за следващото тримесечие.',
      );
      break;
    case 'expenses':
      parts.push(
        metricsSection(d),
        '',
        expensesSection(d, ctx.settings),
        '',
        warningsSection(ctx, d),
        '',
        'КАКВО ИСКАМ ОТ ТЕБ:',
        '1. Кои разходи изглеждат високи за бизнес като моя и с колко?',
        '2. Кои разходи да НЕ пипам, защото носят приходи?',
        '3. План за сваляне на разходите с 10% без да убия качеството.',
      );
      break;
    case 'pricing':
      parts.push(
        metricsSection(d),
        '',
        productsSection(d),
        '',
        `Минимален марж, под който не искам да падам: ${fmtPct(ctx.settings.minMargin)}.`,
        '',
        'КАКВО ИСКАМ ОТ ТЕБ:',
        '1. Кои продукти/услуги издържат покачване на цената и с колко?',
        '2. Кои са кандидати за спиране или преработка?',
        '3. Идеи за пакети от съществуващите ми услуги с конкретни цени.',
        '4. Как да вдигна средния чек, без да гоня клиенти?',
      );
      break;
    case 'health':
      parts.push(
        metricsSection(d),
        '',
        healthSection(ctx, d),
        '',
        warningsSection(ctx, d),
        '',
        'КАКВО ИСКАМ ОТ ТЕБ:',
        '1. Обясни ми с прости думи къде е най-слабото място на бизнеса.',
        '2. Кое едно нещо, ако го оправя, ще вдигне оценката най-много?',
        '3. Какъв е рискът, ако не направя нищо 6 месеца?',
      );
      break;
    case 'plan30':
      parts.push(
        metricsSection(d),
        '',
        expensesSection(d, ctx.settings),
        '',
        healthSection(ctx, d),
        '',
        selfAnalysisSection(input),
        '',
        'КАКВО ИСКАМ ОТ ТЕБ:',
        'Направи ми конкретен план за следващите 30 дни: седмица по седмица, с конкретни действия, кой ги прави и как меря дали работят. Фокус: печалба и кеш, не суета.',
      );
      break;
    case 'offer':
      parts.push(
        metricsSection(d),
        '',
        productsSection(d),
        '',
        `Среден чек: ${d.clients > 0 ? fmtMoney(d.avgTicket) : 'няма данни'}. Минимален марж: ${fmtPct(ctx.settings.minMargin)}.`,
        '',
        'КАКВО ИСКАМ ОТ ТЕБ:',
        'Създай ми една неустоима оферта за клиентите ми на база най-печелившите ми услуги: какво включва, на каква цена, как я представям с едно изречение, и защо клиентът би казал „да" веднага. Маржът не трябва да пада под минималния ми.',
      );
      break;
  }

  parts.push('', CLOSING);
  return parts.filter((p, i) => p !== '' || parts[i - 1] !== '').join('\n');
}
