'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { bg } from '@/lib/i18n/bg';

const items: Array<{ href: string; label: string; match: (p: string) => boolean }> = [
  { href: '/', label: bg.nav.dashboard, match: (p) => p === '/' },
  { href: '/month', label: bg.nav.monthEntry, match: (p) => p.startsWith('/month') },
  {
    href: '/analysis/monthly',
    label: bg.nav.monthlyAnalysis,
    match: (p) => p.startsWith('/analysis/monthly'),
  },
  {
    href: '/analysis/yearly',
    label: bg.nav.yearlyAnalysis,
    match: (p) => p.startsWith('/analysis/yearly'),
  },
  { href: '/compare', label: bg.nav.compare, match: (p) => p.startsWith('/compare') },
  { href: '/pricing', label: bg.nav.pricing, match: (p) => p.startsWith('/pricing') },
  { href: '/health', label: bg.nav.health, match: (p) => p.startsWith('/health') },
  { href: '/ai-export', label: bg.nav.aiExport, match: (p) => p.startsWith('/ai-export') },
  { href: '/settings', label: bg.nav.settings, match: (p) => p.startsWith('/settings') },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="overflow-x-auto">
      <ul className="flex min-w-max gap-1 px-3 pb-2">
        {items.map((item) => {
          const active = item.match(pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`block whitespace-nowrap rounded-sm px-3 py-1.5 text-sm ${
                  active
                    ? 'bg-ink font-medium text-paper'
                    : 'text-ink-soft hover:bg-rule/40 hover:text-ink'
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
