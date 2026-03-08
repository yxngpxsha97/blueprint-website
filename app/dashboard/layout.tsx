// ============================================================================
// Dashboard Layout — D365 Sales Hub style
// Full-width top header bar + sidebar + content area
// ============================================================================

import { requireAuth } from '@/lib/auth';
import Sidebar from './sidebar';
import ThemeProvider from './theme-provider';
import ThemeSwitcher from './theme-switcher';

export const metadata = {
  title: 'Dashboard — Blueprint',
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  const initials = session.user_name
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <ThemeProvider>
    <div className="min-h-screen transition-colors duration-300" style={{ background: 'var(--dash-bg)', color: 'var(--dash-text)' }}>
      {/* Full-width top header bar — D365 style */}
      <header className="fixed top-0 left-0 right-0 z-[60] h-[48px] backdrop-blur-xl flex items-center justify-between px-5 transition-colors duration-300" style={{ background: 'var(--dash-header)', borderBottom: '1px solid var(--dash-header-border)' }}>
        {/* Left: app grid + brand */}
        <div className="flex items-center gap-4">
          {/* 9-dot grid icon */}
          <button className="transition" style={{ color: 'var(--dash-text-muted)' }}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="5" r="1.5" />
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="19" cy="5" r="1.5" />
              <circle cx="5" cy="12" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="19" cy="12" r="1.5" />
              <circle cx="5" cy="19" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
              <circle cx="19" cy="19" r="1.5" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold tracking-tight" style={{ color: 'var(--dash-brand)' }}>blueprint</span>
            <span style={{ color: 'var(--dash-border)' }}>|</span>
            <span className="text-[14px] font-medium" style={{ color: 'var(--dash-text-secondary)' }}>Sales Hub</span>
          </div>
        </div>

        {/* Right: action icons + avatar */}
        <div className="flex items-center gap-1">
          {/* Search */}
          <button className="w-8 h-8 rounded-full flex items-center justify-center transition" style={{ color: 'var(--dash-text-muted)' }}>
            <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </button>
          {/* Clock */}
          <button className="w-8 h-8 rounded-full flex items-center justify-center transition" style={{ color: 'var(--dash-text-muted)' }}>
            <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </button>
          {/* Plus */}
          <button className="w-8 h-8 rounded-full flex items-center justify-center transition" style={{ color: 'var(--dash-text-muted)' }}>
            <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
          {/* Location pin */}
          <button className="w-8 h-8 rounded-full flex items-center justify-center transition" style={{ color: 'var(--dash-text-muted)' }}>
            <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
          </button>
          {/* Filter */}
          <button className="w-8 h-8 rounded-full flex items-center justify-center transition" style={{ color: 'var(--dash-text-muted)' }}>
            <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
            </svg>
          </button>
          {/* Settings */}
          <button className="w-8 h-8 rounded-full flex items-center justify-center transition" style={{ color: 'var(--dash-text-muted)' }}>
            <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </button>
          {/* Help */}
          <button className="w-8 h-8 rounded-full flex items-center justify-center transition" style={{ color: 'var(--dash-text-muted)' }}>
            <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
            </svg>
          </button>
          {/* Bell */}
          <button className="w-8 h-8 rounded-full flex items-center justify-center transition" style={{ color: 'var(--dash-text-muted)' }}>
            <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
          </button>
          {/* User avatar */}
          <div className="w-8 h-8 rounded-full overflow-hidden ml-1 flex items-center justify-center" style={{ background: `linear-gradient(135deg, var(--dash-avatar-from), var(--dash-avatar-to))` }}>
            <span className="text-[11px] font-bold text-white">{initials}</span>
          </div>
        </div>
      </header>

      <Sidebar
        orgName={session.org_name}
        userName={session.user_name}
        userEmail={session.user_email}
      />

      {/* Main content area — below header, right of sidebar */}
      <main className="lg:ml-[200px] min-h-screen pt-[48px]">
        <div className="p-5 lg:p-6">{children}</div>
        <ThemeSwitcher />
      </main>
    </div>
    </ThemeProvider>
  );
}
