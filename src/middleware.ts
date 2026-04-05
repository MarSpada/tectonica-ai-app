import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js middleware for Supabase auth session management.
 *
 * Responsibilities:
 * 1. Refresh the Supabase auth session on every navigation (required for SSR)
 * 2. Redirect unauthenticated users away from protected routes → /login
 * 3. Redirect authenticated users away from /login and /forgot-password → /
 * 4. PKCE code safety net — catches auth codes that land on wrong routes
 */
export async function middleware(request: NextRequest) {
  // ── PKCE safety net ──────────────────────────────────────────────
  // If a PKCE code lands on a non-auth page (e.g. Supabase fell back
  // to the Site URL), route it to the correct callback.
  const code = request.nextUrl.searchParams.get("code");
  if (
    code &&
    !request.nextUrl.pathname.startsWith("/auth/") &&
    !request.nextUrl.pathname.startsWith("/reset-password")
  ) {
    const hasResetIntent = request.cookies.get("password_reset_intent");
    const callbackPath = hasResetIntent
      ? "/auth/reset-callback"
      : "/auth/callback";

    const callbackUrl = new URL(callbackPath, request.url);
    callbackUrl.searchParams.set("code", code);

    const response = NextResponse.redirect(callbackUrl);
    if (hasResetIntent) {
      response.cookies.delete("password_reset_intent");
    }
    return response;
  }

  // ── Session refresh ──────────────────────────────────────────────
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Route protection ─────────────────────────────────────────────
  const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password", "/auth"];
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Unauthenticated users → /login (unless on a public route)
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Authenticated users → / (away from login/forgot-password, but NOT reset-password)
  const LOGIN_ROUTES = ["/login", "/forgot-password"];
  const isLoginRoute = LOGIN_ROUTES.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (user && isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Match all routes except static files, images, and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|ttf|woff2?)$).*)",
  ],
};
