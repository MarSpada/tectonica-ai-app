// RunPod integration config — GET (read) and POST (save + test connection).
// Super admin only. Bearer token is never returned to client.

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
    .select("runpod_endpoint_url, runpod_status, runpod_last_checked_at")
    .eq("org_id", profile.org_id)
    .single();

  if (!data) {
    return NextResponse.json({
      endpointUrl: null,
      status: "not_configured",
      lastCheckedAt: null,
    });
  }

  return NextResponse.json({
    endpointUrl: data.runpod_endpoint_url,
    status: data.runpod_status,
    lastCheckedAt: data.runpod_last_checked_at,
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
  const { endpointUrl, bearerToken } = body as {
    endpointUrl?: string;
    bearerToken?: string;
  };

  if (!endpointUrl?.trim()) {
    return NextResponse.json(
      { error: "Endpoint URL is required" },
      { status: 400 }
    );
  }

  // Normalize: strip trailing slashes and /v1 suffix (we append /v1/... ourselves)
  const cleanUrl = endpointUrl.trim().replace(/\/+$/, "").replace(/\/v1$/, "");

  // Determine the token to use for the connection test
  let tokenForTest: string | null = null;
  let encryptedToken: string | undefined;

  if (bearerToken?.trim()) {
    // New token provided — encrypt and use it
    tokenForTest = bearerToken.trim();
    encryptedToken = encrypt(tokenForTest);
  } else {
    // No new token — try to use the existing one
    const { data: existing } = await supabase
      .from("org_integrations")
      .select("runpod_bearer_token")
      .eq("org_id", profile.org_id)
      .single();

    if (existing?.runpod_bearer_token) {
      try {
        tokenForTest = decrypt(existing.runpod_bearer_token);
      } catch {
        return NextResponse.json(
          { error: "Stored token is corrupted. Please re-enter your bearer token." },
          { status: 400 }
        );
      }
    }
  }

  // Test connection
  let status: "connected" | "error" = "error";
  let models: Array<{ id: string; name: string }> = [];

  if (tokenForTest) {
    try {
      const res = await fetch(`${cleanUrl}/v1/models`, {
        headers: { Authorization: `Bearer ${tokenForTest}` },
        signal: AbortSignal.timeout(15000),
      });

      if (res.ok) {
        const json = await res.json();
        const modelData = json.data || json.models || [];
        models = modelData.map((m: { id: string; name?: string }) => ({
          id: m.id,
          name: m.name || m.id,
        }));
        status = "connected";
      } else if (res.status === 401) {
        return NextResponse.json(
          { error: "Authentication failed — check your bearer token" },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { error: `RunPod returned ${res.status}: ${res.statusText}` },
          { status: 400 }
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Connection failed";
      return NextResponse.json(
        { error: `Could not reach RunPod endpoint: ${msg}` },
        { status: 400 }
      );
    }
  }

  // Upsert org_integrations row
  const upsertData: Record<string, unknown> = {
    org_id: profile.org_id,
    runpod_endpoint_url: cleanUrl,
    runpod_status: tokenForTest ? status : "not_configured",
    runpod_last_checked_at: tokenForTest ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  };

  if (encryptedToken !== undefined) {
    upsertData.runpod_bearer_token = encryptedToken;
  }

  const { error: dbError } = await supabase
    .from("org_integrations")
    .upsert(upsertData, { onConflict: "org_id" });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ status, models });
}
