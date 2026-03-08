import type { Metadata } from "next";
import Link from "next/link";

// ─── Supabase Config ───
const SUPABASE_URL = "https://nfhesgwmbgmztjxuvrvy.supabase.co";
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5maGVzZ3dtYmdtenRqeHV2cnZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjczMzU4MiwiZXhwIjoyMDg4MzA5NTgyfQ.TCpuvLGc0y2-3KOYunzoWfvVP3tiMd-JJtklC-tH8YY";

export const metadata: Metadata = {
  title: "Betaling — Blueprint",
  description: "Bekijk de status van uw betaling en ga verder naar de betaalpagina.",
};

// ─── Types ───

interface PaymentRecord {
  id: string;
  org_id: string;
  quote_id: string | null;
  mollie_payment_id: string | null;
  mollie_checkout_url: string | null;
  amount_cents: number;
  currency: string;
  status: "open" | "pending" | "paid" | "failed" | "cancelled" | "expired" | "refunded";
  paid_at: string | null;
  description: string | null;
  method: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface OrgRecord {
  id: string;
  name: string;
}

interface QuoteRecord {
  id: string;
  quote_number: string;
}

// ─── Data Fetching ───

async function getPayment(paymentId: string): Promise<PaymentRecord | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/payments?id=eq.${paymentId}&select=*&limit=1`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0] || null;
  } catch {
    return null;
  }
}

async function getOrg(orgId: string): Promise<OrgRecord | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/organizations?id=eq.${orgId}&select=id,name&limit=1`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0] || null;
  } catch {
    return null;
  }
}

async function getQuote(quoteId: string): Promise<QuoteRecord | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/quotes?id=eq.${quoteId}&select=id,quote_number&limit=1`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0] || null;
  } catch {
    return null;
  }
}

// ─── Helpers ───

function formatAmount(cents: number, currency: string = "EUR"): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

function statusLabel(status: PaymentRecord["status"]): string {
  const labels: Record<PaymentRecord["status"], string> = {
    open: "Wacht op betaling",
    pending: "In behandeling",
    paid: "Betaald",
    failed: "Mislukt",
    cancelled: "Geannuleerd",
    expired: "Verlopen",
    refunded: "Terugbetaald",
  };
  return labels[status] || status;
}

function statusColor(status: PaymentRecord["status"]): string {
  switch (status) {
    case "paid":
      return "bg-green-50 text-green-700 border-green-200";
    case "open":
    case "pending":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "failed":
    case "cancelled":
    case "expired":
      return "bg-red-50 text-red-700 border-red-200";
    case "refunded":
      return "bg-gray-50 text-gray-700 border-gray-200";
    default:
      return "bg-gray-50 text-gray-600 border-gray-200";
  }
}

// ─── Page Component ───

export default async function BetalingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const payment = await getPayment(id);

  if (!payment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Betaling niet gevonden
          </h1>
          <p className="text-gray-500 mb-8">
            Deze betaling bestaat niet of de link is ongeldig.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Terug naar homepage
          </Link>
        </div>
      </div>
    );
  }

  const org = await getOrg(payment.org_id);
  const quote = payment.quote_id ? await getQuote(payment.quote_id) : null;

  const isPending = payment.status === "open" || payment.status === "pending";
  const isPaid = payment.status === "paid";
  const isFailed =
    payment.status === "failed" ||
    payment.status === "cancelled" ||
    payment.status === "expired";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
              />
            </svg>
            Blueprint
          </Link>
          <span
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${statusColor(payment.status)}`}
          >
            {statusLabel(payment.status)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* ── Paid: Success State ── */}
        {isPaid && (
          <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8 sm:p-12 text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Betaling ontvangen
            </h1>
            <p className="text-gray-500 text-lg">
              Bedankt voor uw betaling. U ontvangt een bevestiging per e-mail.
            </p>
            {payment.paid_at && (
              <p className="text-sm text-gray-400 mt-4">
                Betaald op {formatDate(payment.paid_at)}
              </p>
            )}
          </div>
        )}

        {/* ── Failed / Cancelled / Expired: Error State ── */}
        {isFailed && (
          <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8 sm:p-12 text-center mb-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Betaling {payment.status === "expired" ? "verlopen" : "niet gelukt"}
            </h1>
            <p className="text-gray-500 text-lg mb-6">
              {payment.status === "expired"
                ? "De betaallink is verlopen. Vraag een nieuwe link aan bij het bedrijf."
                : "Er is iets misgegaan met uw betaling. Probeer het opnieuw of neem contact op."}
            </p>
            {payment.mollie_checkout_url && payment.status !== "expired" && (
              <a
                href={payment.mollie_checkout_url}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
                  />
                </svg>
                Opnieuw proberen
              </a>
            )}
          </div>
        )}

        {/* ── Open / Pending: Pay Now State ── */}
        {isPending && (
          <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8 sm:p-12 text-center mb-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
                />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Betaling voldoen
            </h1>
            <p className="text-gray-500 text-lg mb-8">
              Klik op de knop hieronder om veilig te betalen via Mollie.
            </p>
            {payment.mollie_checkout_url && (
              <a
                href={payment.mollie_checkout_url}
                className="inline-flex items-center gap-3 bg-blue-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
              >
                Ga naar betaling
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                  />
                </svg>
              </a>
            )}
          </div>
        )}

        {/* ── Payment Details Card ── */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 sm:px-8 py-5 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Betalingsgegevens</h2>
          </div>
          <div className="px-6 sm:px-8 py-6 space-y-5">
            {/* Bedrijf */}
            {org && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">Bedrijf</span>
                <span className="text-gray-900 font-medium">{org.name}</span>
              </div>
            )}

            {/* Offerte nummer */}
            {quote && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">Offerte</span>
                <span className="text-gray-900 font-medium">{quote.quote_number}</span>
              </div>
            )}

            {/* Omschrijving */}
            {payment.description && (
              <div className="flex justify-between items-start">
                <span className="text-gray-500 text-sm">Omschrijving</span>
                <span className="text-gray-900 font-medium text-right max-w-[60%]">
                  {payment.description}
                </span>
              </div>
            )}

            {/* Bedrag */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              <span className="text-gray-900 font-semibold">Totaalbedrag</span>
              <span className="text-2xl font-bold text-gray-900">
                {formatAmount(payment.amount_cents, payment.currency)}
              </span>
            </div>

            {/* Betaalmethode */}
            {payment.method && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">Betaalmethode</span>
                <span className="text-gray-900 font-medium capitalize">
                  {payment.method}
                </span>
              </div>
            )}

            {/* Datum */}
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Aangemaakt op</span>
              <span className="text-gray-600 text-sm">
                {formatDate(payment.created_at)}
              </span>
            </div>

            {/* Referentie */}
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Referentie</span>
              <span className="text-gray-400 text-sm font-mono">
                {payment.mollie_payment_id || payment.id.slice(0, 8)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-sm text-gray-400 mt-8">
          Betalingen worden veilig verwerkt door{" "}
          <a
            href="https://www.mollie.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 transition-colors"
          >
            Mollie
          </a>
          . Powered by Blueprint.
        </p>
      </div>
    </div>
  );
}
