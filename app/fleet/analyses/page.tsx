import { requireAuth } from '@/lib/auth';
import AnalysesClient from './analyses-client';

export const metadata = {
  title: 'Analytics — Marifest',
};

export default async function AnalysesPage() {
  await requireAuth();
  return <AnalysesClient />;
}
