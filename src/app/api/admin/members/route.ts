import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import { ROLES, isAdminRole } from "@/lib/constants/roles";

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { profile, supabase } = auth;

  if (!isAdminRole(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (profile.role === ROLES.SUPER_ADMIN) {
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
