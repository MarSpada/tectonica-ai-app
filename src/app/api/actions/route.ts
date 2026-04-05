import { NextResponse } from "next/server";
import { isAdminRole } from "@/lib/constants/roles";
import { requireAuth, fetchProfileMap } from "@/lib/api-utils";

/* GET /api/actions — list actions for the user's group */
export async function GET(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, profile, supabase } = auth;

  if (!profile.group_id) {
    return NextResponse.json({ error: "No group assigned" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") || "all"; // all | mine
  const status = searchParams.get("status"); // active | completed | expired | archived
  const type = searchParams.get("type");
  const page = Math.max(0, parseInt(searchParams.get("page") || "0", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

  const isAdmin = isAdminRole(profile.role);

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

  const profileMap = await fetchProfileMap(supabase, creatorIds);

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
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, profile, supabase } = auth;

  if (!profile.group_id) {
    return NextResponse.json({ error: "No group assigned" }, { status: 400 });
  }
  if (!isAdminRole(profile.role)) {
    return NextResponse.json({ error: "Only admins can create actions" }, { status: 403 });
  }

  const body = await req.json();

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  // Validate enum fields
  const VALID_TYPES = ["petition", "donation", "event_rsvp", "letter", "phone_bank", "canvass", "social_share", "custom"];
  if (body.type && !VALID_TYPES.includes(body.type)) {
    return NextResponse.json({ error: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` }, { status: 400 });
  }

  const VALID_SCOPES = ["all", "targeted", "self_assign"];
  if (body.assignment_scope && !VALID_SCOPES.includes(body.assignment_scope)) {
    return NextResponse.json({ error: `Invalid assignment_scope. Must be one of: ${VALID_SCOPES.join(", ")}` }, { status: 400 });
  }

  const VALID_VISIBILITY = ["group", "admins_only"];
  if (body.visibility && !VALID_VISIBILITY.includes(body.visibility)) {
    return NextResponse.json({ error: `Invalid visibility. Must be one of: ${VALID_VISIBILITY.join(", ")}` }, { status: 400 });
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

  // Atomic action + assignments via RPC (both succeed or both fail)
  const { data: actionId, error } = await supabase.rpc("create_action_with_assignments", {
    p_group_id: profile.group_id,
    p_source: "internal",
    p_type: body.type || "custom",
    p_title: body.title.trim(),
    p_description: body.description?.trim() || null,
    p_call_to_action: body.call_to_action?.trim() || null,
    p_url: body.url?.trim() || null,
    p_suggested_bot_slug: body.suggested_bot_slug || null,
    p_points_value: body.points_value ?? 0,
    p_priority: body.priority ?? 0,
    p_assignment_scope: body.assignment_scope || "all",
    p_starts_at: body.starts_at || null,
    p_ends_at: body.ends_at || null,
    p_visibility: body.visibility || "group",
    p_created_by: user.id,
    p_assignee_ids: body.assignment_scope === "targeted" && Array.isArray(body.assignee_ids)
      ? body.assignee_ids
      : [],
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch the created action to return it
  const { data: action } = await supabase
    .from("actions")
    .select("*")
    .eq("id", actionId)
    .single();

  return NextResponse.json({ action }, { status: 201 });
}
