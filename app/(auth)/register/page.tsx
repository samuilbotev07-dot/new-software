'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { bg } from '@/lib/i18n/bg';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError(bg.auth.passwordMin);
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (err) {
      setError(err.message.includes('already registered') ? bg.auth.emailTaken : bg.auth.genericError);
      setBusy(false);
      return;
    }
    if (data.session) {
      router.push('/onboarding');
      router.refresh();
      return;
    }
    setNotice(bg.auth.confirmEmail);
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <h2 className="font-display text-lg font-medium">{bg.auth.registerTitle}</h2>
      <TextField
        label={bg.auth.email}
        value={email}
        onChange={setEmail}
        type="email"
        autoComplete="email"
        required
      />
      <TextField
        label={bg.auth.password}
        value={password}
        onChange={setPassword}
        type="password"
        autoComplete="new-password"
        required
      />
      {error ? <p className="text-sm text-stamp">{error}</p> : null}
      {notice ? <p className="text-sm text-ledger">{notice}</p> : null}
      <Button type="submit" disabled={busy}>
        {busy ? bg.common.loading : bg.auth.registerButton}
      </Button>
      <p className="text-sm text-ink-soft">
        {bg.auth.haveAccount}{' '}
        <Link href="/login" className="font-medium text-ink underline">
          {bg.auth.toLogin}
        </Link>
      </p>
    </form>
  );
}
