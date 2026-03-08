'use client';

import { useState, useEffect, useCallback } from 'react';

type Tab = 'bedrijf' | 'webshop' | 'abonnement' | 'api';

interface Organization {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  kvk_number: string | null;
  btw_number: string | null;
  sector: string | null;
  subscription_tier: string;
}

interface WebshopConfig {
  id: string;
  org_id: string;
  domain: string | null;
  theme: {
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      text: string;
    };
    fonts: { heading: string; body: string };
    border_radius: string;
  };
  hero_title: string | null;
  hero_subtitle: string | null;
  seo_title: string | null;
  seo_description: string | null;
  published: boolean;
}

interface Subscription {
  id: string;
  tier: string;
  price_cents: number;
  status: string;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
}

const tierLabels: Record<string, string> = {
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
};

const tierLimits: Record<string, { conversations: number; features: string[] }> = {
  starter: {
    conversations: 100,
    features: ['AI Webshop', 'WhatsApp Bot (basis)', 'Offerte Generator'],
  },
  professional: {
    conversations: 500,
    features: ['Alles van Starter', 'Geavanceerde WhatsApp Bot', 'Afspraken systeem', 'Analytics dashboard'],
  },
  enterprise: {
    conversations: -1,
    features: ['Alles van Professional', 'API toegang', 'Custom integraties', 'Dedicated support', 'White-label opties'],
  },
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('bedrijf');
  const [org, setOrg] = useState<Organization | null>(null);
  const [webshop, setWebshop] = useState<WebshopConfig | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [orgForm, setOrgForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    kvk_number: '',
    btw_number: '',
  });

  const [webshopForm, setWebshopForm] = useState({
    primary_color: '#2563EB',
    hero_title: '',
    hero_subtitle: '',
    seo_title: '',
    seo_description: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [orgRes, webshopRes, subRes] = await Promise.all([
        fetch('/api/dashboard/data?table=organizations&select=id,name,phone,email,address,kvk_number,btw_number,sector,subscription_tier&limit=1'),
        fetch('/api/dashboard/data?table=webshop_config&select=id,org_id,domain,theme,hero_title,hero_subtitle,seo_title,seo_description,published&limit=1'),
        fetch('/api/dashboard/data?table=subscriptions&select=id,tier,price_cents,status,trial_ends_at,current_period_start,current_period_end&limit=1'),
      ]);

      const [orgData, webshopData, subData] = await Promise.all([
        orgRes.json(),
        webshopRes.json(),
        subRes.json(),
      ]);

      const orgRow = orgData.data?.[0] ?? null;
      const webshopRow = webshopData.data?.[0] ?? null;
      const subRow = subData.data?.[0] ?? null;

      setOrg(orgRow);
      setWebshop(webshopRow);
      setSubscription(subRow);

      if (orgRow) {
        setOrgForm({
          name: orgRow.name ?? '',
          phone: orgRow.phone ?? '',
          email: orgRow.email ?? '',
          address: orgRow.address ?? '',
          kvk_number: orgRow.kvk_number ?? '',
          btw_number: orgRow.btw_number ?? '',
        });
      }

      if (webshopRow) {
        setWebshopForm({
          primary_color: webshopRow.theme?.colors?.primary ?? '#2563EB',
          hero_title: webshopRow.hero_title ?? '',
          hero_subtitle: webshopRow.hero_subtitle ?? '',
          seo_title: webshopRow.seo_title ?? '',
          seo_description: webshopRow.seo_description ?? '',
        });
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function saveOrg() {
    if (!org) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch(`/api/dashboard/data?table=organizations&id=${org.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orgForm.name,
          phone: orgForm.phone || null,
          email: orgForm.email || null,
          address: orgForm.address || null,
          kvk_number: orgForm.kvk_number || null,
          btw_number: orgForm.btw_number || null,
        }),
      });
      if (res.ok) {
        setSaveMessage({ type: 'success', text: 'Bedrijfsgegevens opgeslagen.' });
      } else {
        setSaveMessage({ type: 'error', text: 'Opslaan mislukt. Probeer het opnieuw.' });
      }
    } catch {
      setSaveMessage({ type: 'error', text: 'Verbindingsfout.' });
    }
    setSaving(false);
  }

  async function saveWebshop() {
    if (!webshop) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const updatedTheme = {
        ...webshop.theme,
        colors: {
          ...webshop.theme.colors,
          primary: webshopForm.primary_color,
        },
      };

      const res = await fetch(`/api/dashboard/data?table=webshop_config&id=${webshop.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: updatedTheme,
          hero_title: webshopForm.hero_title || null,
          hero_subtitle: webshopForm.hero_subtitle || null,
          seo_title: webshopForm.seo_title || null,
          seo_description: webshopForm.seo_description || null,
        }),
      });
      if (res.ok) {
        setSaveMessage({ type: 'success', text: 'Webshop instellingen opgeslagen.' });
      } else {
        setSaveMessage({ type: 'error', text: 'Opslaan mislukt. Probeer het opnieuw.' });
      }
    } catch {
      setSaveMessage({ type: 'error', text: 'Verbindingsfout.' });
    }
    setSaving(false);
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    {
      key: 'bedrijf',
      label: 'Bedrijf',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
        </svg>
      ),
    },
    {
      key: 'webshop',
      label: 'Webshop',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.97.633-3.794 1.706-5.274" />
        </svg>
      ),
    },
    {
      key: 'abonnement',
      label: 'Abonnement',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
        </svg>
      ),
    },
    {
      key: 'api',
      label: 'API',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
        </svg>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Instellingen</h1>
        </div>
        <div className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-8">
          <div className="space-y-6 animate-pulse">
            <div className="h-10 bg-gray-100 rounded w-full" />
            <div className="space-y-4">
              <div className="h-5 bg-gray-100 rounded w-32" />
              <div className="h-10 bg-gray-50 rounded" />
              <div className="h-5 bg-gray-100 rounded w-28" />
              <div className="h-10 bg-gray-50 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Instellingen</h1>
        <p className="text-gray-500 text-sm mt-1">Beheer uw bedrijfsprofiel en instellingen</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-3">
          <div className="flex overflow-x-auto gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setSaveMessage(null); }}
                className={`flex items-center gap-2 px-4 py-1.5 text-[12px] whitespace-nowrap transition cursor-pointer rounded-full ${
                  activeTab === tab.key
                    ? 'bg-gray-900 text-white font-semibold'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Save message */}
          {saveMessage && (
            <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${
              saveMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-red-50 text-red-600'
            }`}>
              {saveMessage.text}
            </div>
          )}

          {/* Bedrijfsgegevens tab */}
          {activeTab === 'bedrijf' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bedrijfsnaam</label>
                <input
                  type="text"
                  value={orgForm.name}
                  onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefoonnummer</label>
                  <input
                    type="tel"
                    value={orgForm.phone}
                    onChange={(e) => setOrgForm({ ...orgForm, phone: e.target.value })}
                    placeholder="+31 6 12345678"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mailadres</label>
                  <input
                    type="email"
                    value={orgForm.email}
                    onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })}
                    placeholder="info@bedrijf.nl"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Adres</label>
                <input
                  type="text"
                  value={orgForm.address}
                  onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })}
                  placeholder="Straatnaam 123, 1234 AB Amsterdam"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">KvK-nummer</label>
                  <input
                    type="text"
                    value={orgForm.kvk_number}
                    onChange={(e) => setOrgForm({ ...orgForm, kvk_number: e.target.value })}
                    placeholder="12345678"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">BTW-nummer</label>
                  <input
                    type="text"
                    value={orgForm.btw_number}
                    onChange={(e) => setOrgForm({ ...orgForm, btw_number: e.target.value })}
                    placeholder="NL123456789B01"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button
                  onClick={saveOrg}
                  disabled={saving}
                  className="bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-600 disabled:opacity-50 transition shadow-sm cursor-pointer"
                >
                  {saving ? 'Opslaan...' : 'Opslaan'}
                </button>
              </div>
            </div>
          )}

          {/* Webshop tab */}
          {activeTab === 'webshop' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Primaire kleur</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={webshopForm.primary_color}
                    onChange={(e) => setWebshopForm({ ...webshopForm, primary_color: e.target.value })}
                    className="w-12 h-10 bg-transparent border border-gray-200 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={webshopForm.primary_color}
                    onChange={(e) => setWebshopForm({ ...webshopForm, primary_color: e.target.value })}
                    className="w-32 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Hero titel</label>
                <input
                  type="text"
                  value={webshopForm.hero_title}
                  onChange={(e) => setWebshopForm({ ...webshopForm, hero_title: e.target.value })}
                  placeholder="Welkom bij uw bedrijf"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Hero ondertitel</label>
                <input
                  type="text"
                  value={webshopForm.hero_subtitle}
                  onChange={(e) => setWebshopForm({ ...webshopForm, hero_subtitle: e.target.value })}
                  placeholder="Uw slogan of beschrijving"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">SEO titel</label>
                <input
                  type="text"
                  value={webshopForm.seo_title}
                  onChange={(e) => setWebshopForm({ ...webshopForm, seo_title: e.target.value })}
                  placeholder="Bedrijfsnaam — Wat u doet"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">SEO beschrijving</label>
                <textarea
                  value={webshopForm.seo_description}
                  onChange={(e) => setWebshopForm({ ...webshopForm, seo_description: e.target.value })}
                  rows={3}
                  placeholder="Een korte beschrijving van uw bedrijf voor zoekmachines..."
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 resize-none"
                />
              </div>
              {webshop && (
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-2.5 h-2.5 rounded-full ${webshop.published ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  <span className="text-gray-500">
                    {webshop.published ? 'Webshop is gepubliceerd' : 'Webshop is nog niet gepubliceerd'}
                  </span>
                  {webshop.domain && (
                    <span className="text-gray-400">&middot; {webshop.domain}</span>
                  )}
                </div>
              )}
              <div className="pt-4 flex justify-end">
                <button
                  onClick={saveWebshop}
                  disabled={saving}
                  className="bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-600 disabled:opacity-50 transition shadow-sm cursor-pointer"
                >
                  {saving ? 'Opslaan...' : 'Opslaan'}
                </button>
              </div>
            </div>
          )}

          {/* Abonnement tab */}
          {activeTab === 'abonnement' && (
            <div className="space-y-6">
              {/* Current plan */}
              <div className="relative overflow-hidden rounded-xl bg-blue-50/50 p-5">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-500" />
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {tierLabels[subscription?.tier ?? org?.subscription_tier ?? 'starter']}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {subscription?.status === 'trial'
                        ? 'Proefperiode'
                        : subscription?.status === 'active'
                        ? 'Actief abonnement'
                        : subscription?.status ?? 'Onbekend'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
                      {subscription
                        ? new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(subscription.price_cents / 100)
                        : '-'}
                    </p>
                    <p className="text-xs text-gray-400">per maand</p>
                  </div>
                </div>
                {subscription?.trial_ends_at && (
                  <p className="text-sm bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg">
                    Proefperiode eindigt op {formatDate(subscription.trial_ends_at)}
                  </p>
                )}
                {subscription?.current_period_end && !subscription.trial_ends_at && (
                  <p className="text-xs text-gray-400">
                    Volgende factuurdatum: {formatDate(subscription.current_period_end)}
                  </p>
                )}
              </div>

              {/* Features */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Inbegrepen functies</h4>
                <ul className="space-y-2">
                  {(tierLimits[subscription?.tier ?? org?.subscription_tier ?? 'starter']?.features ?? []).map(
                    (feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                        {feature}
                      </li>
                    )
                  )}
                </ul>
              </div>

              {/* Usage */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Verbruik</h4>
                <div className="bg-white rounded-xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Gesprekken deze maand</span>
                    <span className="text-sm font-medium text-gray-900">
                      0 / {tierLimits[subscription?.tier ?? org?.subscription_tier ?? 'starter']?.conversations === -1
                        ? 'Onbeperkt'
                        : tierLimits[subscription?.tier ?? org?.subscription_tier ?? 'starter']?.conversations}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-500 rounded-full h-2" style={{ width: '0%' }} />
                  </div>
                </div>
              </div>

              {/* Upgrade CTA */}
              {(subscription?.tier ?? org?.subscription_tier) !== 'enterprise' && (
                <div className="relative overflow-hidden rounded-xl bg-blue-500 p-5 text-white shadow-sm">
                  <h4 className="font-bold text-lg mb-1 relative">Upgrade uw abonnement</h4>
                  <p className="text-sm text-white/80 mb-4 relative">
                    Krijg toegang tot meer functies en hogere limieten.
                  </p>
                  <button className="relative bg-white text-blue-600 font-semibold px-5 py-2 rounded-xl hover:bg-blue-50 transition cursor-pointer">
                    Bekijk opties
                  </button>
                </div>
              )}
            </div>
          )}

          {/* API tab */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              {(subscription?.tier ?? org?.subscription_tier) === 'enterprise' ? (
                <>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">API Sleutel</h4>
                    <p className="text-sm text-gray-500 mb-3">
                      Gebruik deze sleutel om programmatisch toegang te krijgen tot uw Blueprint data.
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        value="bp_live_xxxxxxxxxxxxxxxxxxxxxxxxx"
                        readOnly
                        className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 font-mono"
                      />
                      <button className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition cursor-pointer">
                        Kopieer
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Webhook URL</h4>
                    <p className="text-sm text-gray-500 mb-3">
                      Ontvang real-time meldingen wanneer er nieuwe gesprekken, offertes of afspraken worden aangemaakt.
                    </p>
                    <input
                      type="url"
                      placeholder="https://uw-server.nl/webhook"
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
                    />
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">API Documentatie</h4>
                    <p className="text-sm text-gray-500">
                      Bekijk onze volledige API documentatie voor integratiemogelijkheden.
                    </p>
                    <a
                      href="#"
                      className="inline-flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600 font-medium mt-2"
                    >
                      Naar documentatie
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </a>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-50 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-200" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">API toegang is beschikbaar op Enterprise</h3>
                  <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
                    Upgrade naar het Enterprise abonnement om API toegang, webhooks en custom integraties te gebruiken.
                  </p>
                  <button className="bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-600 transition shadow-sm cursor-pointer">
                    Upgrade naar Enterprise
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
