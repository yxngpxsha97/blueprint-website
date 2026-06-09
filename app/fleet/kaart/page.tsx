import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth';
import KaartClient from './kaart-client';

export const metadata = {
  title: 'Live Map — Marifest',
};

export default async function KaartPage() {
  await requireAuth();
  return (
    <Suspense
      fallback={
        <div className="fleet-root flex-1 flex items-center justify-center" style={{ minHeight: '100vh', background: 'var(--paper)' }}>
          <div className="flex flex-col items-center gap-3">
            <div className="fl-spinner" />
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>Loading map...</span>
          </div>
        </div>
      }
    >
      <KaartClient />
    </Suspense>
  );
}
