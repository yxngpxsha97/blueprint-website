// ============================================================================
// POST /api/auth/login — MVP Login endpoint
// Validates against Supabase users table, sets session cookie
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseFetch } from '@/lib/supabase';
import { encodeSession } from '@/lib/auth';
import type { User, Organization } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email en wachtwoord zijn verplicht.' },
        { status: 400 }
      );
    }

    // MVP: Check against environment variables first (quick admin access)
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (adminEmail && adminPassword && email === adminEmail && password === adminPassword) {
      // Fetch the admin user from Supabase to get org details
      const { data: users } = await supabaseFetch<User[]>('users', {
        query: `email=eq.${encodeURIComponent(email)}&active=eq.true&limit=1`,
        useServiceRole: true,
      });

      if (users && users.length > 0) {
        const user = users[0];
        const { data: org } = await supabaseFetch<Organization[]>('organizations', {
          query: `id=eq.${user.org_id}&limit=1`,
          useServiceRole: true,
        });

        const session = {
          org_id: user.org_id,
          user_id: user.id,
          role: user.role,
          org_name: org?.[0]?.name ?? 'Blueprint',
          user_name: user.name,
          user_email: user.email,
        };

        const response = NextResponse.json({ success: true });
        response.cookies.set('bp_session', encodeSession(session), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
        });

        return response;
      }

      // Admin env match but no user in DB — create a session with defaults
      const session = {
        org_id: '00000000-0000-0000-0000-000000000000',
        user_id: '00000000-0000-0000-0000-000000000000',
        role: 'owner' as const,
        org_name: 'Blueprint',
        user_name: 'Admin',
        user_email: email,
      };

      const response = NextResponse.json({ success: true });
      response.cookies.set('bp_session', encodeSession(session), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    // Fallback: look up user in Supabase by email
    const { data: users } = await supabaseFetch<User[]>('users', {
      query: `email=eq.${encodeURIComponent(email)}&active=eq.true&limit=1`,
      useServiceRole: true,
    });

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'Ongeldige inloggegevens.' },
        { status: 401 }
      );
    }

    const user = users[0];

    // MVP: simple password check (plaintext comparison for now)
    // In production, use bcrypt or Supabase Auth
    if (user.password_hash !== password) {
      return NextResponse.json(
        { error: 'Ongeldige inloggegevens.' },
        { status: 401 }
      );
    }

    // Fetch organization name
    const { data: orgs } = await supabaseFetch<Organization[]>('organizations', {
      query: `id=eq.${user.org_id}&limit=1`,
      useServiceRole: true,
    });

    const session = {
      org_id: user.org_id,
      user_id: user.id,
      role: user.role,
      org_name: orgs?.[0]?.name ?? 'Onbekend',
      user_name: user.name,
      user_email: user.email,
    };

    const response = NextResponse.json({ success: true });
    response.cookies.set('bp_session', encodeSession(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Er is een fout opgetreden. Probeer het opnieuw.' },
      { status: 500 }
    );
  }
}
