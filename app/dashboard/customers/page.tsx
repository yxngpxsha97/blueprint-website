'use client';

import { useState, useEffect, useCallback } from 'react';

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: string;
  tags: string[];
  created_at: string;
}

interface CustomerConversation {
  id: string;
  status: string;
  channel: string;
  last_message_at: string | null;
  created_at: string;
}

interface CustomerQuote {
  id: string;
  quote_number: string;
  total_cents: number;
  status: string;
  created_at: string;
}

interface CustomerBooking {
  id: string;
  datetime: string;
  status: string;
  service: { name: string } | null;
}

const sourceLabels: Record<string, { label: string; classes: string }> = {
  whatsapp: { label: 'WhatsApp', classes: 'bg-emerald-50 text-emerald-600' },
  website: { label: 'Website', classes: 'bg-blue-50 text-blue-600' },
  manual: { label: 'Handmatig', classes: 'bg-gray-100 text-gray-500' },
  import: { label: 'Import', classes: 'bg-violet-50 text-violet-600' },
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    conversations: CustomerConversation[];
    quotes: CustomerQuote[];
    bookings: CustomerBooking[];
  } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('select', 'id,name,phone,email,source,tags,created_at');
      params.set('order', 'created_at.desc');
      params.set('limit', '200');
      const res = await fetch(`/api/dashboard/data?table=customers&${params.toString()}`);
      const data = await res.json();
      setCustomers(data.data ?? []);
    } catch {
      setCustomers([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  async function loadDetail(customerId: string) {
    setSelectedId(customerId);
    setLoadingDetail(true);
    try {
      const [convRes, quotesRes, bookingsRes] = await Promise.all([
        fetch(`/api/dashboard/data?table=conversations&customer_id=eq.${customerId}&select=id,status,channel,last_message_at,created_at&order=created_at.desc&limit=10`),
        fetch(`/api/dashboard/data?table=quotes&customer_id=eq.${customerId}&select=id,quote_number,total_cents,status,created_at&order=created_at.desc&limit=10`),
        fetch(`/api/dashboard/data?table=bookings&customer_id=eq.${customerId}&select=id,datetime,status,service:services(name)&order=datetime.desc&limit=10`),
      ]);

      const [convData, quotesData, bookingsData] = await Promise.all([
        convRes.json(),
        quotesRes.json(),
        bookingsRes.json(),
      ]);

      setDetail({
        conversations: convData.data ?? [],
        quotes: quotesData.data ?? [],
        bookings: bookingsData.data ?? [],
      });
    } catch {
      setDetail({ conversations: [], quotes: [], bookings: [] });
    }
    setLoadingDetail(false);
  }

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.phone?.includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      false
    );
  });

  const selectedCustomer = customers.find((c) => c.id === selectedId);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Klanten</h1>
        <p className="text-gray-500 text-sm mt-1">
          {customers.length} klant{customers.length !== 1 ? 'en' : ''} in totaal
        </p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-4 mb-6">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek op naam, telefoon of e-mail..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer table / list */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="w-10 h-10 bg-gray-100 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-40" />
                      <div className="h-3 bg-gray-100 rounded w-56" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                </svg>
                <p className="text-gray-400 text-sm">Geen klanten gevonden</p>
                <p className="text-gray-400 text-xs mt-1">Klanten worden automatisch aangemaakt via WhatsApp of uw website.</p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50/80">
                        <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Naam</th>
                        <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Telefoon</th>
                        <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">E-mail</th>
                        <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Bron</th>
                        <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Aangemaakt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((customer) => {
                        const src = sourceLabels[customer.source] ?? sourceLabels.manual;
                        const isSelected = selectedId === customer.id;

                        return (
                          <tr
                            key={customer.id}
                            onClick={() => loadDetail(customer.id)}
                            className={`border-b border-gray-100 cursor-pointer transition ${
                              isSelected
                                ? 'bg-blue-50'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-bold text-blue-600">
                                    {customer.name[0]?.toUpperCase() ?? '?'}
                                  </span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">{customer.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">{customer.phone ?? '-'}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{customer.email ?? '-'}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${src.classes}`}>
                                {src.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-400">{formatDate(customer.created_at)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile card layout */}
                <div className="md:hidden divide-y divide-gray-100">
                  {filtered.map((customer) => {
                    const src = sourceLabels[customer.source] ?? sourceLabels.manual;
                    return (
                      <button
                        key={customer.id}
                        onClick={() => loadDetail(customer.id)}
                        className="w-full text-left px-4 py-4 hover:bg-gray-50 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-3 mb-1">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-blue-600">
                              {customer.name[0]?.toUpperCase() ?? '?'}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">{customer.name}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${src.classes}`}>
                            {src.label}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 pl-11">
                          {customer.phone ?? customer.email ?? 'Geen contactgegevens'}
                          <span className="text-gray-400 mx-1">&middot;</span>
                          {formatDate(customer.created_at)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Customer detail card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-6 sticky top-6">
            {!selectedId ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={0.75} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                <p className="text-sm text-gray-500">Selecteer een klant voor meer details</p>
              </div>
            ) : loadingDetail ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-12 bg-gray-100 rounded-full w-12 mx-auto" />
                <div className="h-5 bg-gray-100 rounded w-40 mx-auto" />
                <div className="h-4 bg-gray-100 rounded w-32 mx-auto" />
                <div className="space-y-2 mt-6">
                  <div className="h-4 bg-gray-100 rounded" />
                  <div className="h-4 bg-gray-100 rounded" />
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                </div>
              </div>
            ) : selectedCustomer ? (
              <>
                {/* Customer header */}
                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-blue-600">
                      {selectedCustomer.name[0]?.toUpperCase() ?? '?'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedCustomer.name}</h3>
                  <p className="text-sm text-gray-500">
                    Klant sinds {formatDate(selectedCustomer.created_at)}
                  </p>
                </div>

                {/* Contact info */}
                <div className="space-y-2 mb-6">
                  {selectedCustomer.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                      </svg>
                      <span className="text-gray-600">{selectedCustomer.phone}</span>
                    </div>
                  )}
                  {selectedCustomer.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                      </svg>
                      <span className="text-gray-600">{selectedCustomer.email}</span>
                    </div>
                  )}
                </div>

                {/* Related data */}
                {detail && (
                  <div className="space-y-4">
                    {/* Conversations */}
                    <div>
                      <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Gesprekken ({detail.conversations.length})
                      </h4>
                      {detail.conversations.length === 0 ? (
                        <p className="text-xs text-gray-400">Geen gesprekken</p>
                      ) : (
                        <div className="space-y-1">
                          {detail.conversations.slice(0, 3).map((c) => (
                            <div key={c.id} className="flex items-center justify-between text-xs py-1">
                              <span className="text-gray-600">
                                {c.channel === 'whatsapp' ? 'WhatsApp' : 'Web'} &middot; {c.status}
                              </span>
                              <span className="text-gray-400">{formatDate(c.created_at)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quotes */}
                    <div>
                      <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Offertes ({detail.quotes.length})
                      </h4>
                      {detail.quotes.length === 0 ? (
                        <p className="text-xs text-gray-400">Geen offertes</p>
                      ) : (
                        <div className="space-y-1">
                          {detail.quotes.slice(0, 3).map((q) => (
                            <div key={q.id} className="flex items-center justify-between text-xs py-1">
                              <span className="text-gray-600">{q.quote_number}</span>
                              <span className="font-medium text-gray-900">{formatCents(q.total_cents)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bookings */}
                    <div>
                      <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Afspraken ({detail.bookings.length})
                      </h4>
                      {detail.bookings.length === 0 ? (
                        <p className="text-xs text-gray-400">Geen afspraken</p>
                      ) : (
                        <div className="space-y-1">
                          {detail.bookings.slice(0, 3).map((b) => (
                            <div key={b.id} className="flex items-center justify-between text-xs py-1">
                              <span className="text-gray-600">{b.service?.name ?? 'Geen dienst'}</span>
                              <span className="text-gray-400">{formatDate(b.datetime)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
