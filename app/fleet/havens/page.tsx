import { requireAuth } from '@/lib/auth';
import HavensClient from './havens-client';

export const metadata = { title: 'Ports — Marifest' };

export default async function HavensPage() {
  await requireAuth();
  return <HavensClient />;
}
