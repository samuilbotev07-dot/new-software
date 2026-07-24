import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, Onest, Unbounded } from 'next/font/google';
import { bg } from '@/lib/i18n/bg';
import './globals.css';

const unbounded = Unbounded({
  variable: '--font-unbounded',
  subsets: ['latin', 'cyrillic'],
  weight: ['500', '700'],
});

const onest = Onest({
  variable: '--font-onest',
  subsets: ['latin', 'cyrillic'],
});

const plexMono = IBM_Plex_Mono({
  variable: '--font-plex-mono',
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: bg.app.name,
  description: bg.app.method,
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bg">
      <body
        className={`${unbounded.variable} ${onest.variable} ${plexMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
