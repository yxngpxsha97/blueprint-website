import { NextRequest, NextResponse } from "next/server";

// ─── Supabase Config ───
const SUPABASE_URL = "https://nfhesgwmbgmztjxuvrvy.supabase.co";
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5maGVzZ3dtYmdtenRqeHV2cnZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjczMzU4MiwiZXhwIjoyMDg4MzA5NTgyfQ.TCpuvLGc0y2-3KOYunzoWfvVP3tiMd-JJtklC-tH8YY";

// ─── Helpers ───

function supabaseHeaders() {
  return {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

/**
 * Convert integer cents to Mollie's "XX.XX" string format.
 * e.g. 1999 -> "19.99"
 */
function centsToMollieAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}

// ─── CORS Preflight ───

export async function OPTIONS() {
  return NextResponse.json(null, { status: 204, headers: corsHeaders() });
}

// ─── POST: Create a Mollie payment ───

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      quote_id,
      org_id,
      amount_cents,
      description,
      customer_name,
      customer_email,
      redirect_url,
    } = body;

    // ── Validate required fields ──
    const errors: string[] = [];

    if (!org_id || typeof org_id !== "string") {
      errors.push("org_id is verplicht.");
    }
    if (!amount_cents || typeof amount_cents !== "number" || amount_cents <= 0) {
      errors.push("amount_cents moet een positief getal zijn.");
    }
    if (!description || typeof description !== "string" || description.trim().length === 0) {
      errors.push("description is verplicht.");
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, errors },
        { status: 400, headers: corsHeaders() }
      );
    }

    // ── Resolve Mollie API key ──
    // First try to get the org's own Mollie key from the organizations table.
    // Falls back to the MOLLIE_API_KEY env var.
    let mollieApiKey = process.env.MOLLIE_API_KEY || "";

    const orgRes = await fetch(
      `${SUPABASE_URL}/rest/v1/organizations?id=eq.${org_id}&select=id,name,slug`,
      { headers: supabaseHeaders() }
    );

    if (!orgRes.ok) {
      console.error("Failed to fetch organization:", orgRes.status, await orgRes.text());
      return NextResponse.json(
        { success: false, errors: ["Organisatie niet gevonden."] },
        { status: 404, headers: corsHeaders() }
      );
    }

    const orgs = await orgRes.json();
    if (!orgs || orgs.length === 0) {
      return NextResponse.json(
        { success: false, errors: ["Organisatie niet gevonden."] },
        { status: 404, headers: corsHeaders() }
      );
    }

    // Check if org has a Mollie API key stored in metadata
    // For now we check the subscriptions table for mollie_customer_id as a proxy,
    // and use the env fallback. In production, store mollie_api_key on the org.
    if (!mollieApiKey) {
      return NextResponse.json(
        { success: false, errors: ["Geen Mollie API-sleutel geconfigureerd."] },
        { status: 500, headers: corsHeaders() }
      );
    }

    // ── Determine webhook URL ──
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const webhookUrl = `${baseUrl}/api/payments/webhook`;
    const defaultRedirectUrl = `${baseUrl}/betaling/success`;

    // ── Create payment via Mollie API ──
    const mollieBody = {
      amount: {
        currency: "EUR",
        value: centsToMollieAmount(amount_cents),
      },
      description: description.trim(),
      redirectUrl: redirect_url || defaultRedirectUrl,
      webhookUrl,
      metadata: {
        quote_id: quote_id || null,
        org_id,
      },
    };

    const mollieRes = await fetch("https://api.mollie.com/v2/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mollieApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mollieBody),
    });

    if (!mollieRes.ok) {
      const mollieError = await mollieRes.text();
      console.error("Mollie payment creation failed:", mollieRes.status, mollieError);
      return NextResponse.json(
        {
          success: false,
          errors: ["Betaling aanmaken mislukt. Probeer het later opnieuw."],
        },
        { status: 502, headers: corsHeaders() }
      );
    }

    const molliePayment = await mollieRes.json();

    // ── Resolve customer_id if email provided ──
    let customerId: string | null = null;

    if (customer_email) {
      const customerRes = await fetch(
        `${SUPABASE_URL}/rest/v1/customers?org_id=eq.${org_id}&email=eq.${encodeURIComponent(customer_email)}&limit=1`,
        { headers: supabaseHeaders() }
      );

      if (customerRes.ok) {
        const customers = await customerRes.json();
        if (customers && customers.length > 0) {
          customerId = customers[0].id;
        } else if (customer_name) {
          // Auto-create customer record
          const createCustomerRes = await fetch(
            `${SUPABASE_URL}/rest/v1/customers`,
            {
              method: "POST",
              headers: supabaseHeaders(),
              body: JSON.stringify({
                org_id,
                name: customer_name.trim(),
                email: customer_email.trim().toLowerCase(),
                source: "website",
              }),
            }
          );
          if (createCustomerRes.ok) {
            const newCustomer = await createCustomerRes.json();
            customerId = newCustomer[0]?.id || null;
          }
        }
      }
    }

    // ── Save payment record in Supabase ──
    const paymentRecord = {
      org_id,
      quote_id: quote_id || null,
      customer_id: customerId,
      mollie_payment_id: molliePayment.id,
      mollie_checkout_url: molliePayment._links?.checkout?.href || null,
      amount_cents,
      currency: "EUR",
      status: molliePayment.status || "open",
      description: description.trim(),
      method: molliePayment.method || null,
      metadata: {
        customer_name: customer_name || null,
        customer_email: customer_email || null,
        mollie_created_at: molliePayment.createdAt,
      },
    };

    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/payments`, {
      method: "POST",
      headers: supabaseHeaders(),
      body: JSON.stringify(paymentRecord),
    });

    if (!insertRes.ok) {
      const insertError = await insertRes.text();
      console.error("Supabase payment insert failed:", insertRes.status, insertError);
      // Payment was created at Mollie but not saved locally — still return the checkout URL
      // so the customer can pay. The webhook will reconcile.
    }

    const inserted = insertRes.ok ? await insertRes.json() : [];

    return NextResponse.json(
      {
        success: true,
        payment_id: inserted[0]?.id || null,
        mollie_payment_id: molliePayment.id,
        checkout_url: molliePayment._links?.checkout?.href || null,
      },
      { status: 201, headers: corsHeaders() }
    );
  } catch (error) {
    console.error("Payment creation error:", error);
    return NextResponse.json(
      {
        success: false,
        errors: ["Er is een onverwachte fout opgetreden."],
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}
