import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function getAdminProfile(supabase: Awaited<ReturnType<typeof createClient>>) {
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
  const profile = await getAdminProfile(supabase);
  if (!profile) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("id", profile.org_id)
    .single();

  return NextResponse.json({ org });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const profile = await getAdminProfile(supabase);
  if (!profile) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("organizations")
    .update({ name: name.trim() })
    .eq("id", profile.org_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
