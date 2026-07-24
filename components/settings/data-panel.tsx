'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ExportExcelButton } from '@/components/export-excel-button';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { bg } from '@/lib/i18n/bg';
import { createClient } from '@/lib/supabase/client';

export function DataPanel() {
  const t = bg.settings.data;
  const router = useRouter();
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function deleteAccount() {
    setBusy(true);
    setError('');
    const supabase = createClient();
    const { error: err } = await supabase.rpc('delete_own_account');
    if (err) {
      setError(bg.common.saveError);
      setBusy(false);
      return;
    }
    await supabase.auth.signOut();
    router.push('/register');
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="mb-1 text-sm font-semibold">{t.exportTitle}</h3>
        <p className="mb-3 text-sm text-ink-soft">{t.exportBody}</p>
        <ExportExcelButton />
      </div>

      <div className="rounded-sm border border-stamp/40 bg-stamp-soft/40 p-4">
        <h3 className="mb-1 text-sm font-semibold text-stamp">{t.deleteTitle}</h3>
        <p className="mb-1 text-sm">{t.deleteBody}</p>
        <p className="mb-3 text-sm font-medium">{t.exportFirst}</p>
        <div className="flex max-w-sm flex-col gap-3">
          <TextField label={t.deleteConfirm} value={confirmText} onChange={setConfirmText} />
          <Button
            type="button"
            variant="danger"
            disabled={confirmText !== t.deleteWord || busy}
            onClick={deleteAccount}
          >
            {busy ? bg.common.loading : t.deleteButton}
          </Button>
          {error ? <p className="text-sm text-stamp">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
