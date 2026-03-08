'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';

interface QuoteCustomer {
  name: string;
  phone: string | null;
  email: string | null;
}

interface QuoteItem {
  name: string;
  qty: number;
  unit_price_cents: number;
  total_cents: number;
}

interface Quote {
  id: string;
  quote_number: string;
  customer_id: string | null;
  items: QuoteItem[];
  subtotal_cents: number;
  btw_percentage: number;
  btw_cents: number;
  total_cents: number;
  status: string;
  valid_until: string | null;
  notes: string | null;
  pdf_url: string | null;
  sent_at: string | null;
  created_at: string;
  customer: QuoteCustomer | null;
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  draft: { label: 'Concept', classes: 'bg-gray-100 text-gray-500' },
  sent: { label: 'Verstuurd', classes: 'bg-blue-50 text-blue-600' },
  viewed: { label: 'Bekeken', classes: 'bg-amber-50 text-amber-600' },
  accepted: { label: 'Geaccepteerd', classes: 'bg-emerald-50 text-emerald-600' },
  rejected: { label: 'Afgewezen', classes: 'bg-red-50 text-red-600' },
  expired: { label: 'Verlopen', classes: 'bg-gray-100 text-gray-400' },
};

function formatCents(cents: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('select', 'id,quote_number,customer_id,items,subtotal_cents,btw_percentage,btw_cents,total_cents,status,valid_until,notes,pdf_url,sent_at,created_at,customer:customers(name,phone,email)');
      params.set('order', 'created_at.desc');
      params.set('limit', '100');

      if (statusFilter !== 'all') {
        params.set('status', `eq.${statusFilter}`);
      }

      const res = await fetch(`/api/dashboard/data?table=quotes&${params.toString()}`);
      const data = await res.json();
      setQuotes(data.data ?? []);
    } catch {
      setQuotes([]);
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

  const filtered = quotes.filter((q) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      q.quote_number.toLowerCase().includes(term) ||
      q.customer?.name?.toLowerCase().includes(term) ||
      false
    );
  });

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Offertes</h1>
          <p className="text-gray-500 text-sm mt-1">Beheer al uw offertes</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-600 shadow-sm transition cursor-pointer">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nieuwe offerte
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Zoek op klantnaam of offertenummer..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 cursor-pointer"
          >
            <option value="all">Alle statussen</option>
            <option value="draft">Concept</option>
            <option value="sent">Verstuurd</option>
            <option value="accepted">Geaccepteerd</option>
            <option value="rejected">Afgewezen</option>
            <option value="expired">Verlopen</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="h-5 bg-gray-100 rounded w-32" />
                <div className="h-5 bg-gray-100 rounded w-40" />
                <div className="h-5 bg-gray-100 rounded w-24" />
                <div className="h-5 bg-gray-100 rounded w-20" />
                <div className="h-5 bg-gray-100 rounded w-28" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            <p className="text-gray-400 text-sm">Geen offertes gevonden</p>
            <p className="text-gray-400 text-xs mt-1">Maak uw eerste offerte aan om te beginnen.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Offertenummer</th>
                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Klant</th>
                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Bedrag</th>
                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Datum</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((quote) => {
                    const sc = statusConfig[quote.status] ?? statusConfig.draft;
                    const isExpanded = expandedId === quote.id;

                    return (
                      <Fragment key={quote.id}>
                        <tr
                          onClick={() => setExpandedId(isExpanded ? null : quote.id)}
                          className="border-b border-gray-100 cursor-pointer transition hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{quote.quote_number}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{quote.customer?.name ?? '-'}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatCents(quote.total_cents)}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sc.classes}`}>
                              {sc.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">{formatDate(quote.created_at)}</td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${quote.id}-detail`}>
                            <td colSpan={5} className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Regelitems</h4>
                                  {quote.items && quote.items.length > 0 ? (
                                    <div className="space-y-1">
                                      {quote.items.map((item, i) => (
                                        <div key={i} className="flex justify-between text-sm">
                                          <span className="text-gray-500">{item.qty}x {item.name}</span>
                                          <span className="text-gray-900 font-medium">{formatCents(item.total_cents)}</span>
                                        </div>
                                      ))}
                                      <div className="border-t border-gray-200 pt-1 mt-2">
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-400">Subtotaal</span>
                                          <span className="text-gray-500">{formatCents(quote.subtotal_cents)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-400">BTW ({quote.btw_percentage}%)</span>
                                          <span className="text-gray-500">{formatCents(quote.btw_cents)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-bold mt-1">
                                          <span className="text-gray-900">Totaal</span>
                                          <span className="text-gray-900">{formatCents(quote.total_cents)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-sm text-gray-400">Geen items</p>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  {quote.customer && (
                                    <div>
                                      <span className="text-xs font-medium text-gray-400 uppercase">Klant</span>
                                      <p className="text-sm text-gray-900">{quote.customer.name}</p>
                                      {quote.customer.phone && <p className="text-sm text-gray-500">{quote.customer.phone}</p>}
                                      {quote.customer.email && <p className="text-sm text-gray-500">{quote.customer.email}</p>}
                                    </div>
                                  )}
                                  {quote.valid_until && (
                                    <div>
                                      <span className="text-xs font-medium text-gray-400 uppercase">Geldig tot</span>
                                      <p className="text-sm text-gray-900">{formatDate(quote.valid_until)}</p>
                                    </div>
                                  )}
                                  {quote.notes && (
                                    <div>
                                      <span className="text-xs font-medium text-gray-400 uppercase">Notities</span>
                                      <p className="text-sm text-gray-500">{quote.notes}</p>
                                    </div>
                                  )}
                                  {quote.pdf_url && (
                                    <a
                                      href={quote.pdf_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600 font-medium"
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                      </svg>
                                      Download PDF
                                    </a>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile card layout */}
            <div className="md:hidden divide-y divide-gray-100">
              {filtered.map((quote) => {
                const sc = statusConfig[quote.status] ?? statusConfig.draft;
                return (
                  <div key={quote.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-900">{quote.quote_number}</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sc.classes}`}>
                        {sc.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{quote.customer?.name ?? 'Geen klant'}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-bold text-gray-900">{formatCents(quote.total_cents)}</span>
                      <span className="text-xs text-gray-400">{formatDate(quote.created_at)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
