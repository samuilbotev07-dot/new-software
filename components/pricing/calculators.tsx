'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { NumberField, TextField } from '@/components/ui/field';
import {
  bundle,
  discount,
  marginCalc,
  productPrice,
  salesTarget,
  servicePrice,
  whatIf,
  type BundleItem,
} from '@/lib/calc/pricing';
import { fmtMoney, fmtMoneySigned, fmtNumber, fmtPct } from '@/lib/format';
import { bg } from '@/lib/i18n/bg';

function Section({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="group rounded-sm border border-rule bg-card">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        {title}
        <span
          aria-hidden="true"
          className="text-ink-soft transition-transform group-open:rotate-90"
        >
          ›
        </span>
      </summary>
      <div className="border-t border-rule p-4">{children}</div>
    </details>
  );
}

function ResultRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'good' | 'bad';
}) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-dashed border-rule py-1.5 text-sm last:border-0">
      <span className="text-ink-soft">{label}</span>
      <span
        className={`num font-medium ${
          tone === 'good' ? 'text-ledger' : tone === 'bad' ? 'text-stamp' : ''
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function ProductPriceCalc() {
  const [cost, setCost] = useState(0);
  const [extra, setExtra] = useState(0);
  const [margin, setMargin] = useState(40);
  const r = productPrice({ cost, extraPerUnit: extra, desiredMarginPct: margin });
  const t = bg.pricing.product;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-3">
        <NumberField label={t.cost} value={cost} onChange={setCost} suffix="€" />
        <NumberField label={t.extra} value={extra} onChange={setExtra} suffix="€" />
        <NumberField label={t.desiredMargin} value={margin} onChange={setMargin} suffix="%" />
      </div>
      <div>
        <ResultRow label={t.realCost} value={fmtMoney(r.realCost)} />
        <ResultRow label={t.minPrice} value={fmtMoney(r.minPrice)} />
        <ResultRow label={t.recommendedPrice} value={fmtMoney(r.recommendedPrice)} tone="good" />
        <ResultRow label={t.profitPerUnit} value={fmtMoney(r.profitPerUnitAtRecommended)} />
      </div>
    </div>
  );
}

function ServicePriceCalc() {
  const [minutes, setMinutes] = useState(60);
  const [labor, setLabor] = useState(0);
  const [materials, setMaterials] = useState(0);
  const [extra, setExtra] = useState(0);
  const [margin, setMargin] = useState(40);
  const r = servicePrice({
    minutes,
    laborPerHour: labor,
    materials,
    extra,
    desiredMarginPct: margin,
  });
  const t = bg.pricing.service;
  const p = bg.pricing.product;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-3">
        <NumberField label={t.minutes} value={minutes} onChange={setMinutes} integer />
        <NumberField label={t.laborPerHour} value={labor} onChange={setLabor} suffix="€" />
        <NumberField label={t.materials} value={materials} onChange={setMaterials} suffix="€" />
        <NumberField label={t.extra} value={extra} onChange={setExtra} suffix="€" />
        <NumberField label={p.desiredMargin} value={margin} onChange={setMargin} suffix="%" />
      </div>
      <div>
        <ResultRow label={p.realCost} value={fmtMoney(r.realCost)} />
        <ResultRow label={p.minPrice} value={fmtMoney(r.minPrice)} />
        <ResultRow label={p.recommendedPrice} value={fmtMoney(r.recommendedPrice)} tone="good" />
        <ResultRow label={p.profitPerUnit} value={fmtMoney(r.profitPerUnitAtRecommended)} />
      </div>
    </div>
  );
}

function MarginCalc({ minMargin }: { minMargin: number }) {
  const [price, setPrice] = useState(0);
  const [cost, setCost] = useState(0);
  const r = marginCalc(price, cost, minMargin);
  const t = bg.pricing.margin;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-3">
        <NumberField label={t.price} value={price} onChange={setPrice} suffix="€" />
        <NumberField label={t.cost} value={cost} onChange={setCost} suffix="€" />
      </div>
      <div>
        <ResultRow
          label={t.margin}
          value={price > 0 ? fmtPct(r.margin) : bg.common.dash}
          tone={price > 0 ? (r.meetsMin ? 'good' : 'bad') : undefined}
        />
        <ResultRow label={t.profit} value={fmtMoney(r.profit)} />
        {price > 0 ? (
          <p className={`mt-2 text-sm ${r.meetsMin ? 'text-ledger' : 'text-stamp'}`}>
            {r.meetsMin ? t.ok : bg.pricing.belowMin}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function WhatIfCalc() {
  const [price, setPrice] = useState(0);
  const [cost, setCost] = useState(0);
  const [sales, setSales] = useState(0);
  const rows = whatIf(price, cost, sales);
  const t = bg.pricing.whatIf;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <NumberField label={t.currentPrice} value={price} onChange={setPrice} suffix="€" />
        <NumberField label={bg.pricing.margin.cost} value={cost} onChange={setCost} suffix="€" />
        <NumberField label={t.monthlySales} value={sales} onChange={setSales} integer />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b-2 border-ink text-right text-xs text-ink-soft">
              <th className="py-2 text-left font-medium">{t.change}</th>
              <th className="py-2 font-medium">{t.newPrice}</th>
              <th className="py-2 font-medium">{t.profitPerUnit}</th>
              <th className="py-2 font-medium">{t.totalProfit}</th>
              <th className="py-2 font-medium">{t.diff}</th>
              <th className="py-2 pl-2 font-medium">{t.maxLoss}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.changePct}
                className={`border-b border-rule text-right last:border-0 ${
                  r.changePct === 0 ? 'bg-rule/20 font-medium' : ''
                }`}
              >
                <td className="num py-1.5 text-left">
                  {r.changePct > 0 ? `+${r.changePct}%` : `${r.changePct}%`}
                </td>
                <td className="num py-1.5">{fmtMoney(r.newPrice)}</td>
                <td className="num py-1.5">{fmtMoney(r.profitPerUnit)}</td>
                <td className="num py-1.5">{fmtMoney(r.totalProfit)}</td>
                <td className={`num py-1.5 ${r.diffVsNow > 0 ? 'text-ledger' : r.diffVsNow < 0 ? 'text-stamp' : ''}`}>
                  {fmtMoneySigned(r.diffVsNow)}
                </td>
                <td className="num py-1.5 pl-2">
                  {r.maxClientLossPct != null
                    ? `${fmtNumber(r.maxClientLossPct, 1)}% ${t.maxLossClients}`
                    : bg.common.dash}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SalesTargetCalc() {
  const [target, setTarget] = useState(0);
  const [margin, setMargin] = useState(40);
  const [ticket, setTicket] = useState(0);
  const [days, setDays] = useState(22);
  const r = salesTarget({
    targetProfit: target,
    avgMarginPct: margin,
    avgTicket: ticket,
    workingDays: days,
  });
  const t = bg.pricing.salesTarget;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-3">
        <NumberField label={t.targetProfit} value={target} onChange={setTarget} suffix="€" />
        <NumberField label={t.avgMargin} value={margin} onChange={setMargin} suffix="%" />
        <NumberField label={t.avgTicket} value={ticket} onChange={setTicket} suffix="€" />
        <NumberField label={t.workingDays} value={days} onChange={setDays} integer />
      </div>
      <div>
        <ResultRow label={t.needTotal} value={fmtNumber(r.neededTotal, 0)} />
        <ResultRow label={t.perDay} value={fmtNumber(r.perDay, 1)} />
        <ResultRow label={t.perWorkingDay} value={fmtNumber(r.perWorkingDay, 1)} />
      </div>
    </div>
  );
}

function DiscountCalc() {
  const [price, setPrice] = useState(0);
  const [cost, setCost] = useState(0);
  const [pct, setPct] = useState(10);
  const r = discount(price, cost, pct);
  const t = bg.pricing.discount;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-3">
        <NumberField label={bg.pricing.margin.price} value={price} onChange={setPrice} suffix="€" />
        <NumberField label={bg.pricing.margin.cost} value={cost} onChange={setCost} suffix="€" />
        <NumberField label={t.discountPct} value={pct} onChange={setPct} suffix="%" />
      </div>
      <div>
        <ResultRow label={t.newPrice} value={fmtMoney(r.newPrice)} />
        <ResultRow
          label={t.newMargin}
          value={r.newPrice > 0 ? fmtPct(r.newMargin) : bg.common.dash}
        />
        <ResultRow label={t.profitLoss} value={fmtMoney(r.profitLossPerUnit)} tone="bad" />
        {r.requiredSalesIncreasePct != null ? (
          <ResultRow
            label={t.neededExtraSales}
            value={`+${fmtNumber(r.requiredSalesIncreasePct, 1)}%`}
          />
        ) : price > 0 ? (
          <p className="mt-2 text-sm text-stamp">{t.impossible}</p>
        ) : null}
      </div>
    </div>
  );
}

function BundleCalc({ minMargin }: { minMargin: number }) {
  const [items, setItems] = useState<BundleItem[]>([
    { name: '', price: 0, cost: 0 },
    { name: '', price: 0, cost: 0 },
  ]);
  const [price, setPrice] = useState(0);
  const r = bundle(items, price, minMargin);
  const t = bg.pricing.bundle;

  const update = (i: number, patch: Partial<BundleItem>) =>
    setItems((prev) => prev.map((it, j) => (j === i ? { ...it, ...patch } : it)));

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {items.map((it, i) => (
          <li key={i} className="grid grid-cols-[1fr_auto] items-end gap-2 rounded-sm border border-rule p-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <TextField
                label={`${t.item} ${i + 1}`}
                value={it.name}
                onChange={(v) => update(i, { name: v })}
              />
              <NumberField
                label={bg.pricing.margin.price}
                value={it.price}
                onChange={(v) => update(i, { price: v })}
                suffix="€"
              />
              <NumberField
                label={bg.pricing.margin.cost}
                value={it.cost}
                onChange={(v) => update(i, { cost: v })}
                suffix="€"
              />
            </div>
            <button
              type="button"
              aria-label={bg.common.delete}
              onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))}
              className="mb-1 rounded-sm border border-rule px-2 py-1 text-sm text-stamp hover:bg-stamp-soft"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      {items.length < 5 ? (
        <Button
          type="button"
          variant="ghost"
          onClick={() => setItems((prev) => [...prev, { name: '', price: 0, cost: 0 }])}
        >
          {t.addItem}
        </Button>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label={t.bundlePrice} value={price} onChange={setPrice} suffix="€" />
        <div>
          <ResultRow label={t.sumPrice} value={fmtMoney(r.sumPrice)} />
          <ResultRow label={t.discount} value={`${fmtNumber(r.discountPct, 1)}%`} />
          <ResultRow label={t.totalCost} value={fmtMoney(r.totalCost)} />
          <ResultRow label={t.profit} value={fmtMoney(r.profit)} />
          <ResultRow
            label={t.margin}
            value={price > 0 ? fmtPct(r.margin) : bg.common.dash}
            tone={price > 0 ? (r.belowMinMargin ? 'bad' : 'good') : undefined}
          />
          {price > 0 && r.belowMinMargin ? (
            <p className="mt-2 text-sm text-stamp">{bg.pricing.belowMin}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function PricingCalculators({ minMargin }: { minMargin: number }) {
  return (
    <div className="flex flex-col gap-3">
      <Section title={bg.pricing.product.title} defaultOpen>
        <ProductPriceCalc />
      </Section>
      <Section title={bg.pricing.service.title}>
        <ServicePriceCalc />
      </Section>
      <Section title={bg.pricing.margin.title}>
        <MarginCalc minMargin={minMargin} />
      </Section>
      <Section title={bg.pricing.whatIf.title}>
        <WhatIfCalc />
      </Section>
      <Section title={bg.pricing.salesTarget.title}>
        <SalesTargetCalc />
      </Section>
      <Section title={bg.pricing.discount.title}>
        <DiscountCalc />
      </Section>
      <Section title={bg.pricing.bundle.title}>
        <BundleCalc minMargin={minMargin} />
      </Section>
    </div>
  );
}
