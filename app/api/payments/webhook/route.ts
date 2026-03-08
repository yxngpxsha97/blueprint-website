import { NextRequest, NextResponse } from "next/server";

// ─── Supabase Config ───
const SUPABASE_URL = "https://nfhesgwmbgmztjxuvrvy.supabase.co";
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5maGVzZ3dtYmdtenRqeHV2cnZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjczMzU4MiwiZXhwIjoyMDg4MzA5NTgyfQ.TCpuvLGc0y2-3KOYunzoWfvVP3tiMd-JJtklC-tH8YY";

function supabaseHeaders() {
  return {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

/**
 * Map Mollie payment status to our payment_status enum.
 * Mollie statuses: open, canceled, pending, authorized, expired, failed, paid
 * Our enum: open, pending, paid, failed, cancelled, expired, refunded
 */
function mapMollieStatus(
  mollieStatus: string
): "open" | "pending" | "paid" | "failed" | "cancelled" | "expired" | "refunded" {
  switch (mollieStatus) {
    case "open":
      return "open";
    case "pending":
    case "authorized":
      return "pending";
    case "paid":
      return "paid";
    case "failed":
      return "failed";
    case "canceled":
      return "cancelled";
    case "expired":
      return "expired";
    default:
      return "open";
  }
}

// ─── POST: Mollie webhook callback ───
// Mollie sends a POST with `id=tr_XXXX` (form-urlencoded) when a payment status changes.
// We must:
//   1. Fetch the full payment from Mollie to get the current status
//   2. Update our payments table in Supabase
//   3. If paid, update the linked quote to 'accepted'
//   4. Return 200 OK (Mollie retries on non-200)

export async function POST(request: NextRequest) {
  try {
    // Mollie sends the payload as application/x-www-form-urlencoded
    const formData = await request.formData();
    const molliePaymentId = formData.get("id") as string;

    if (!molliePaymentId) {
      console.error("Webhook received without payment ID");
      // Return 200 anyway to prevent Mollie from retrying
      return new NextResponse("OK", { status: 200 });
    }

    console.log(`[Mollie Webhook] Processing payment: ${molliePaymentId}`);

    // ── Look up our payment record to get the org_id for the API key ──
    const paymentLookupRes = await fetch(
      `${SUPABASE_URL}/rest/v1/payments?mollie_payment_id=eq.${molliePaymentId}&select=id,org_id,quote_id,status`,
      { headers: supabaseHeaders() }
    );

    if (!paymentLookupRes.ok) {
      console.error("Failed to look up payment:", await paymentLookupRes.text());
      return new NextResponse("OK", { status: 200 });
    }

    const payments = await paymentLookupRes.json();
    if (!payments || payments.length === 0) {
      console.error(`Payment not found in database: ${molliePaymentId}`);
      return new NextResponse("OK", { status: 200 });
    }

    const localPayment = payments[0];

    // ── Resolve Mollie API key ──
    const mollieApiKey = process.env.MOLLIE_API_KEY || "";

    if (!mollieApiKey) {
      console.error("No Mollie API key configured");
      return new NextResponse("OK", { status: 200 });
    }

    // ── Fetch full payment details from Mollie ──
    const mollieRes = await fetch(
      `https://api.mollie.com/v2/payments/${molliePaymentId}`,
      {
        headers: {
          Authorization: `Bearer ${mollieApiKey}`,
        },
      }
    );

    if (!mollieRes.ok) {
      const mollieError = await mollieRes.text();
      console.error("Failed to fetch Mollie payment:", mollieRes.status, mollieError);
      return new NextResponse("OK", { status: 200 });
    }

    const molliePayment = await mollieRes.json();
    const newStatus = mapMollieStatus(molliePayment.status);

    console.log(
      `[Mollie Webhook] Payment ${molliePaymentId}: ${molliePayment.status} -> ${newStatus}`
    );

    // ── Update payment record in Supabase ──
    const updateData: Record<string, unknown> = {
      status: newStatus,
      method: molliePayment.method || null,
      updated_at: new Date().toISOString(),
    };

    // If paid, record the timestamp
    if (newStatus === "paid") {
      updateData.paid_at = molliePayment.paidAt || new Date().toISOString();
    }

    const updateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/payments?mollie_payment_id=eq.${molliePaymentId}`,
      {
        method: "PATCH",
        headers: supabaseHeaders(),
        body: JSON.stringify(updateData),
      }
    );

    if (!updateRes.ok) {
      console.error("Failed to update payment:", await updateRes.text());
    }

    // ── If paid and linked to a quote, update quote status to 'accepted' ──
    if (newStatus === "paid" && localPayment.quote_id) {
      const quoteUpdateRes = await fetch(
        `${SUPABASE_URL}/rest/v1/quotes?id=eq.${localPayment.quote_id}`,
        {
          method: "PATCH",
          headers: supabaseHeaders(),
          body: JSON.stringify({
            status: "accepted",
            accepted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }),
        }
      );

      if (!quoteUpdateRes.ok) {
        console.error("Failed to update quote status:", await quoteUpdateRes.text());
      } else {
        console.log(`[Mollie Webhook] Quote ${localPayment.quote_id} marked as accepted`);
      }
    }

    // Mollie expects a 200 response
    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    // Always return 200 to prevent Mollie from endlessly retrying
    return new NextResponse("OK", { status: 200 });
  }
}
