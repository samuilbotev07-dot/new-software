import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth/server';
import { getProfile, getSettingsRow, listMonthRows } from '@/lib/db/queries';

/** Всички данни на потребителя за Excel експорта (сглобяван в браузъра). */
export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const [profile, settingsRow, monthRows] = await Promise.all([
    getProfile(),
    getSettingsRow(),
    listMonthRows(),
  ]);
  return NextResponse.json({ profile, settingsRow, monthRows });
}
