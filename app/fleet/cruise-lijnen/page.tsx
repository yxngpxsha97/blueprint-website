import { requireAuth } from '@/lib/auth';
import CruiseLijnenClient from './cruise-lijnen-client';

export const metadata = {
  title: 'Cruise Lines — Marifest',
};

export default async function CruiseLijnenPage() {
  await requireAuth();
  return <CruiseLijnenClient />;
}
