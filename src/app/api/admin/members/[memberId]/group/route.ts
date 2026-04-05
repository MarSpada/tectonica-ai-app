import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { isSuperAdmin } from "@/lib/constants/roles";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only super_admin can reassign members to different groups
  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!isSuperAdmin(callerProfile?.role)) {
    return NextResponse.json({ error: "Only super admins can reassign groups" }, { status: 403 });
  }

  const { groupId } = await request.json();
  if (!groupId) return NextResponse.json({ error: "Group ID is required" }, { status: 400 });

  const { error } = await supabase.rpc("reassign_member_group", {
    p_member_id: memberId,
    p_new_group_id: groupId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
