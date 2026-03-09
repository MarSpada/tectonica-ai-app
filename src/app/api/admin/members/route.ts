import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, org_id, group_id")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "super_admin" && profile.role !== "group_admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (profile.role === "super_admin") {
    // Get all org members via RPC
    const { data, error } = await supabase.rpc("get_org_members");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ members: data || [] });
  }

  // group_admin: get own group members
  const { data, error } = await supabase.rpc("get_group_members");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Add group_id and group_name for consistency
  const members = (data || []).map((m: Record<string, unknown>) => ({
    ...m,
    group_id: profile.group_id,
    group_name: null,
  }));

  return NextResponse.json({ members });
}
