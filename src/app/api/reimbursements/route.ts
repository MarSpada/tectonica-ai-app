import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("group_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.group_id) {
      return Response.json({ requests: [] });
    }

    // Fetch reimbursement requests visible to this user
    const { data: requests } = await supabase
      .from("reimbursement_requests")
      .select("*")
      .eq("group_id", profile.group_id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!requests) return Response.json({ requests: [] });

    // Enrich with names
    const userIds = [...new Set(requests.flatMap((r) => [r.submitter_id, r.reviewer_id]))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", userIds);

    const nameMap = new Map((profiles ?? []).map((p: { id: string; full_name: string; avatar_url: string | null }) => [p.id, p]));

    const enriched = requests.map((r) => ({
      ...r,
      submitter_name: nameMap.get(r.submitter_id)?.full_name || "Unknown",
      submitter_avatar: nameMap.get(r.submitter_id)?.avatar_url || null,
      reviewer_name: nameMap.get(r.reviewer_id)?.full_name || "Unknown",
      reviewer_avatar: nameMap.get(r.reviewer_id)?.avatar_url || null,
    }));

    return Response.json({ requests: enriched });
  } catch (err) {
    console.error("Reimbursements fetch failed:", err);
    return Response.json({ error: "Failed to fetch reimbursements" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { amount, description, reviewerId, attachments } = body;

    if (!amount || !description || !reviewerId) {
      return Response.json({ error: "Amount, description, and reviewer are required" }, { status: 400 });
    }

    const { data: requestId, error } = await supabase.rpc("create_reimbursement_request", {
      p_amount: amount,
      p_description: description,
      p_reviewer_id: reviewerId,
      p_attachments: attachments || [],
    });

    if (error) {
      console.error("RPC error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ requestId });
  } catch (err) {
    console.error("Reimbursement creation failed:", err);
    return Response.json({ error: "Failed to create reimbursement request" }, { status: 500 });
  }
}
