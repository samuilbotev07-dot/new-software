'use client';

import { useRouter } from 'next/navigation';
import { bg } from '@/lib/i18n/bg';
import { createClient } from '@/lib/supabase/client';

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await createClient().auth.signOut();
        router.push('/login');
        router.refresh();
      }}
      className="rounded-sm px-2 py-1 text-sm text-ink-soft underline hover:text-ink"
    >
      {bg.common.signOut}
    </button>
  );
}
