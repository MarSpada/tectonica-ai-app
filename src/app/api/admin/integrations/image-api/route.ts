import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import { isSuperAdmin } from "@/lib/constants/roles";
import { encrypt } from "@/lib/encryption";

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { profile, supabase } = auth;

  if (!isSuperAdmin(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!profile.org_id) {
    return NextResponse.json({ error: "No organization" }, { status: 400 });
  }

  const { data } = await supabase
    .from("org_integrations")
    .select(
      "image_api_endpoint, image_api_bearer_token, image_api_credits_allocated, image_api_credits_used"
    )
    .eq("org_id", profile.org_id)
    .single();

  const configured = !!(data?.image_api_endpoint && data?.image_api_bearer_token);

  return NextResponse.json({
    endpoint: data?.image_api_endpoint ?? null,
    configured,
    creditsAllocated: data?.image_api_credits_allocated ?? 0,
    creditsUsed: data?.image_api_credits_used ?? 0,
    creditsRemaining: Math.max(
      0,
      (data?.image_api_credits_allocated ?? 0) -
        (data?.image_api_credits_used ?? 0)
    ),
  });
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { profile, supabase } = auth;

  if (!isSuperAdmin(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!profile.org_id) {
    return NextResponse.json({ error: "No organization" }, { status: 400 });
  }

  const { endpoint, bearerToken } = await req.json();

  if (!endpoint || typeof endpoint !== "string") {
    return NextResponse.json(
      { error: "Endpoint URL is required" },
      { status: 400 }
    );
  }

  const cleanEndpoint = endpoint.trim().replace(/\/+$/, "");

  // Build update payload
  const update: Record<string, unknown> = {
    org_id: profile.org_id,
    image_api_endpoint: cleanEndpoint,
  };

  // Only encrypt and store token if a new one is provided
  if (bearerToken && typeof bearerToken === "string" && bearerToken.trim()) {
    try {
      update.image_api_bearer_token = encrypt(bearerToken.trim());
    } catch {
      return NextResponse.json(
        { error: "Failed to encrypt bearer token" },
        { status: 500 }
      );
    }
  }

  const { error } = await supabase
    .from("org_integrations")
    .upsert(update, { onConflict: "org_id" });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ configured: true });
}
