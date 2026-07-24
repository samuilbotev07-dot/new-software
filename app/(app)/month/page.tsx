import { redirect } from 'next/navigation';

export default function MonthIndexPage() {
  const now = new Date();
  redirect(`/month/${now.getFullYear()}/${now.getMonth() + 1}`);
}
