import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import { isSuperAdmin } from "@/lib/constants/roles";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await params;
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { profile, supabase } = auth;

  // Only super_admin can reassign members to different groups
  if (!isSuperAdmin(profile.role)) {
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
