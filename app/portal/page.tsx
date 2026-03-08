"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface SessionData {
  org_id: string;
  org_name: string;
  user_name: string;
  user_email: string;
  role: string;
}

interface OrgData {
  name: string;
  subscription_tier: string;
}

interface SubData {
  tier: string;
  status: string;
  current_period_end: string | null;
  price_cents: number;
}

interface ConvoCount {
  count: number;
}

interface AuditEntry {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
};

const PLAN_COLORS: Record<string, string> = {
  starter: "bg-gray-100 text-gray-600",
  professional: "bg-blue-50 text-blue-600",
  enterprise: "bg-blue-500 text-white",
};

const PLAN_LIMITS: Record<string, number> = {
  starter: 100,
  professional: 500,
  enterprise: 99999,
};

const PLAN_PRICES: Record<string, string> = {
  starter: "199",
  professional: "349",
  enterprise: "549",
};

const QUICK_LINKS = [
  {
    label: "Abonnement beheren",
    href: "/portal/subscription",
    desc: "Bekijk of wijzig uw huidige plan",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
      </svg>
    ),
  },
  {
    label: "Facturen bekijken",
    href: "/portal/invoices",
    desc: "Download uw facturen en betalingsoverzicht",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
  },
  {
    label: "Instellingen",
    href: "/portal/settings",
    desc: "Bedrijfsgegevens en webshop aanpassen",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    ),
  },
];

function ActivityIcon({ type }: { type: string | null }) {
  const classes = "w-4 h-4";
  switch (type) {
    case "quote": return <svg className={classes} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>;
    case "conversation": return <svg className={classes} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" /></svg>;
    case "booking": return <svg className={classes} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>;
    case "customer": return <svg className={classes} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>;
    default: return <svg className={classes} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Zojuist";
  if (mins < 60) return `${mins} min geleden`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} uur geleden`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Gisteren";
  return `${days} dagen geleden`;
}

export default function PortalOverview() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [org, setOrg] = useState<OrgData | null>(null);
  const [sub, setSub] = useState<SubData | null>(null);
  const [convoCount, setConvoCount] = useState(0);
  const [activity, setActivity] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [sessRes, orgRes, subRes, convoRes, actRes] = await Promise.all([
          fetch("/api/auth/session"),
          fetch("/api/dashboard/data?table=organizations&select=name,subscription_tier"),
          fetch("/api/dashboard/data?table=subscriptions&select=tier,status,current_period_end,price_cents&limit=1"),
          fetch("/api/dashboard/data?table=conversations&select=id"),
          fetch("/api/dashboard/data?table=audit_log&select=id,action,entity_type,entity_id,metadata,created_at&order=created_at.desc&limit=5"),
        ]);

        if (sessRes.ok) {
          const s = await sessRes.json();
          setSession(s.session);
        }
        if (orgRes.ok) {
          const o = await orgRes.json();
          if (o.data?.[0]) setOrg(o.data[0]);
        }
        if (subRes.ok) {
          const s = await subRes.json();
          if (s.data?.[0]) setSub(s.data[0]);
        }
        if (convoRes.ok) {
          const c = await convoRes.json();
          setConvoCount(Array.isArray(c.data) ? c.data.length : 0);
        }
        if (actRes.ok) {
          const a = await actRes.json();
          setActivity(a.data || []);
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const plan = sub?.tier || org?.subscription_tier || "professional";
  const limit = PLAN_LIMITS[plan] || 500;
  const usagePercent = Math.round((convoCount / limit) * 100);
  const isStarter = plan === "starter";
  const nextInvoice = sub?.current_period_end;

  function formatDate(dateStr: string): string {
    return new Intl.DateTimeFormat("nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(dateStr));
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Welkom, {org?.name || session?.org_name || "Uw Bedrijf"}
        </h1>
        <p className="text-gray-500 mt-1">
          Hier is een overzicht van uw account en recente activiteit.
        </p>
      </div>

      {isStarter && (
        <div className="mb-8 bg-blue-500 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg">Upgrade naar Professional</h3>
            <p className="text-blue-100 text-sm mt-1">
              Krijg toegang tot de offerte generator, agenda en 500 gesprekken per maand.
            </p>
          </div>
          <Link
            href="/portal/subscription"
            className="bg-white text-blue-600 px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors shrink-0 shadow-sm"
          >
            Bekijk plannen
          </Link>
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
        {/* Stat card: Huidig abonnement */}
        <div className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500 font-medium">Huidig abonnement</span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${PLAN_COLORS[plan] || "bg-gray-100 text-gray-600"}`}>
              {PLAN_LABELS[plan] || plan}
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {"\u20AC"}{PLAN_PRICES[plan] || "349"}
            <span className="text-sm text-gray-400 font-normal">/maand</span>
          </div>
        </div>

        {/* Stat card: Gesprekken */}
        <div className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500 font-medium">Gesprekken deze maand</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {convoCount}
            <span className="text-sm text-gray-400 font-normal">
              /{plan === "enterprise" ? "\u221E" : limit}
            </span>
          </div>
          {plan !== "enterprise" && (
            <>
              <div className="mt-3 w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    usagePercent > 80 ? "bg-amber-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">{usagePercent}% gebruikt</p>
            </>
          )}
        </div>

        {/* Stat card: Volgende factuur */}
        <div className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500 font-medium">Volgende factuur</span>
          </div>
          <div className="text-lg font-bold text-gray-900">
            {nextInvoice ? formatDate(nextInvoice) : "Niet beschikbaar"}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Automatisch gefactureerd
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Activity feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-[14px] font-bold text-gray-900">Recente activiteit</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {activity.map((item) => (
              <div key={item.id} className="px-6 py-4 flex items-center gap-4">
                <div className="w-9 h-9 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center shrink-0">
                  <ActivityIcon type={item.entity_type} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{item.action}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {item.entity_type && item.entity_id
                      ? `${item.entity_type}: ${item.entity_id.slice(0, 8)}...`
                      : ""}
                  </p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">{timeAgo(item.created_at)}</span>
              </div>
            ))}
          </div>
          {activity.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-400 text-sm">Nog geen activiteit</p>
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="space-y-4">
          <h2 className="text-[14px] font-bold text-gray-900">Snelle links</h2>
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  {link.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{link.label}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{link.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
