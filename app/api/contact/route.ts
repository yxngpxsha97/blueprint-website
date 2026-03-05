import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const LEADS_FILE = path.join(process.cwd(), "data", "leads.json");

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
      // Basic email format check
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

    // Build lead record
    const lead = {
      id: crypto.randomUUID(),
      bedrijfsnaam: bedrijfsnaam.trim(),
      naam: naam.trim(),
      telefoon: telefoon.trim(),
      email: email.trim().toLowerCase(),
      sector: sector.trim(),
      createdAt: new Date().toISOString(),
    };

    // Read existing leads
    let leads: unknown[] = [];
    try {
      const fileContent = await fs.readFile(LEADS_FILE, "utf-8");
      leads = JSON.parse(fileContent);
      if (!Array.isArray(leads)) {
        leads = [];
      }
    } catch {
      // File doesn't exist or is invalid — start fresh
      leads = [];
    }

    // Append and write back
    leads.push(lead);
    await fs.writeFile(LEADS_FILE, JSON.stringify(leads, null, 2), "utf-8");

    return NextResponse.json(
      {
        success: true,
        message: "Bedankt! Wij nemen binnen 24 uur contact met u op.",
        leadId: lead.id,
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
