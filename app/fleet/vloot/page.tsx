import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth';
import VlootClient from './vloot-client';

export const metadata = {
  title: 'Fleet — Marifest',
};

export default async function VlootPage() {
  await requireAuth();
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
      <VlootClient />
    </Suspense>
  );
}
