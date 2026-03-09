import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

async function getSuperAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, org_id")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") return null;
  return profile;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  const { botId } = await params;
  const supabase = await createClient();
  const profile = await getSuperAdmin(supabase);
  if (!profile) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: bot } = await supabase
    .from("bots")
    .select("id, slug, name, icon, category, description, system_prompt")
    .eq("id", botId)
    .single();

  if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 });
  return NextResponse.json({ bot });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  const { botId } = await params;
  const supabase = await createClient();
  const profile = await getSuperAdmin(supabase);
  if (!profile) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { name, icon, category, description, system_prompt } = body;

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name.trim();
  if (icon !== undefined) updates.icon = icon.trim();
  if (category !== undefined) updates.category = category;
  if (description !== undefined) updates.description = description.trim();
  if (system_prompt !== undefined) updates.system_prompt = system_prompt || null;

  const { error } = await supabase
    .from("bots")
    .update(updates)
    .eq("id", botId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  const { botId } = await params;
  const supabase = await createClient();
  const profile = await getSuperAdmin(supabase);
  if (!profile) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await supabase
    .from("bots")
    .delete()
    .eq("id", botId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
