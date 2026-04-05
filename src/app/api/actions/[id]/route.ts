import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/* GET /api/actions/[id] — single action detail */
export async function GET(
  req: Request,
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
    .select("group_id, role")
    .eq("id", user.id)
    .single();
  if (!profile?.group_id) {
    return NextResponse.json({ error: "No group assigned" }, { status: 400 });
  }

  const isAdmin = profile.role === "super_admin" || profile.role === "group_admin";

  const { data: action, error } = await supabase
    .from("actions")
    .select("*")
    .eq("id", id)
    .eq("group_id", profile.group_id)
    .single();

  if (error || !action) {
    return NextResponse.json({ error: "Action not found" }, { status: 404 });
  }

  // Non-admins cannot see admins_only actions
  if (action.visibility === "admins_only" && !isAdmin) {
    return NextResponse.json({ error: "Action not found" }, { status: 404 });
  }

  // Enrich with creator profile
  let creator_name: string | null = null;
  let creator_avatar: string | null = null;
  if (action.created_by) {
    const { data: creator } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", action.created_by)
      .single();
    if (creator) {
      creator_name = creator.full_name;
      creator_avatar = creator.avatar_url;
    }
  }

  // Check current user's completion
  const { data: myCompletion } = await supabase
    .from("action_completions")
    .select("id, completed_at, points_earned, notes")
    .eq("action_id", id)
    .eq("member_id", user.id)
    .maybeSingle();

  // Completion count
  const { count: completionCount } = await supabase
    .from("action_completions")
    .select("id", { count: "exact", head: true })
    .eq("action_id", id);

  // Completion list (admins only)
  let completions: Array<Record<string, unknown>> = [];
  if (isAdmin) {
    const { data: allCompletions } = await supabase
      .from("action_completions")
      .select("id, member_id, completed_at, completion_method, points_earned, notes")
      .eq("action_id", id)
      .order("completed_at", { ascending: false });

    if (allCompletions && allCompletions.length > 0) {
      const memberIds = [...new Set(allCompletions.map((c) => c.member_id))];
      const { data: members } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", memberIds);
      const memberMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
      for (const m of members || []) {
        memberMap[m.id] = { full_name: m.full_name, avatar_url: m.avatar_url };
      }
      completions = allCompletions.map((c) => ({
        ...c,
        member_name: memberMap[c.member_id]?.full_name || "Unknown",
        member_avatar: memberMap[c.member_id]?.avatar_url || null,
      }));
    }
  }

  // Assignments
  const { data: assignments } = await supabase
    .from("action_assignments")
    .select("id, assigned_to_member_id, assigned_by, assigned_at")
    .eq("action_id", id);

  return NextResponse.json({
    action: {
      ...action,
      creator_name,
      creator_avatar,
      completion_count: completionCount ?? 0,
      is_completed_by_me: !!myCompletion,
      my_completion: myCompletion || null,
    },
    completions,
    assignments: assignments || [],
  });
}

/* PATCH /api/actions/[id] — update action (admin only) */
export async function PATCH(
  req: Request,
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
    .select("group_id, role")
    .eq("id", user.id)
    .single();
  if (!profile?.group_id) {
    return NextResponse.json({ error: "No group assigned" }, { status: 400 });
  }
  if (profile.role !== "super_admin" && profile.role !== "group_admin") {
    return NextResponse.json({ error: "Only admins can update actions" }, { status: 403 });
  }

  const body = await req.json();

  // Validate suggested_bot_slug if being updated
  if (body.suggested_bot_slug !== undefined && body.suggested_bot_slug !== null) {
    const { data: bot } = await supabase
      .from("bots")
      .select("slug")
      .eq("slug", body.suggested_bot_slug)
      .single();
    if (!bot) {
      return NextResponse.json({ error: "Invalid bot slug" }, { status: 400 });
    }
  }

  // Build update payload — only include provided fields
  const updateFields: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const allowedFields = [
    "title", "description", "type", "call_to_action", "url",
    "suggested_bot_slug", "points_value", "priority",
    "assignment_scope", "starts_at", "ends_at", "status", "visibility",
  ];
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateFields[field] = body[field];
    }
  }

  const { data: action, error } = await supabase
    .from("actions")
    .update(updateFields)
    .eq("id", id)
    .eq("group_id", profile.group_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!action) return NextResponse.json({ error: "Action not found" }, { status: 404 });

  return NextResponse.json({ action });
}

/* DELETE /api/actions/[id] — archive action (admin only) */
export async function DELETE(
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
    .select("group_id, role")
    .eq("id", user.id)
    .single();
  if (!profile?.group_id) {
    return NextResponse.json({ error: "No group assigned" }, { status: 400 });
  }
  if (profile.role !== "super_admin" && profile.role !== "group_admin") {
    return NextResponse.json({ error: "Only admins can archive actions" }, { status: 403 });
  }

  // Soft delete via status = archived (preserves completion + points history)
  const { error } = await supabase
    .from("actions")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("group_id", profile.group_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
