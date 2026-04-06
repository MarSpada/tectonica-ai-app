// Fetch available models from the org's RunPod endpoint.
// Super admin only. Uses stored encrypted credentials.

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import { isSuperAdmin } from "@/lib/constants/roles";
import { decrypt } from "@/lib/encryption";

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { profile, supabase } = auth;

  if (!isSuperAdmin(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data } = await supabase
    .from("org_integrations")
    .select("runpod_endpoint_url, runpod_bearer_token, runpod_status")
    .eq("org_id", profile.org_id)
    .single();

  if (!data?.runpod_endpoint_url || !data.runpod_bearer_token) {
    return NextResponse.json(
      { error: "not_configured", models: [] },
      { status: 200 }
    );
  }

  let token: string;
  try {
    token = decrypt(data.runpod_bearer_token);
  } catch {
    return NextResponse.json(
      { error: "Stored token is corrupted. Please re-enter your bearer token in Integrations." },
      { status: 500 }
    );
  }

  try {
    const url = data.runpod_endpoint_url.replace(/\/+$/, "").replace(/\/v1$/, "");
    const res = await fetch(`${url}/v1/models`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `RunPod returned ${res.status}`, models: [] },
        { status: 200 }
      );
    }

    const json = await res.json();
    const modelData = json.data || json.models || [];
    const models = modelData.map((m: { id: string; name?: string }) => ({
      id: m.id,
      name: m.name || m.id,
    }));

    return NextResponse.json({ models });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Connection failed";
    return NextResponse.json(
      { error: `Could not reach RunPod: ${msg}`, models: [] },
      { status: 200 }
    );
  }
}
