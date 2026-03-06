import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

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
      // Password recovery: keep session alive so user can update password
      if (next === "/reset-password") {
        return NextResponse.redirect(`${origin}/reset-password`);
      }

      // Email confirmation: sign out so user logs in explicitly
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login?confirmed=true`);
    }
  }

  // If no code or exchange failed, redirect to login with error
  return NextResponse.redirect(`${origin}/login`);
}
