import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client using the service role key.
 * Bypasses RLS entirely — use ONLY in server-side contexts where
 * there is no user session (e.g., external API endpoints like ChangeAgent).
 *
 * NEVER import this in client components, server components, or standard API routes.
 * Standard API routes should use lib/supabase/server.ts which respects RLS.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY env var (server-only, never prefixed with NEXT_PUBLIC_).
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable",
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
