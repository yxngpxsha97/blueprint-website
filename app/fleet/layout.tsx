// ============================================================================
// Marifest — Standalone Layout
// Navy + white maritime operations center (Gugten house style, light-only).
// Independent of /dashboard layout and sidebar.
// ============================================================================

import './fleet-design-system.css';
import { requireAuth } from '@/lib/auth';
import FleetSidebar from './fleet-sidebar';
import { FleetThemeProvider } from './theme-provider';
import FleetSplash from './_brand/FleetSplash';
import PWARegister from './_brand/PWARegister';

export const metadata = {
  title: 'Marifest — Maritime Intelligence',
  description: 'Know every ship. Search any vessel, track live positions and specifications.',
  manifest: '/marifest.webmanifest',
  icons: { icon: '/icon-192.png', apple: '/apple-touch-icon.png' },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Marifest' },
};

export const viewport = {
  themeColor: '#0F2A47',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function FleetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  return (
    <FleetThemeProvider>
      <FleetSplash />
      <PWARegister />
      <FleetSidebar
        orgName={session.org_name}
        userName={session.user_name}
        userEmail={session.user_email}
      />
      <div className="flex-1 flex flex-col min-w-0" style={{ background: 'var(--paper)' }}>
        {children}
      </div>
    </FleetThemeProvider>
  );
}
