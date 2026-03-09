import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, org_id")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify target is in the same org
  const { data: target } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", memberId)
    .single();

  if (!target || target.org_id !== profile.org_id) {
    return NextResponse.json({ error: "Member not found in your org" }, { status: 404 });
  }

  // Cannot remove yourself
  if (memberId === user.id) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
  }

  // Remove: set org_id and group_id to null (soft removal)
  const { error } = await supabase
    .from("profiles")
    .update({ org_id: null, group_id: null, role: "supporter" })
    .eq("id", memberId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
