// ============================================================================
// Dashboard Overview — D365 Sales Hub 1:1 replica
// Matching: floating contact cards, warm pastel tints, inline pipeline,
// dashed score gauge, glassmorphism
// ============================================================================

import { requireAuth } from '@/lib/auth';
import { supabaseFetch } from '@/lib/supabase';
import type { Quote, Conversation, Booking, Customer, AuditLogEntry } from '@/lib/types';
import Link from 'next/link';

function formatCents(cents: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    'quote.created': 'Offerte aangemaakt',
    'quote.sent': 'Offerte verstuurd',
    'quote.accepted': 'Offerte geaccepteerd',
    'quote.rejected': 'Offerte afgewezen',
    'booking.created': 'Afspraak aangemaakt',
    'booking.confirmed': 'Afspraak bevestigd',
    'booking.cancelled': 'Afspraak geannuleerd',
    'booking.completed': 'Afspraak voltooid',
    'customer.created': 'Klant aangemaakt',
    'conversation.started': 'Gesprek gestart',
    'conversation.closed': 'Gesprek afgesloten',
    'message.sent': 'Bericht verstuurd',
    'user.login': 'Gebruiker ingelogd',
    'settings.updated': 'Instellingen bijgewerkt',
    'client_onboarded': 'Client onboarded',
    'payment.created': 'Betaling aangemaakt',
    'quote.updated': 'Offerte bijgewerkt',
  };
  return labels[action] || action;
}

const contactNames = [
  'Gabriela Christiansen', 'Halle Griffiths', 'Josiah Love',
  'Wyatt Wetmore', 'Jaclyn Moses', 'Emma de Vries',
  'Thomas Bakker', 'Sophie Jansen', 'Lucas Visser', 'Anna Smit',
];
const contactTasks = [
  'First customer call', 'Follow up mail', 'First customer call',
  'Follow up mail', 'First customer call', 'Schedule meeting',
  'Send proposal', 'Review contract', 'Follow up call', 'Onboarding check',
];

function getScoreBorder(score: number): string {
  if (score >= 80) return 'border-emerald-400';
  if (score >= 60) return 'border-amber-300';
  if (score >= 40) return 'border-orange-300';
  return 'border-red-300';
}

const avatarColors = [
  'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700',
  'bg-emerald-100 text-emerald-700', 'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700', 'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700', 'bg-teal-100 text-teal-700',
  'bg-indigo-100 text-indigo-700', 'bg-lime-100 text-lime-700',
];

export default async function DashboardPage() {
  const session = await requireAuth();
  const orgId = session.org_id;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1)).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [quotesRes, conversationsRes, bookingsRes, customersRes, auditRes] = await Promise.all([
    supabaseFetch<Quote[]>('quotes', {
      query: `org_id=eq.${orgId}&status=in.(draft,sent)&select=id,total_cents,status`,
      useServiceRole: true,
    }),
    supabaseFetch<Conversation[]>('conversations', {
      query: `org_id=eq.${orgId}&created_at=gte.${startOfMonth}&select=id,status`,
      useServiceRole: true,
    }),
    supabaseFetch<Booking[]>('bookings', {
      query: `org_id=eq.${orgId}&datetime=gte.${startOfWeek}&select=id,status,datetime`,
      useServiceRole: true,
    }),
    supabaseFetch<Customer[]>('customers', {
      query: `org_id=eq.${orgId}&created_at=gte.${thirtyDaysAgo}&select=id`,
      useServiceRole: true,
    }),
    supabaseFetch<AuditLogEntry[]>('audit_log', {
      query: `org_id=eq.${orgId}&order=created_at.desc&limit=10&select=id,action,entity_type,entity_id,metadata,created_at`,
      useServiceRole: true,
    }),
  ]);

  const activeQuotes = quotesRes.data?.length ?? 0;
  const conversations = conversationsRes.data?.length ?? 0;
  const bookings = bookingsRes.data?.length ?? 0;
  const newCustomers = customersRes.data?.length ?? 0;
  const recentActivity = auditRes.data ?? [];
  const totalQuoteValue = quotesRes.data?.reduce((sum, q) => sum + q.total_cents, 0) ?? 0;

  const totalActivity = activeQuotes + conversations + bookings + newCustomers;
  const activityScore = Math.min(99, Math.max(10, Math.floor(totalActivity * 4.5 + 30)));

  const workItems = recentActivity.length > 0
    ? recentActivity.map((entry, i) => ({
        id: entry.id,
        name: contactNames[i % contactNames.length],
        task: getActionLabel(entry.action),
        score: [90, 83, 72, 62, 32, 78, 55, 44, 88, 67][i % 10],
        date: formatDate(entry.created_at),
        initials: contactNames[i % contactNames.length].split(' ').map(w => w[0]).join(''),
        avatarClass: avatarColors[i % avatarColors.length],
      }))
    : contactNames.slice(0, 5).map((name, i) => ({
        id: `mock-${i}`,
        name,
        task: contactTasks[i],
        score: [90, 83, 72, 62, 32][i],
        date: '8.24.2023 7:24 am',
        initials: name.split(' ').map(w => w[0]).join(''),
        avatarClass: avatarColors[i],
      }));

  const selected = workItems[0];

  return (
    <div className="w-full">

      {/* Action toolbar — floating icons, no card */}
      <div className="flex items-center gap-0.5 mb-3 flex-wrap">
        {[
          { icon: 'M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z', label: 'Save' },
          { icon: 'M12 4.5v15m7.5-7.5h-15', label: 'New' },
          { icon: 'M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0', label: 'Delete' },
          { icon: 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182', label: 'Refresh' },
          { icon: 'M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z', label: 'Check Access' },
          { icon: 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z', label: 'To PDF' },
          { icon: 'M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.745 3.745 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z', label: 'Quality' },
          { icon: 'M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25', label: 'Process' },
        ].map((btn) => (
          <button key={btn.label} className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded-lg transition" style={{ color: 'var(--dash-text-secondary)' }}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d={btn.icon} />
            </svg>
            {btn.label}
          </button>
        ))}
        <button className="px-2 py-1.5 rounded-lg transition" style={{ color: 'var(--dash-text-muted)' }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
          </svg>
        </button>
      </div>

      {/* Contact header */}
      <div className="flex items-center gap-4 mb-3">
        <div className={`w-14 h-14 rounded-full ${selected.avatarClass} flex items-center justify-center flex-shrink-0`}>
          <span className="text-lg font-bold">{selected.initials}</span>
        </div>
        <div>
          <h1 className="text-[24px] font-bold tracking-tight" style={{ color: 'var(--dash-text)' }}>{selected.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full" style={{ background: 'var(--dash-active-bg)', color: 'var(--dash-active-text)' }}>Lead</span>
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full" style={{ background: 'var(--dash-active-bg)', color: 'var(--dash-accent)' }}>Sales Insight</span>
          </div>
        </div>
        <div className="ml-auto hidden lg:flex items-center gap-6 text-[11px]">
          <div><p style={{ color: 'var(--dash-text-muted)' }}>Lead Source</p><p className="font-semibold" style={{ color: 'var(--dash-text-secondary)' }}>Webinar</p></div>
          <div><p style={{ color: 'var(--dash-text-muted)' }}>Rating</p><p className="font-semibold" style={{ color: 'var(--dash-text-secondary)' }}>Warm</p></div>
          <div><p style={{ color: 'var(--dash-text-muted)' }}>Status</p><p className="font-semibold" style={{ color: 'var(--dash-text-secondary)' }}>New</p></div>
          <div className="flex items-center gap-2">
            <div><p style={{ color: 'var(--dash-text-muted)' }}>Owner</p><p className="font-semibold" style={{ color: 'var(--dash-text-secondary)' }}>{session.user_name}</p></div>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: 'var(--dash-active-bg)', color: 'var(--dash-active-text)' }}>
              {session.user_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline bar — INLINE: teal banner left + step markers right (same row) */}
      <div className="flex items-center gap-3 mb-4">
        {/* Teal banner pill */}
        <div className="bg-gradient-to-r from-teal-accent to-teal-dark rounded-full px-5 py-2.5 flex-shrink-0">
          <p className="text-white text-[12px] font-semibold">Opportunity Sales Process</p>
          <p className="text-white/70 text-[10px]">Active for 3 Days</p>
        </div>
        {/* Arrow left */}
        <button className="w-7 h-7 rounded-full flex items-center justify-center transition flex-shrink-0" style={{ border: '1px solid var(--dash-border)', color: 'var(--dash-text-muted)' }}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        {/* Compass/target glow indicator */}
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--dash-card)', border: '1px solid var(--dash-border)', boxShadow: `0 0 8px var(--dash-glow)` }}>
          <svg className="w-4 h-4 text-teal-accent" viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
          </svg>
        </div>
        {/* Pipeline steps — inline */}
        <div className="flex-1 flex items-center">
          {[
            { label: 'Qualify (3 D)', active: true },
            { label: 'Develop', active: false },
            { label: 'Propose', active: false },
            { label: 'Close', active: false },
          ].map((step, i) => (
            <div key={step.label} className="flex-1 flex items-center">
              {i > 0 && <div className="flex-1 h-[2px]" style={{ background: 'var(--dash-border)' }} />}
              <div className="flex flex-col items-center">
                <div className="w-7 h-7 rounded-full border-2 flex items-center justify-center" style={step.active ? { borderColor: 'var(--dash-accent)', background: 'var(--dash-accent)' } : { borderColor: 'var(--dash-border)', background: 'var(--dash-card)' }}>
                  {step.active ? (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  ) : (
                    <div className="w-2 h-2 rounded-full" style={{ background: 'var(--dash-border)' }} />
                  )}
                </div>
                <span className="text-[10px] mt-1 font-medium whitespace-nowrap" style={{ color: step.active ? 'var(--dash-accent)' : 'var(--dash-text-muted)' }}>
                  {step.label}
                </span>
              </div>
              {i < 3 && <div className="flex-1 h-[2px]" style={{ background: 'var(--dash-border)' }} />}
            </div>
          ))}
        </div>
        {/* Arrow right */}
        <button className="w-7 h-7 rounded-full flex items-center justify-center transition flex-shrink-0" style={{ border: '1px solid var(--dash-border)', color: 'var(--dash-text-muted)' }}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-5">
        <span className="text-white text-[12px] font-semibold px-5 py-2 rounded-full" style={{ background: 'var(--dash-accent-dark)' }}>Summary</span>
        <span className="text-[12px] px-4 py-2 rounded-full cursor-pointer transition" style={{ color: 'var(--dash-text-muted)' }}>Relationship Analytics</span>
        <span className="text-[12px] px-4 py-2 rounded-full cursor-pointer transition" style={{ color: 'var(--dash-text-muted)' }}>Details</span>
        <span className="text-[12px] px-4 py-2 rounded-full cursor-pointer transition" style={{ color: 'var(--dash-text-muted)' }}>Related</span>
      </div>

      {/* Main 2-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* ═══════════════════════════════════════════════════════ */}
        {/* LEFT: My Work — unified white panel with contact rows  */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div className="lg:col-span-4">
            {/* My Work header */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[20px] font-light tracking-tight" style={{ fontStyle: 'italic', color: 'var(--dash-text)' }}>My Work</h2>
              <div className="flex items-center gap-1">
                {['M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182',
                  'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5',
                  'm21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z',
                ].map((d) => (
                  <button key={d.slice(0,10)} className="w-8 h-8 rounded-full flex items-center justify-center transition" style={{ border: '1px solid var(--dash-border)', color: 'var(--dash-text-muted)', background: 'var(--dash-card)' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-center mb-3" style={{ color: 'var(--dash-text-muted)' }}>Today</p>

            {/* Individual floating contact cards */}
            <div className="space-y-3">
              {workItems.slice(0, 3).map((item, i) => (
                <div
                  key={item.id}
                  className="rounded-2xl p-4 cursor-pointer transition-all" style={{ background: 'var(--dash-card)', boxShadow: 'var(--dash-card-shadow)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-full ${item.avatarClass} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-[13px] font-bold">{item.initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--dash-text)' }}>{item.name}</p>
                      <p className="text-[11px] truncate" style={{ color: 'var(--dash-text-muted)' }}>{item.task}</p>
                    </div>
                    <button className="w-8 h-8 rounded-full flex items-center justify-center transition flex-shrink-0" style={{ border: '1px solid var(--dash-border)', color: 'var(--dash-text-muted)' }}>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--dash-badge-bg)', color: 'var(--dash-badge-text)' }}>Lead</span>
                      <span className="text-[10px]" style={{ color: 'var(--dash-text-muted)' }}>{item.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="w-7 h-7 rounded-full flex items-center justify-center transition" style={{ border: '1px solid var(--dash-border)', color: 'var(--dash-text-muted)' }}>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                        </svg>
                      </button>
                      <div className={`w-10 h-10 rounded-full border-[3px] ${getScoreBorder(item.score)} flex items-center justify-center`}>
                        <span className="text-[13px] font-bold" style={{ color: 'var(--dash-text)' }}>{item.score}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-center my-3" style={{ color: 'var(--dash-text-muted)' }}>3 weeks ago</p>

            <div className="space-y-3">
              {workItems.slice(3, 5).map((item) => (
                <div key={item.id} className="rounded-2xl p-4 cursor-pointer transition-all" style={{ background: 'var(--dash-card)', boxShadow: 'var(--dash-card-shadow)' }}>
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-full ${item.avatarClass} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-[13px] font-bold">{item.initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--dash-text)' }}>{item.name}</p>
                      <p className="text-[11px] truncate" style={{ color: 'var(--dash-text-muted)' }}>{item.task}</p>
                    </div>
                    <button className="w-8 h-8 rounded-full flex items-center justify-center transition flex-shrink-0" style={{ border: '1px solid var(--dash-border)', color: 'var(--dash-text-muted)' }}>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--dash-badge-bg)', color: 'var(--dash-badge-text)' }}>Lead</span>
                      <span className="text-[10px]" style={{ color: 'var(--dash-text-muted)' }}>{item.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="w-7 h-7 rounded-full flex items-center justify-center transition" style={{ border: '1px solid var(--dash-border)', color: 'var(--dash-text-muted)' }}>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                        </svg>
                      </button>
                      <div className={`w-10 h-10 rounded-full border-[3px] ${getScoreBorder(item.score)} flex items-center justify-center`}>
                        <span className="text-[13px] font-bold" style={{ color: 'var(--dash-text)' }}>{item.score}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* RIGHT: Detail — warm pastel backgrounds per column    */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div className="lg:col-span-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Col 1: Contact — clean white bg */}
            <div className="rounded-2xl p-5" style={{ background: 'var(--dash-col-contact)' }}>
              <h3 className="text-[16px] font-bold mb-4" style={{ color: 'var(--dash-text)' }}>Contact</h3>
              <div className="space-y-3">
                <div><p className="text-[10px]" style={{ color: 'var(--dash-text-muted)' }}>Topic</p><p className="text-[13px]" style={{ color: 'var(--dash-text)' }}>5 Cafe Grande Espresso Machines</p></div>
                <div><p className="text-[10px]" style={{ color: 'var(--dash-text-muted)' }}>First Name</p><p className="text-[13px]" style={{ color: 'var(--dash-text)' }}>{selected.name.split(' ')[0]}</p></div>
                <div><p className="text-[10px]" style={{ color: 'var(--dash-text-muted)' }}>Last Name</p><p className="text-[13px]" style={{ color: 'var(--dash-text)' }}>{selected.name.split(' ').slice(1).join(' ')}</p></div>
                <div><p className="text-[10px]" style={{ color: 'var(--dash-text-muted)' }}>Job Title</p><p className="text-[13px]" style={{ color: 'var(--dash-text)' }}>Purchasing Manager</p></div>
                <div className="flex items-center justify-between">
                  <div><p className="text-[10px]" style={{ color: 'var(--dash-text-muted)' }}>Business Phone</p><p className="text-[13px]" style={{ color: 'var(--dash-text)' }}>930-555-0168</p></div>
                  <button className="w-7 h-7 rounded-full flex items-center justify-center transition" style={{ border: '1px solid var(--dash-border)', color: 'var(--dash-text-muted)' }}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" /></svg>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div><p className="text-[10px]" style={{ color: 'var(--dash-text-muted)' }}>Mobile Phone</p><p className="text-[13px]" style={{ color: 'var(--dash-text)' }}>930-555-0169</p></div>
                  <button className="w-7 h-7 rounded-full flex items-center justify-center transition" style={{ border: '1px solid var(--dash-border)', color: 'var(--dash-text-muted)' }}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" /></svg>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div><p className="text-[10px]" style={{ color: 'var(--dash-text-muted)' }}>Email</p><p className="text-[13px]" style={{ color: 'var(--dash-accent)' }}>gabriela@consolidated.com</p></div>
                  <button className="w-7 h-7 rounded-full flex items-center justify-center transition" style={{ border: '1px solid var(--dash-border)', color: 'var(--dash-text-muted)' }}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
                  </button>
                </div>
              </div>
              <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--dash-border)' }}>
                <h3 className="text-[16px] font-bold mb-3" style={{ color: 'var(--dash-text)' }}>Company</h3>
                <div><p className="text-[10px]" style={{ color: 'var(--dash-text-muted)' }}>Company</p><p className="text-[13px]" style={{ color: 'var(--dash-text)' }}>Consolidated</p></div>
                <div className="mt-2"><p className="text-[10px]" style={{ color: 'var(--dash-text-muted)' }}>Website</p><p className="text-[13px]" style={{ color: 'var(--dash-accent)' }}>consolidated.com</p></div>
              </div>
            </div>

            {/* Col 2: Up Next — cool blue bg tint */}
            <div className="rounded-2xl p-5" style={{ background: 'var(--dash-col-upnext)' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[16px] font-bold" style={{ color: 'var(--dash-text)' }}>Up Next</h3>
                <button className="w-7 h-7 rounded-full flex items-center justify-center transition" style={{ border: '1px solid var(--dash-border)', color: 'var(--dash-text-muted)', background: 'var(--dash-card)' }}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" /></svg>
                </button>
              </div>
              <p className="text-[11px] mb-3" style={{ color: 'var(--dash-text-muted)' }}>Sequence: New Lead Nurturing</p>

              {/* Active task — BLUE */}
              <div className="rounded-2xl p-4 mb-3" style={{ background: 'var(--dash-active-bg)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--dash-accent-dark)' }}>
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" /></svg>
                  </div>
                  <div>
                    <p className="text-[13px] font-bold" style={{ color: 'var(--dash-text)' }}>First Customer Call</p>
                    <p className="text-[10px]" style={{ color: 'var(--dash-text-secondary)' }}>Step 1 · Due to 8:30 pm</p>
                  </div>
                </div>
                <p className="text-[12px] mb-3" style={{ color: 'var(--dash-text-secondary)' }}>Call to introduce yourself</p>
                <div className="flex items-center gap-2">
                  <button className="text-white text-[11px] font-semibold px-4 py-2 rounded-full flex items-center gap-1.5" style={{ background: 'var(--dash-accent-dark)' }}>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" /></svg>
                    Call
                  </button>
                  <button className="text-[11px] font-medium px-4 py-2 rounded-full transition" style={{ color: 'var(--dash-text-secondary)', border: '1px solid var(--dash-border)' }}>Mark Complete</button>
                </div>
              </div>

              {/* Upcoming tasks */}
              <div className="space-y-2.5">
                <div className="flex items-start gap-3 py-2.5 px-3 rounded-xl" style={{ background: 'var(--dash-task-row-1)' }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ border: '1px solid var(--dash-border)', color: 'var(--dash-text-muted)', background: 'var(--dash-card)' }}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold" style={{ color: 'var(--dash-text)' }}>Follow Up</p>
                    <p className="text-[10px]" style={{ color: 'var(--dash-text-muted)' }}>Step 2</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--dash-text-secondary)' }}>Follow up email after call</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 py-2.5 px-3 rounded-xl" style={{ background: 'var(--dash-task-row-2)' }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ border: '1px solid var(--dash-border)', color: 'var(--dash-text-muted)', background: 'var(--dash-card)' }}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" /></svg>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold" style={{ color: 'var(--dash-text)' }}>Second Customer Call</p>
                    <p className="text-[10px]" style={{ color: 'var(--dash-text-muted)' }}>Step 3 · Due to 16.04.2023 8:30 pm</p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--dash-border)' }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[16px] font-bold" style={{ color: 'var(--dash-text)' }}>Timeline</h3>
                  <div className="flex items-center gap-1">
                    {['+', 'filter', '...'].map((l) => (
                      <button key={l} className="w-6 h-6 rounded-full flex items-center justify-center transition" style={{ color: 'var(--dash-text-muted)' }}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d={l === '+' ? 'M12 4.5v15m7.5-7.5h-15' : l === 'filter' ? 'M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z' : 'M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z'} />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--dash-text-muted)' }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                  <input type="text" placeholder="Search Timeline" className="w-full rounded-xl py-2 pl-9 pr-3 text-[12px] focus:outline-none focus:ring-1" style={{ background: 'var(--dash-input-bg)', border: '1px solid var(--dash-border)', color: 'var(--dash-text-secondary)' }} />
                </div>
              </div>
            </div>

            {/* Col 3: Lead Score — cool blue/indigo bg tint */}
            <div className="rounded-2xl p-5" style={{ background: 'var(--dash-col-score)' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[16px] font-bold" style={{ color: 'var(--dash-text)' }}>Lead Score</h3>
                <div className="flex items-center gap-1">
                  <button className="w-6 h-6 rounded-full flex items-center justify-center transition" style={{ color: 'var(--dash-text-muted)' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
                  </button>
                  <button className="w-6 h-6 rounded-full flex items-center justify-center transition" style={{ color: 'var(--dash-text-muted)' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" /></svg>
                  </button>
                </div>
              </div>

              {/* Semicircle dashed gauge — speedometer style */}
              <div className="relative mx-auto" style={{ width: '100%', height: '120px' }}>
                <svg viewBox="0 0 200 115" className="w-full h-full">
                  {Array.from({ length: 50 }).map((_, i) => {
                    const total = 50;
                    const startDeg = 135;
                    const arcDeg = 270;
                    const deg = startDeg + (i / (total - 1)) * arcDeg;
                    const rad = (deg * Math.PI) / 180;
                    const cx = 100, cy = 78, r = 55;
                    const active = (i / (total - 1)) <= activityScore / 100;
                    return (
                      <line
                        key={i}
                        x1={cx + (r - 5) * Math.cos(rad)}
                        y1={cy + (r - 5) * Math.sin(rad)}
                        x2={cx + (r + 5) * Math.cos(rad)}
                        y2={cy + (r + 5) * Math.sin(rad)}
                        stroke={active ? 'var(--dash-accent)' : 'var(--dash-gauge-inactive)'}
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center" style={{ paddingTop: '12px' }}>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[44px] font-bold leading-none" style={{ color: 'var(--dash-score-text)' }}>{activityScore}</span>
                    <div>
                      <p className="text-[13px] font-semibold" style={{ color: 'var(--dash-score-text)' }}>{activityScore >= 80 ? 'Grade A' : activityScore >= 60 ? 'Grade B' : 'Grade C'}</p>
                      <p className="text-[11px] font-medium" style={{ color: 'var(--dash-accent)' }}>→ Steady</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 mt-3 pt-3" style={{ borderTop: '1px solid var(--dash-border)' }}>
                {[
                  { text: 'Purchase timeframe is', bold: 'next quarter' },
                  { text: 'Purchase process is', bold: 'individual' },
                  { text: 'Lead is', bold: 'relatively new' },
                  { text: 'Estimated budget is', bold: '$50,000.00' },
                ].map((item) => (
                  <div key={item.bold} className="flex items-start gap-2.5">
                    <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="var(--dash-accent)">
                      <path d="M12 4l8 16H4l8-16z" />
                    </svg>
                    <p className="text-[12px]" style={{ color: 'var(--dash-text-secondary)' }}>{item.text} <span className="font-bold" style={{ color: 'var(--dash-text)' }}>{item.bold}</span></p>
                  </div>
                ))}
              </div>

              {/* Who Knows Whom */}
              <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--dash-border)' }}>
                <h3 className="text-[16px] font-bold mb-3" style={{ color: 'var(--dash-text)' }}>Who Knows Whom</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ background: 'var(--dash-active-bg)', color: 'var(--dash-active-text)' }}>AS</div>
                      <div><p className="text-[12px] font-semibold" style={{ color: 'var(--dash-text)' }}>Alan Steiner</p><p className="text-[10px]" style={{ color: 'var(--dash-text-muted)' }}>alan@contoso.com</p></div>
                    </div>
                    <div className="flex gap-0.5">
                      <div className="w-2.5 h-2.5 rounded-sm bg-teal-accent" />
                      <div className="w-2.5 h-2.5 rounded-sm bg-teal-accent" />
                      <div className="w-2.5 h-2.5 rounded-sm bg-teal-accent" />
                      <div className="w-2.5 h-2.5 rounded-sm bg-teal-accent" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-[11px] font-bold text-amber-700">MS</div>
                      <div><p className="text-[12px] font-semibold" style={{ color: 'var(--dash-text)' }}>Mike Smith</p><p className="text-[10px]" style={{ color: 'var(--dash-text-muted)' }}>mike@contoso.com</p></div>
                    </div>
                    <div className="flex gap-0.5">
                      <div className="w-2.5 h-2.5 rounded-sm bg-teal-accent" />
                      <div className="w-2.5 h-2.5 rounded-sm bg-teal-accent" />
                      <div className="w-2.5 h-2.5 rounded-sm rounded-sm" style={{ background: 'var(--dash-gauge-inactive)' }} />
                      <div className="w-2.5 h-2.5 rounded-sm rounded-sm" style={{ background: 'var(--dash-gauge-inactive)' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
