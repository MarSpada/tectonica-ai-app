import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, comment } = body;

    if (!status || !["approved", "changes_requested"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { error } = await supabase.rpc("update_approval_status", {
      p_request_id: id,
      p_new_status: status,
      p_comment: comment || null,
    });

    if (error) {
      console.error("Update approval status error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Mark all approval_request notifications for this request as read for the reviewer
    const { data: relatedNotifications } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", user.id)
      .eq("type", "approval_request")
      .eq("read", false)
      .contains("metadata", { approval_request_id: id });

    if (relatedNotifications && relatedNotifications.length > 0) {
      await supabase
        .from("notifications")
        .update({ read: true })
        .in("id", relatedNotifications.map((n: { id: string }) => n.id));
    }

    // Send email to submitter (fire-and-forget)
    if (process.env.RESEND_API_KEY) {
      try {
        const { data: req } = await supabase
          .from("approval_requests")
          .select("submitter_id, title")
          .eq("id", id)
          .single();

        if (req) {
          const { data: members } = await supabase.rpc("get_group_members");
          const submitter = members?.find((m: { id: string }) => m.id === req.submitter_id);
          const { data: reviewerProfile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .single();

          if (submitter?.email) {
            const isApproved = status === "approved";
            await resend.emails.send({
              from: `Tectonica.AI <${process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"}>`,
              to: submitter.email,
              subject: isApproved
                ? `Approved: ${req.title}`
                : `Changes requested: ${req.title}`,
              html: `
                <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
                  <h2 style="color: ${isApproved ? "#059669" : "#d97706"};">
                    ${isApproved ? "✅ Request Approved" : "📝 Changes Requested"}
                  </h2>
                  <p>Hi ${submitter.full_name || "there"},</p>
                  <p><strong>${reviewerProfile?.full_name || "A reviewer"}</strong> ${isApproved ? "approved" : "requested changes on"} your request <strong>"${req.title}"</strong>.</p>
                  ${comment ? `<p style="background: #f3f4f6; padding: 12px; border-radius: 8px; color: #374151;">"${comment}"</p>` : ""}
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                  <p style="color: #6b7280; font-size: 14px;">Log in to view the full details.</p>
                </div>
              `,
            });
          }
        }
      } catch (emailErr) {
        console.error("Failed to send status email:", emailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Update approval status failed:", err);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
