import type { ReactNode } from 'react';

export function Card({
  title,
  children,
  className = '',
}: {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-sm border border-rule bg-card ${className}`}>
      {title ? (
        <h2 className="border-b border-rule px-4 py-3 text-sm font-semibold tracking-wide">
          {title}
        </h2>
      ) : null}
      <div className="p-4">{children}</div>
    </section>
  );
}
