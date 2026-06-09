import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth';
import ShipDetailClient from './ship-detail-client';

export const metadata = {
  title: 'Ship — Marifest',
};

export default async function ShipDetailPage({
  params,
}: {
  params: Promise<{ imo: string }>;
}) {
  await requireAuth();
  const { imo } = await params;

  return (
    <Suspense
      fallback={
        <div className="fleet-root flex-1 flex items-center justify-center" style={{ minHeight: '100vh', background: 'var(--paper)' }}>
          <div className="flex flex-col items-center gap-3">
            <div className="fl-spinner" />
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>Loading...</span>
          </div>
        </div>
      }
    >
      <ShipDetailClient imo={imo} />
    </Suspense>
  );
}
