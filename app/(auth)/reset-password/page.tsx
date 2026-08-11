'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { authClient } from '@/lib/auth/client';
import { bg } from '@/lib/i18n/bg';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError(bg.auth.passwordMin);
      return;
    }
    setBusy(true);
    const { error: err } = await authClient.resetPassword({ newPassword: password, token });
    if (err) {
      setError(bg.auth.genericError);
      setBusy(false);
      return;
    }
    router.push('/login');
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <h2 className="font-display text-lg font-medium">{bg.auth.resetTitle}</h2>
      <TextField
        label={bg.auth.password}
        value={password}
        onChange={setPassword}
        type="password"
        autoComplete="new-password"
        required
      />
      {error ? <p className="text-sm text-stamp">{error}</p> : null}
      <Button type="submit" disabled={busy}>
        {bg.auth.resetSave}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
