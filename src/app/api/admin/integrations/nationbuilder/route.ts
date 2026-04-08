// NationBuilder integration config — GET (read) and POST (save + test / toggle).
// Super admin only. API token is never returned to client.
// Encryption: uses encrypt/decrypt from lib/encryption.ts (same as RunPod token).

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import { isSuperAdmin } from "@/lib/constants/roles";
import { encrypt, decrypt } from "@/lib/encryption";

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { profile, supabase } = auth;

  if (!isSuperAdmin(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data } = await supabase
    .from("org_integrations")
    .select("nb_enabled, nb_slug, nb_api_token, nb_status, nb_last_checked_at")
    .eq("org_id", profile.org_id)
    .single();

  if (!data) {
    return NextResponse.json({
      enabled: false,
      slug: null,
      hasToken: false,
      status: "not_configured",
      lastCheckedAt: null,
    });
  }

  return NextResponse.json({
    enabled: data.nb_enabled,
    slug: data.nb_slug,
    hasToken: !!data.nb_api_token,
    status: data.nb_status,
    lastCheckedAt: data.nb_last_checked_at,
  });
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, profile, supabase } = auth;

  if (!isSuperAdmin(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { slug, apiToken, enabled } = body as {
    slug?: string;
    apiToken?: string;
    enabled?: boolean;
  };

  // Toggle-only mode: update nb_enabled without re-testing connection
  if (enabled !== undefined && slug === undefined && apiToken === undefined) {
    const { error: dbError } = await supabase
      .from("org_integrations")
      .upsert(
        {
          org_id: profile.org_id,
          nb_enabled: enabled,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        },
        { onConflict: "org_id" }
      );

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ enabled });
  }

  // Settings save mode: validate, encrypt, test connection, upsert
  if (!slug?.trim()) {
    return NextResponse.json(
      { error: "NationBuilder slug is required" },
      { status: 400 }
    );
  }

  const cleanSlug = slug.trim().toLowerCase();

  // Determine the token to use for the connection test
  let tokenForTest: string | null = null;
  let encryptedToken: string | undefined;

  if (apiToken?.trim()) {
    // New token provided — encrypt and use it
    tokenForTest = apiToken.trim();
    encryptedToken = encrypt(tokenForTest);
  } else {
    // No new token — try to use the existing one
    const { data: existing } = await supabase
      .from("org_integrations")
      .select("nb_api_token")
      .eq("org_id", profile.org_id)
      .single();

    if (existing?.nb_api_token) {
      try {
        tokenForTest = decrypt(existing.nb_api_token);
      } catch {
        return NextResponse.json(
          { error: "Stored token is corrupted. Please re-enter your API token." },
          { status: 400 }
        );
      }
    }
  }

  // Test connection
  let status: "connected" | "error" = "error";

  if (tokenForTest) {
    try {
      const res = await fetch(
        `https://${cleanSlug}.nationbuilder.com/api/v2/signups?page[size]=1`,
        {
          headers: {
            Authorization: `Bearer ${tokenForTest}`,
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(15000),
        }
      );

      if (res.ok) {
        status = "connected";
      } else if (res.status === 401) {
        return NextResponse.json(
          { error: "Authentication failed — check your API token" },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { error: `NationBuilder returned ${res.status}: ${res.statusText}` },
          { status: 400 }
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Connection failed";
      return NextResponse.json(
        { error: `Could not reach NationBuilder: ${msg}` },
        { status: 400 }
      );
    }
  }

  // Upsert org_integrations row
  const upsertData: Record<string, unknown> = {
    org_id: profile.org_id,
    nb_slug: cleanSlug,
    nb_status: tokenForTest ? status : "not_configured",
    nb_last_checked_at: tokenForTest ? new Date().toISOString() : null,
    nb_enabled: enabled ?? true, // default to enabled when saving credentials
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  };

  if (encryptedToken !== undefined) {
    upsertData.nb_api_token = encryptedToken;
  }

  const { error: dbError } = await supabase
    .from("org_integrations")
    .upsert(upsertData, { onConflict: "org_id" });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ status, enabled: upsertData.nb_enabled });
}
