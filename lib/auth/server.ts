import 'server-only';
import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { headers } from 'next/headers';
import { pool } from '@/lib/db/pool';
import { createDefaultRows } from './defaults';

/**
 * Изпраща имейл през Resend (без SDK, само fetch). Работи само когато
 * RESEND_API_KEY е зададен — иначе линкът се логва на сървъра.
 */
async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(`[auth] RESEND_API_KEY липсва. Имейл до ${to}: ${subject}\n${text}`);
    return;
  }
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? 'onboarding@resend.dev',
      to,
      subject,
      text,
    }),
  });
}

export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail(
        user.email,
        'Нова парола — Бизнес Контролна Система',
        `Отвори този линк, за да зададеш нова парола:\n\n${url}\n\nАко не си искал нова парола, игнорирай този имейл.`,
      );
    },
  },
  user: {
    deleteUser: { enabled: true },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await createDefaultRows(user.id);
        },
      },
    },
  },
  plugins: [nextCookies()],
});

/** Session user id на текущата заявка или null. */
export async function getUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.id ?? null;
}

/** Като getUserId, но хвърля при липса на сесия — за server actions. */
export async function requireUserId(): Promise<string> {
  const userId = await getUserId();
  if (!userId) throw new Error('Not authenticated');
  return userId;
}
