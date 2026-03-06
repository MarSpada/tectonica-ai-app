import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

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
