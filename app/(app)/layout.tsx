import { ExportExcelButton } from '@/components/export-excel-button';
import { Nav } from '@/components/nav';
import { SignOutButton } from '@/components/sign-out-button';
import { bg } from '@/lib/i18n/bg';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-rule bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 pb-1 pt-2">
          <span className="font-display text-sm font-bold tracking-tight">
            {bg.app.shortName}
          </span>
          <div className="flex items-center gap-2">
            <ExportExcelButton />
            <SignOutButton />
          </div>
        </div>
        <div className="mx-auto max-w-5xl">
          <Nav />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-3 py-4 pb-24 sm:px-4">{children}</main>
    </div>
  );
}
