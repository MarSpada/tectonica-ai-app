import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/* GET /api/approvals — list approval requests */
export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let query = supabase
    .from("approval_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data: requests, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with submitter/reviewer names
  const userIds = new Set<string>();
  for (const r of requests || []) {
    userIds.add(r.submitter_id);
    userIds.add(r.reviewer_id);
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

  const enriched = (requests || []).map((r) => ({
    ...r,
    submitter_name: profileMap[r.submitter_id]?.full_name || "Unknown",
    submitter_avatar: profileMap[r.submitter_id]?.avatar_url || null,
    reviewer_name: profileMap[r.reviewer_id]?.full_name || "Unknown",
    reviewer_avatar: profileMap[r.reviewer_id]?.avatar_url || null,
  }));

  return NextResponse.json({ requests: enriched });
}

/* POST /api/approvals — create approval request */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, reviewerId, attachments, conversationId, botId } = body;

    if (!title || !reviewerId) {
      return NextResponse.json({ error: "Title and reviewer are required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Create request + notification atomically via RPC
    const { data: requestId, error } = await supabase.rpc("create_approval_request", {
      p_title: title,
      p_description: description || null,
      p_reviewer_id: reviewerId,
      p_attachments: attachments || [],
      p_conversation_id: conversationId || null,
      p_bot_id: botId || null,
    });

    if (error) {
      console.error("Approval request RPC error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send email to reviewer (fire-and-forget)
    if (process.env.RESEND_API_KEY) {
      try {
        // Look up reviewer email
        const { data: reviewer } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", reviewerId)
          .single();

        const { data: reviewerAuth } = await supabase.rpc("get_group_members");
        const reviewerMember = reviewerAuth?.find((m: { id: string }) => m.id === reviewerId);

        const { data: submitterProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        if (reviewerMember?.email) {
          await resend.emails.send({
            from: `Tectonica.AI <${process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"}>`,
            to: reviewerMember.email,
            subject: `Approval requested: ${title}`,
            html: `
              <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
                <h2 style="color: #7C3AED;">New Approval Request</h2>
                <p>Hi ${reviewer?.full_name || "there"},</p>
                <p><strong>${submitterProfile?.full_name || "A team member"}</strong> submitted <strong>"${title}"</strong> for your approval.</p>
                ${description ? `<p style="color: #4a4a6a;">${description.slice(0, 200)}${description.length > 200 ? "..." : ""}</p>` : ""}
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                <p style="color: #6b7280; font-size: 14px;">Log in to review and approve this request.</p>
              </div>
            `,
          });
        }
      } catch (emailErr) {
        console.error("Failed to send approval email:", emailErr);
      }
    }

    return NextResponse.json({ requestId });
  } catch (err) {
    console.error("Create approval failed:", err);
    return NextResponse.json({ error: "Failed to create approval request" }, { status: 500 });
  }
}
