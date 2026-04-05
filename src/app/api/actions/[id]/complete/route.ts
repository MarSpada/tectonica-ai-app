import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/* POST /api/actions/[id]/complete — mark action as completed by current user */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Optional notes from request body
  let notes: string | null = null;
  try {
    const body = await req.json();
    notes = body.notes?.trim() || null;
  } catch {
    // No body is fine — notes are optional
  }

  // Delegate to RPC which handles all validation atomically.
  //
  // ERROR CODE CONTRACT (keep in sync with supabase/migrations/020_actions.sql)
  // ──────────────────────────────────────────────────────────────────────────
  //   RPC errcode | RPC message substring           | HTTP status
  //   ------------|----------------------------------|------------
  //   P0002       | 'Action not found'               | 404
  //   P0003       | 'Action is not active'           | 400
  //   P0004       | 'Member does not belong to       | 403
  //               |  action group'                   |
  //   P0005       | 'Action already completed'       | 409
  //
  // WARNING: Error mapping below uses substring matching on the RPC exception
  // message. If you change a message in the RPC, you MUST update the
  // corresponding match here, and vice versa.
  const { data, error } = await supabase.rpc("complete_action", {
    p_action_id: id,
    p_member_id: user.id,
  });

  if (error) {
    const msg = error.message || "";
    if (msg.includes("not found")) {
      return NextResponse.json({ error: "Action not found" }, { status: 404 });
    }
    if (msg.includes("not active")) {
      return NextResponse.json({ error: "Action is not active" }, { status: 400 });
    }
    if (msg.includes("does not belong")) {
      return NextResponse.json({ error: "Not authorized for this action" }, { status: 403 });
    }
    if (msg.includes("already completed")) {
      return NextResponse.json({ error: "Action already completed" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update notes if provided (RPC doesn't handle notes for simplicity)
  if (notes && data?.completion_id) {
    await supabase
      .from("action_completions")
      .update({ notes })
      .eq("id", data.completion_id);
  }

  return NextResponse.json({
    completion_id: data?.completion_id,
    points_earned: data?.points_earned ?? 0,
  });
}
