import { NextRequest, NextResponse } from "next/server";

/* ─── Config ─── */

const SUPABASE_URL = "https://nfhesgwmbgmztjxuvrvy.supabase.co";
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5maGVzZ3dtYmdtenRqeHV2cnZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjczMzU4MiwiZXhwIjoyMDg4MzA5NTgyfQ.TCpuvLGc0y2-3KOYunzoWfvVP3tiMd-JJtklC-tH8YY";

const N8N_ONBOARDING_WEBHOOK =
  "https://yxngpxsha.app.n8n.cloud/webhook/blueprint-client-onboarding";

/* ─── Helpers ─── */

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

async function logToAuditLog(payload: Record<string, unknown>) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/audit_log`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Silently fail — audit log should not block signup
  }
}

/* ─── CORS preflight ─── */

export async function OPTIONS() {
  return NextResponse.json(null, { status: 204, headers: corsHeaders() });
}

/* ─── POST handler ─── */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      kvk_nummer,
      bedrijfsnaam,
      sector,
      btw_nummer,
      naam,
      email,
      telefoon,
      straat,
      postcode,
      stad,
      plan,
    } = body;

    /* ── Validate required fields ── */
    const errors: string[] = [];

    if (!kvk_nummer || typeof kvk_nummer !== "string" || kvk_nummer.trim().length === 0) {
      errors.push("KvK-nummer is verplicht.");
    }
    if (!bedrijfsnaam || typeof bedrijfsnaam !== "string" || bedrijfsnaam.trim().length === 0) {
      errors.push("Bedrijfsnaam is verplicht.");
    }
    if (!sector || typeof sector !== "string" || sector.trim().length === 0) {
      errors.push("Sector is verplicht.");
    }
    if (!naam || typeof naam !== "string" || naam.trim().length === 0) {
      errors.push("Naam is verplicht.");
    }
    if (!email || typeof email !== "string" || email.trim().length === 0) {
      errors.push("Email is verplicht.");
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.push("Ongeldig email formaat.");
      }
    }
    if (!telefoon || typeof telefoon !== "string" || telefoon.trim().length === 0) {
      errors.push("Telefoonnummer is verplicht.");
    }
    if (!stad || typeof stad !== "string" || stad.trim().length === 0) {
      errors.push("Stad is verplicht.");
    }
    if (!plan || !["starter", "professional", "enterprise"].includes(plan)) {
      errors.push("Selecteer een geldig abonnement.");
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, errors },
        { status: 400, headers: corsHeaders() }
      );
    }

    /* ── Build payload for n8n onboarding webhook ── */
    const addressParts = [straat, postcode, stad].filter((p) => p && p.trim());
    const payload = {
      company_name: bedrijfsnaam.trim(),
      kvk_number: kvk_nummer.trim(),
      btw_number: btw_nummer?.trim() || null,
      sector: sector.trim(),
      contact_name: naam.trim(),
      email: email.trim().toLowerCase(),
      phone: telefoon.trim(),
      address: addressParts.join(", "),
      city: stad.trim(),
      postcode: postcode?.trim() || null,
      plan: plan,
      source: "website_signup",
    };

    /* ── Forward to n8n onboarding webhook ── */
    let orgId: string | null = null;

    try {
      const n8nRes = await fetch(N8N_ONBOARDING_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      });

      if (n8nRes.ok) {
        const n8nData = await n8nRes.json();
        orgId = n8nData?.org_id || n8nData?.id || null;
      } else {
        // n8n returned an error — fall through to Supabase fallback
        console.error("n8n webhook error:", n8nRes.status, await n8nRes.text());
      }
    } catch (n8nError) {
      console.error("n8n webhook unreachable:", n8nError);
    }

    /* ── Fallback: log to Supabase audit_log if n8n failed ── */
    if (!orgId) {
      // Generate a temporary org_id so we can still return success
      const fallbackId = crypto.randomUUID();
      orgId = fallbackId;

      await logToAuditLog({
        org_id: "00000000-0000-0000-0000-000000000000",
        action: "signup.pending",
        entity_type: "organization",
        metadata: {
          ...payload,
          fallback_reason: "n8n_webhook_unavailable",
          temp_id: fallbackId,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Aanmelding succesvol ontvangen.",
        org_id: orgId,
      },
      { status: 201, headers: corsHeaders() }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        errors: ["Er is een fout opgetreden. Probeer het later opnieuw."],
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}
