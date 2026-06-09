import { requireAuth } from '@/lib/auth';
import MeldingenClient from './meldingen-client';

export const metadata = { title: 'Alerts — Marifest' };

export default async function MeldingenPage() {
  await requireAuth();
  return <MeldingenClient />;
}
