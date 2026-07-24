/**
 * Публична конфигурация на Supabase. Anon ключът е публичен по дизайн —
 * той се изпраща на всеки браузър; данните пази RLS. Env променливите
 * имат предимство; константите са резервен вариант за среди без env.
 */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://uvvwchyylyryozxfmkdg.supabase.co';

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  'sb_publishable_uBmTOEuEf3Iqr4Zn1ARMAQ_JVl_M6AW';
