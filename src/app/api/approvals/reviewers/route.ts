import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import { isAdminRole } from "@/lib/constants/roles";

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  // Use get_group_members RPC (joins auth.users for email)
  const { data: members, error } = await supabase.rpc("get_group_members");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Filter to admins only, exclude current user
  const reviewers = (members || [])
    .filter(
      (m: { id: string; role: string }) =>
        m.id !== user.id &&
        isAdminRole(m.role)
    )
    .map((m: { id: string; full_name: string; avatar_url: string | null; role: string; email: string }) => ({
      id: m.id,
      full_name: m.full_name,
      avatar_url: m.avatar_url,
      role: m.role,
      email: m.email,
    }));

  return NextResponse.json({ reviewers });
}
