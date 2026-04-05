import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/* GET /api/actions — list actions for the user's group */
export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") || "all"; // all | mine
  const status = searchParams.get("status"); // active | completed | expired | archived
  const type = searchParams.get("type");
  const page = Math.max(0, parseInt(searchParams.get("page") || "0", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

  const { data: profile } = await supabase
    .from("profiles")
    .select("group_id, role")
    .eq("id", user.id)
    .single();
  if (!profile?.group_id) {
    return NextResponse.json({ error: "No group assigned" }, { status: 400 });
  }

  const isAdmin = profile.role === "super_admin" || profile.role === "group_admin";

  // Build query
  let query = supabase
    .from("actions")
    .select("*", { count: "exact" })
    .eq("group_id", profile.group_id)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false })
    .range(page * limit, page * limit + limit - 1);

  // Status filter — archived/expired only visible to admins via explicit param
  if (status) {
    if ((status === "archived" || status === "expired") && !isAdmin) {
      return NextResponse.json({ error: "Only admins can query archived or expired actions" }, { status: 403 });
    }
    query = query.eq("status", status);
  } else {
    // Default: active only (exclude archived + expired)
    query = query.eq("status", "active");
  }

  if (type) {
    query = query.eq("type", type);
  }

  // Visibility — non-admins only see group-visible actions (RLS handles this too)
  if (!isAdmin) {
    query = query.eq("visibility", "group");
  }

  const { data: actions, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const actionIds = (actions || []).map((a) => a.id);

  // scope=mine: filter to actions where user has assignment OR scope is all/self_assign
  let filteredActions = actions || [];
  if (scope === "mine" && actionIds.length > 0) {
    const { data: myAssignments } = await supabase
      .from("action_assignments")
      .select("action_id")
      .in("action_id", actionIds)
      .eq("assigned_to_member_id", user.id);

    const assignedIds = new Set((myAssignments || []).map((a) => a.action_id));
    filteredActions = filteredActions.filter(
      (a) => assignedIds.has(a.id) || a.assignment_scope === "all" || a.assignment_scope === "self_assign"
    );
  }

  // Enrich with creator profiles
  const creatorIds = new Set<string>();
  for (const a of filteredActions) {
    if (a.created_by) creatorIds.add(a.created_by);
  }

  let profileMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
  if (creatorIds.size > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", [...creatorIds]);
    for (const p of profiles || []) {
      profileMap[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
    }
  }

  // Enrich with completion counts + is_completed_by_me
  let completionCounts: Record<string, number> = {};
  let myCompletions = new Set<string>();

  if (actionIds.length > 0) {
    // Count completions per action
    const { data: completions } = await supabase
      .from("action_completions")
      .select("action_id")
      .in("action_id", actionIds);

    for (const c of completions || []) {
      completionCounts[c.action_id] = (completionCounts[c.action_id] || 0) + 1;
    }

    // Check current user's completions
    const { data: mine } = await supabase
      .from("action_completions")
      .select("action_id")
      .in("action_id", actionIds)
      .eq("member_id", user.id);

    for (const c of mine || []) {
      myCompletions.add(c.action_id);
    }
  }

  const enriched = filteredActions.map((a) => ({
    ...a,
    creator_name: a.created_by ? profileMap[a.created_by]?.full_name || "Unknown" : null,
    creator_avatar: a.created_by ? profileMap[a.created_by]?.avatar_url || null : null,
    completion_count: completionCounts[a.id] || 0,
    is_completed_by_me: myCompletions.has(a.id),
  }));

  return NextResponse.json({
    actions: enriched,
    total: count ?? 0,
    page,
    limit,
  });
}

/* POST /api/actions — create an internal action (admin only) */
export async function POST(req: Request) {
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
    return NextResponse.json({ error: "Only admins can create actions" }, { status: 403 });
  }

  const body = await req.json();

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  // Validate suggested_bot_slug if provided
  if (body.suggested_bot_slug) {
    const { data: bot } = await supabase
      .from("bots")
      .select("slug")
      .eq("slug", body.suggested_bot_slug)
      .single();
    if (!bot) {
      return NextResponse.json({ error: "Invalid bot slug" }, { status: 400 });
    }
  }

  const { data: action, error } = await supabase
    .from("actions")
    .insert({
      group_id: profile.group_id,
      source: "internal",
      type: body.type || "custom",
      title: body.title.trim(),
      description: body.description?.trim() || null,
      call_to_action: body.call_to_action?.trim() || null,
      url: body.url?.trim() || null,
      suggested_bot_slug: body.suggested_bot_slug || null,
      points_value: body.points_value ?? 0,
      priority: body.priority ?? 0,
      assignment_scope: body.assignment_scope || "all",
      starts_at: body.starts_at || null,
      ends_at: body.ends_at || null,
      visibility: body.visibility || "group",
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If targeted, create assignment records
  if (body.assignment_scope === "targeted" && Array.isArray(body.assignee_ids) && body.assignee_ids.length > 0) {
    const assignments = body.assignee_ids.map((memberId: string) => ({
      action_id: action.id,
      assigned_to_member_id: memberId,
      assigned_by: user.id,
    }));
    await supabase.from("action_assignments").insert(assignments);
  }

  return NextResponse.json({ action }, { status: 201 });
}
