import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import { isAdminRole, VALID_ROLES } from "@/lib/constants/roles";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await params;
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { profile, supabase } = auth;

  // Only super_admin or group_admin can change roles
  if (!isAdminRole(profile.role)) {
    return NextResponse.json({ error: "Only admins can change roles" }, { status: 403 });
  }

  const { role } = await request.json();

  if (!role || !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` }, { status: 400 });
  }

  const { error } = await supabase.rpc("update_member_role", {
    p_member_id: memberId,
    p_new_role: role,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
