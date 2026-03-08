// ============================================================================
// Blueprint Admin Dashboard — Auth Helpers
// Cookie-based session management (MVP — no Supabase Auth integration yet)
// ============================================================================

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Session } from './types';

const SESSION_COOKIE_NAME = 'bp_session';

/**
 * Read the session from the httpOnly cookie.
 * Returns null if no valid session found.
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const session = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
    ) as Session;

    // Validate required fields
    if (!session.org_id || !session.user_id || !session.role) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Require authentication. Redirects to /login if no valid session.
 * Use in Server Components / route handlers.
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return session;
}

/**
 * Encode a session object into a base64 cookie value.
 */
export function encodeSession(session: Session): string {
  return Buffer.from(JSON.stringify(session)).toString('base64');
}

/**
 * Set the session cookie (call from API route).
 */
export async function setSessionCookie(session: Session): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, encodeSession(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Clear the session cookie (logout).
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
