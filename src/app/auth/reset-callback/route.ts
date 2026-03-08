import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Dedicated callback for password reset PKCE flow.
 * Separate from /auth/callback so the redirect URL has no query params —
 * Supabase's redirect URL matching is strict about query params.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  // Use forwarded headers for correct origin behind reverse proxies (Railway)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : url.origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Session established — redirect to the password reset form
      const response = NextResponse.redirect(`${origin}/reset-password`);
      response.cookies.delete("password_reset_intent");
      return response;
    }
  }

  // If no code or exchange failed, redirect to login
  return NextResponse.redirect(`${origin}/login`);
}
