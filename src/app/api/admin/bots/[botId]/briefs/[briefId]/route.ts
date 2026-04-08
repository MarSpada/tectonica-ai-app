import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import { isSuperAdmin } from "@/lib/constants/roles";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string; briefId: string }> }
) {
  const { briefId } = await params;
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { profile, supabase } = auth;

  if (!isSuperAdmin(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.title !== undefined) updates.title = body.title.trim();
  if (body.thumbnail_url !== undefined) updates.thumbnail_url = body.thumbnail_url?.trim() || null;
  if (body.content !== undefined) updates.content = body.content.trim();
  if (body.enabled !== undefined) updates.enabled = body.enabled;
  updates.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("bot_briefs")
    .update(updates)
    .eq("id", briefId)
    .eq("org_id", profile.org_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ botId: string; briefId: string }> }
) {
  const { briefId } = await params;
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { profile, supabase } = auth;

  if (!isSuperAdmin(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("bot_briefs")
    .delete()
    .eq("id", briefId)
    .eq("org_id", profile.org_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
