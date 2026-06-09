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
        <div className="flex-1 flex items-center justify-center" style={{ minHeight: '100vh', background: '#0A0F1E' }}>
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-8 h-8 border-2 rounded-full animate-spin"
              style={{ borderColor: '#06B6D4', borderTopColor: 'transparent' }}
            />
            <span style={{ color: 'rgba(226,232,240,0.5)', fontSize: 13 }}>Loading map...</span>
          </div>
        </div>
      }
    >
      <KaartClient />
    </Suspense>
  );
}
