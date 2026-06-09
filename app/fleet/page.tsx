import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth';
import FleetDashboardClient from './fleet-dashboard-client';

export const metadata = {
  title: 'Marifest — Dashboard',
};

export default async function FleetDashboardPage() {
  const session = await requireAuth();
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center" style={{ minHeight: '100vh', background: '#0A0F1E' }}>
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-8 h-8 border-2 rounded-full animate-spin"
              style={{ borderColor: '#06B6D4', borderTopColor: 'transparent' }}
            />
            <span style={{ color: 'rgba(226,232,240,0.5)', fontSize: 13 }}>Loading...</span>
          </div>
        </div>
      }
    >
      <FleetDashboardClient orgName={session.org_name} />
    </Suspense>
  );
}
