import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import { isSuperAdmin } from "@/lib/constants/roles";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  const { botId } = await params;
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { profile, supabase } = auth;

  if (!isSuperAdmin(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Resolve bot UUID to slug
  const { data: bot } = await supabase
    .from("bots")
    .select("slug")
    .eq("id", botId)
    .or(`org_id.eq.${profile.org_id},org_id.is.null`)
    .single();

  if (!bot) {
    return NextResponse.json({ error: "Bot not found" }, { status: 404 });
  }

  const { data: briefs, error } = await supabase
    .from("bot_briefs")
    .select("id, bot_id, org_id, title, thumbnail_url, content, enabled, created_by, created_at, updated_at")
    .eq("bot_id", bot.slug)
    .eq("org_id", profile.org_id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ briefs: briefs || [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  const { botId } = await params;
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { profile, supabase } = auth;

  if (!isSuperAdmin(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Resolve bot UUID to slug
  const { data: bot } = await supabase
    .from("bots")
    .select("slug")
    .eq("id", botId)
    .or(`org_id.eq.${profile.org_id},org_id.is.null`)
    .single();

  if (!bot) {
    return NextResponse.json({ error: "Bot not found" }, { status: 404 });
  }

  const body = await request.json();
  const { title, thumbnail_url, content, enabled } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  if (typeof content !== "string") {
    return NextResponse.json({ error: "Content must be a string" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("bot_briefs")
    .insert({
      bot_id: bot.slug,
      org_id: profile.org_id,
      title: title.trim(),
      thumbnail_url: thumbnail_url?.trim() || null,
      content: content.trim(),
      enabled: enabled !== false,
      created_by: auth.user.id,
    })
    .select("id, bot_id, org_id, title, thumbnail_url, content, enabled, created_by, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ brief: data });
}
