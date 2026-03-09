import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

export async function GET() {
  const supabase = await createClient();
  const profile = await getSuperAdmin(supabase);
  if (!profile) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: groups } = await supabase
    .from("groups")
    .select("id, name, created_at")
    .eq("org_id", profile.org_id)
    .order("created_at");

  return NextResponse.json({ groups: groups || [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const profile = await getSuperAdmin(supabase);
  if (!profile) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("groups")
    .insert({ name: name.trim(), org_id: profile.org_id })
    .select("id, name")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ group: data });
}
