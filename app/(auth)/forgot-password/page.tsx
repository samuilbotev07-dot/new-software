'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { bg } from '@/lib/i18n/bg';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setSent(true);
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <h2 className="font-display text-lg font-medium">{bg.auth.forgotPassword}</h2>
      <TextField
        label={bg.auth.email}
        value={email}
        onChange={setEmail}
        type="email"
        autoComplete="email"
        required
      />
      {sent ? <p className="text-sm text-ledger">{bg.auth.resetSent}</p> : null}
      <Button type="submit" disabled={busy || sent}>
        {bg.auth.resetSend}
      </Button>
      <Link href="/login" className="text-sm text-ink-soft underline">
        {bg.common.back}
      </Link>
    </form>
  );
}
