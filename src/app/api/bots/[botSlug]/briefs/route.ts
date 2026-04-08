import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ botSlug: string }> }
) {
  const { botSlug } = await params;
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { profile, supabase } = auth;

  const { data: briefs, error } = await supabase
    .from("bot_briefs")
    .select("id, bot_id, org_id, title, thumbnail_url, content, enabled, created_by, created_at, updated_at")
    .eq("bot_id", botSlug)
    .eq("org_id", profile.org_id)
    .eq("enabled", true)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ briefs: briefs || [] });
}
