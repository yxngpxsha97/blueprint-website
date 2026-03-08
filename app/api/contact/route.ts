import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = "https://nfhesgwmbgmztjxuvrvy.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5maGVzZ3dtYmdtenRqeHV2cnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MzM1ODIsImV4cCI6MjA4ODMwOTU4Mn0.6Ma_cPPXq93gmjVSeHBsFw2KdgbkOAGRkj55X2Ry66g";
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5maGVzZ3dtYmdtenRqeHV2cnZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjczMzU4MiwiZXhwIjoyMDg4MzA5NTgyfQ.TCpuvLGc0y2-3KOYunzoWfvVP3tiMd-JJtklC-tH8YY";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return NextResponse.json(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bedrijfsnaam, naam, telefoon, email, sector } = body;

    // Validate required fields
    const errors: string[] = [];
    if (!bedrijfsnaam || typeof bedrijfsnaam !== "string" || bedrijfsnaam.trim().length === 0) {
      errors.push("Bedrijfsnaam is verplicht.");
    }
    if (!naam || typeof naam !== "string" || naam.trim().length === 0) {
      errors.push("Naam is verplicht.");
    }
    if (!telefoon || typeof telefoon !== "string" || telefoon.trim().length === 0) {
      errors.push("Telefoonnummer is verplicht.");
    }
    if (!email || typeof email !== "string" || email.trim().length === 0) {
      errors.push("Email is verplicht.");
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.push("Ongeldig email formaat.");
      }
    }
    if (!sector || typeof sector !== "string" || sector.trim().length === 0) {
      errors.push("Selecteer een sector.");
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, errors },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Insert lead into Supabase leads table
    const leadData = {
      company_name: bedrijfsnaam.trim(),
      contact_name: naam.trim(),
      phone: telefoon.trim(),
      email: email.trim().toLowerCase(),
      industry: sector.trim(),
      source: "website",
      status: "new",
      score: 50,
      country: "NL",
    };

    const response = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(leadData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Supabase insert failed:", response.status, errorText);
      return NextResponse.json(
        {
          success: false,
          errors: ["Er is een fout opgetreden. Probeer het later opnieuw."],
        },
        { status: 500, headers: corsHeaders() }
      );
    }

    const inserted = await response.json();

    return NextResponse.json(
      {
        success: true,
        message: "Bedankt! Wij nemen binnen 24 uur contact met u op.",
        leadId: inserted[0]?.id || null,
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
