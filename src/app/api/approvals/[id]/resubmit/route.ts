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
    const { description, attachments } = body;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { error } = await supabase.rpc("resubmit_approval_request", {
      p_request_id: id,
      p_description: description || null,
      p_attachments: attachments || null,
    });

    if (error) {
      console.error("Resubmit approval error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send email to reviewer (fire-and-forget)
    if (process.env.RESEND_API_KEY) {
      try {
        const { data: req } = await supabase
          .from("approval_requests")
          .select("reviewer_id, title")
          .eq("id", id)
          .single();

        if (req) {
          const { data: members } = await supabase.rpc("get_group_members");
          const reviewer = members?.find((m: { id: string }) => m.id === req.reviewer_id);
          const { data: submitterProfile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .single();

          if (reviewer?.email) {
            await resend.emails.send({
              from: `Tectonica.AI <${process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"}>`,
              to: reviewer.email,
              subject: `Resubmitted: ${req.title}`,
              html: `
                <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
                  <h2 style="color: #7C3AED;">Request Resubmitted</h2>
                  <p>Hi ${reviewer.full_name || "there"},</p>
                  <p><strong>${submitterProfile?.full_name || "A team member"}</strong> resubmitted <strong>"${req.title}"</strong> for your review.</p>
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                  <p style="color: #6b7280; font-size: 14px;">Log in to review the updated request.</p>
                </div>
              `,
            });
          }
        }
      } catch (emailErr) {
        console.error("Failed to send resubmit email:", emailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Resubmit failed:", err);
    return NextResponse.json({ error: "Resubmit failed" }, { status: 500 });
  }
}
