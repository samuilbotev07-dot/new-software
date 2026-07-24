'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { bg } from '@/lib/i18n/bg';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
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
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setError(bg.auth.genericError);
      setBusy(false);
      return;
    }
    router.push('/');
    router.refresh();
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
