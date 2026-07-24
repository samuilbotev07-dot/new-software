'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { bg } from '@/lib/i18n/bg';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(
        err.message.includes('Invalid login credentials')
          ? bg.auth.invalidCredentials
          : bg.auth.genericError,
      );
      setBusy(false);
      return;
    }
    router.push('/');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <h2 className="font-display text-lg font-medium">{bg.auth.loginTitle}</h2>
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
        autoComplete="current-password"
        required
      />
      {error ? <p className="text-sm text-stamp">{error}</p> : null}
      <Button type="submit" disabled={busy}>
        {busy ? bg.common.loading : bg.auth.loginButton}
      </Button>
      <div className="flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-ink-soft underline">
          {bg.auth.forgotPassword}
        </Link>
        <Link href="/register" className="font-medium underline">
          {bg.auth.toRegister}
        </Link>
      </div>
    </form>
  );
}
