import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, fetchProfileMap } from "@/lib/api-utils";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { profile, supabase } = auth;

    if (!profile.group_id) {
      return NextResponse.json({ requests: [] });
    }

    // Fetch reimbursement requests visible to this user
    const { data: requests } = await supabase
      .from("reimbursement_requests")
      .select("*")
      .eq("group_id", profile.group_id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!requests) return NextResponse.json({ requests: [] });

    // Enrich with names
    const userIds = new Set(requests.flatMap((r) => [r.submitter_id, r.reviewer_id]));
    const profileMap = await fetchProfileMap(supabase, userIds);

    const enriched = requests.map((r) => ({
      ...r,
      submitter_name: profileMap[r.submitter_id]?.full_name || "Unknown",
      submitter_avatar: profileMap[r.submitter_id]?.avatar_url || null,
      reviewer_name: profileMap[r.reviewer_id]?.full_name || "Unknown",
      reviewer_avatar: profileMap[r.reviewer_id]?.avatar_url || null,
    }));

    return NextResponse.json({ requests: enriched });
  } catch (err) {
    console.error("Reimbursements fetch failed:", err);
    return NextResponse.json({ error: "Failed to fetch reimbursements" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { amount, description, reviewerId, attachments } = body;

    if (!amount || !description || !reviewerId) {
      return NextResponse.json({ error: "Amount, description, and reviewer are required" }, { status: 400 });
    }

    const { data: requestId, error } = await supabase.rpc("create_reimbursement_request", {
      p_amount: amount,
      p_description: description,
      p_reviewer_id: reviewerId,
      p_attachments: attachments || [],
    });

    if (error) {
      console.error("RPC error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ requestId });
  } catch (err) {
    console.error("Reimbursement creation failed:", err);
    return NextResponse.json({ error: "Failed to create reimbursements request" }, { status: 500 });
  }
}
