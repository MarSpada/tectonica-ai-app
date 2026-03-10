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
    const { content, attachments } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Insert comment (RLS handles authorization)
    const { data: comment, error } = await supabase
      .from("approval_comments")
      .insert({
        request_id: id,
        author_id: user.id,
        content: content.trim(),
        attachments: attachments || [],
      })
      .select()
      .single();

    if (error) {
      console.error("Create comment error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Determine the other party and notify them
    const { data: req } = await supabase
      .from("approval_requests")
      .select("submitter_id, reviewer_id, title, group_id")
      .eq("id", id)
      .single();

    if (req) {
      const otherPartyId = user.id === req.submitter_id ? req.reviewer_id : req.submitter_id;

      // In-app notification
      await supabase.from("notifications").insert({
        user_id: otherPartyId,
        group_id: req.group_id,
        type: "approval_request",
        title: "New comment on request",
        body: `New comment on "${req.title}"`,
        metadata: {
          approval_request_id: id,
          commenter_id: user.id,
        },
      });

      // Email (fire-and-forget)
      if (process.env.RESEND_API_KEY) {
        try {
          const { data: members } = await supabase.rpc("get_group_members");
          const otherParty = members?.find((m: { id: string }) => m.id === otherPartyId);
          const { data: authorProfile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .single();

          if (otherParty?.email) {
            await resend.emails.send({
              from: `Tectonica.AI <${process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"}>`,
              to: otherParty.email,
              subject: `New comment on: ${req.title}`,
              html: `
                <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
                  <h2 style="color: #7C3AED;">New Comment</h2>
                  <p>Hi ${otherParty.full_name || "there"},</p>
                  <p><strong>${authorProfile?.full_name || "Someone"}</strong> commented on <strong>"${req.title}"</strong>:</p>
                  <p style="background: #f3f4f6; padding: 12px; border-radius: 8px; color: #374151;">"${content.trim().slice(0, 300)}${content.trim().length > 300 ? "..." : ""}"</p>
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                  <p style="color: #6b7280; font-size: 14px;">Log in to view and reply.</p>
                </div>
              `,
            });
          }
        } catch (emailErr) {
          console.error("Failed to send comment email:", emailErr);
        }
      }
    }

    // Enrich with author name
    const { data: authorProfile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      comment: {
        ...comment,
        author_name: authorProfile?.full_name || "Unknown",
        author_avatar: authorProfile?.avatar_url || null,
      },
    });
  } catch (err) {
    console.error("Create comment failed:", err);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
