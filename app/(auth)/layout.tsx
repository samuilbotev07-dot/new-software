import { bg } from '@/lib/i18n/bg';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="ruled flex min-h-dvh flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center font-display text-xl font-bold tracking-tight">
          {bg.app.name}
        </h1>
        <p className="mb-8 text-center text-xs text-ink-soft">{bg.app.method}</p>
        <div className="receipt rounded-t-sm p-6">{children}</div>
        <div className="receipt-edge" aria-hidden="true" />
      </div>
    </main>
  );
}
