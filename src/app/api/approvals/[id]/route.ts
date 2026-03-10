import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch request (RLS handles visibility)
  const { data: request, error } = await supabase
    .from("approval_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  // Fetch comments
  const { data: comments } = await supabase
    .from("approval_comments")
    .select("*")
    .eq("request_id", id)
    .order("created_at", { ascending: true });

  // Enrich with profile names
  const userIds = new Set<string>([request.submitter_id, request.reviewer_id]);
  for (const c of comments || []) {
    userIds.add(c.author_id);
  }

  let profileMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
  if (userIds.size > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", [...userIds]);

    for (const p of profiles || []) {
      profileMap[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
    }
  }

  const enrichedRequest = {
    ...request,
    submitter_name: profileMap[request.submitter_id]?.full_name || "Unknown",
    submitter_avatar: profileMap[request.submitter_id]?.avatar_url || null,
    reviewer_name: profileMap[request.reviewer_id]?.full_name || "Unknown",
    reviewer_avatar: profileMap[request.reviewer_id]?.avatar_url || null,
  };

  const enrichedComments = (comments || []).map((c) => ({
    ...c,
    author_name: profileMap[c.author_id]?.full_name || "Unknown",
    author_avatar: profileMap[c.author_id]?.avatar_url || null,
  }));

  return NextResponse.json({ request: enrichedRequest, comments: enrichedComments });
}
