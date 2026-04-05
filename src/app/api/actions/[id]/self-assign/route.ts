import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/* POST /api/actions/[id]/self-assign — member self-assigns to an action */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("group_id")
    .eq("id", user.id)
    .single();
  if (!profile?.group_id) {
    return NextResponse.json({ error: "No group assigned" }, { status: 400 });
  }

  // Fetch action and validate
  const { data: action } = await supabase
    .from("actions")
    .select("id, group_id, assignment_scope, status")
    .eq("id", id)
    .eq("group_id", profile.group_id)
    .single();

  if (!action) {
    return NextResponse.json({ error: "Action not found" }, { status: 404 });
  }

  if (action.status !== "active") {
    return NextResponse.json({ error: "Action is not active" }, { status: 400 });
  }

  // Only self_assign actions can be self-assigned
  if (action.assignment_scope !== "self_assign") {
    return NextResponse.json(
      { error: "This action does not allow self-assignment" },
      { status: 403 }
    );
  }

  // Check if already assigned
  const { data: existing } = await supabase
    .from("action_assignments")
    .select("id")
    .eq("action_id", id)
    .eq("assigned_to_member_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Already assigned to this action" }, { status: 409 });
  }

  const { data: assignment, error } = await supabase
    .from("action_assignments")
    .insert({
      action_id: id,
      assigned_to_member_id: user.id,
      assigned_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ assignment }, { status: 201 });
}
