import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Use get_group_members RPC (joins auth.users for email)
  const { data: members, error } = await supabase.rpc("get_group_members");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Filter to admins only, exclude current user
  const reviewers = (members || [])
    .filter(
      (m: { id: string; role: string }) =>
        m.id !== user.id &&
        (m.role === "super_admin" || m.role === "group_admin")
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
