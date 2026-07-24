import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'ledger' | 'danger' | 'ghost';

const styles: Record<Variant, string> = {
  primary:
    'bg-ink text-paper hover:bg-ink/90 border border-ink',
  ledger:
    'bg-ledger text-white hover:bg-ledger/90 border border-ledger',
  danger:
    'bg-stamp text-white hover:bg-stamp/90 border border-stamp',
  ghost:
    'bg-transparent text-ink hover:bg-rule/40 border border-rule',
};

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-sm px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
