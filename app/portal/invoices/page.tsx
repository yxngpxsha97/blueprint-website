"use client";

import { useState, useEffect } from "react";

interface Payment {
  id: string;
  amount_cents: number;
  currency: string;
  status: string;
  mollie_payment_id: string | null;
  paid_at: string | null;
  created_at: string;
  quote_id: string | null;
}

function formatAmount(cents: number): string {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long", year: "numeric" }).format(new Date(dateStr));
}

const statusStyles: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-600",
  open: "bg-amber-50 text-amber-600",
  pending: "bg-amber-50 text-amber-600",
  failed: "bg-red-50 text-red-600",
  cancelled: "bg-gray-100 text-gray-500",
  expired: "bg-red-50 text-red-600",
  refunded: "bg-blue-50 text-blue-600",
};

const statusLabels: Record<string, string> = {
  paid: "Betaald",
  open: "Open",
  pending: "In afwachting",
  failed: "Mislukt",
  cancelled: "Geannuleerd",
  expired: "Verlopen",
  refunded: "Terugbetaald",
};

export default function InvoicesPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/dashboard/data?table=payments&order=created_at.desc");
        if (res.ok) {
          const json = await res.json();
          setPayments(json.data || []);
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

  const totalPaid = payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount_cents, 0);
  const openAmount = payments.filter((p) => p.status === "open" || p.status === "pending").reduce((sum, p) => sum + p.amount_cents, 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Betalingen</h1>
        <p className="text-gray-500 mt-1">Bekijk uw betalingsgeschiedenis en openstaande bedragen.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-6">
          <span className="text-sm text-gray-500 font-medium">Totaal betaald</span>
          <div className="text-2xl font-bold text-gray-900 mt-2">{formatAmount(totalPaid)}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-6">
          <span className="text-sm text-gray-500 font-medium">Openstaand</span>
          <div className={`text-2xl font-bold mt-2 ${openAmount > 0 ? "text-amber-600" : "text-gray-900"}`}>
            {formatAmount(openAmount)}
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-6">
          <span className="text-sm text-gray-500 font-medium">Aantal betalingen</span>
          <div className="text-2xl font-bold text-gray-900 mt-2">{payments.length}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-[14px] font-bold text-gray-900">Betalingsgeschiedenis</h2>
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80 text-left">
                <th className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Referentie</th>
                <th className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Bedrag</th>
                <th className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Status</th>
                <th className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Datum</th>
                <th className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Betaald op</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 font-mono">
                    {p.mollie_payment_id || p.id.slice(0, 12)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{formatAmount(p.amount_cents)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[p.status] || "bg-gray-100 text-gray-500"}`}>
                      {statusLabels[p.status] || p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(p.created_at)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{p.paid_at ? formatDate(p.paid_at) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List */}
        <div className="sm:hidden divide-y divide-gray-100">
          {payments.map((p) => (
            <div key={p.id} className="px-6 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 font-mono">{p.mollie_payment_id || p.id.slice(0, 12)}</span>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[p.status] || "bg-gray-100 text-gray-500"}`}>
                  {statusLabels[p.status] || p.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{formatDate(p.created_at)}</span>
                <span className="text-gray-900 font-medium">{formatAmount(p.amount_cents)}</span>
              </div>
            </div>
          ))}
        </div>

        {payments.length === 0 && (
          <div className="px-6 py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">Nog geen betalingen beschikbaar</p>
          </div>
        )}
      </div>

      <div className="mt-6 bg-blue-50 rounded-xl p-4 flex items-start gap-3">
        <svg className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
        </svg>
        <div>
          <p className="text-sm text-blue-700 font-medium">Over betalingen</p>
          <p className="text-sm text-blue-700 mt-0.5">
            Betalingen worden verwerkt via Mollie. Neem contact op met{" "}
            <a href="mailto:info@blueprint.nl" className="text-blue-600 underline hover:text-blue-800">info@blueprint.nl</a>{" "}
            als u vragen heeft.
          </p>
        </div>
      </div>
    </div>
  );
}
