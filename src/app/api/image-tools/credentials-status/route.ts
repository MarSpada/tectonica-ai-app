import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import { isSuperAdmin } from "@/lib/constants/roles";

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { profile, supabase } = auth;

  if (!profile.org_id) {
    return NextResponse.json({ configured: false });
  }

  const { data } = await supabase
    .from("org_integrations")
    .select(
      "image_api_endpoint, image_api_bearer_token, image_api_credits_allocated, image_api_credits_used"
    )
    .eq("org_id", profile.org_id)
    .single();

  const configured = !!(data?.image_api_endpoint && data?.image_api_bearer_token);

  // Super admins see credit details; other roles only see configured status
  if (isSuperAdmin(profile.role)) {
    return NextResponse.json({
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

  return NextResponse.json({ configured });
}
