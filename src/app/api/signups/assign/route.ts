import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      nbSignupId,
      nbSignupName,
      nbSignupEmail,
      nbSignupPhone,
      nbSignupCreatedAt,
      assignToUserId,
    } = body;

    if (!nbSignupId || !nbSignupName || !assignToUserId) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Create assignment + notification atomically via RPC
    const { data: assignmentId, error } = await supabase.rpc(
      "create_signup_assignment",
      {
        p_nb_signup_id: nbSignupId,
        p_nb_signup_name: nbSignupName,
        p_nb_signup_email: nbSignupEmail || "",
        p_nb_signup_phone: nbSignupPhone || "",
        p_nb_signup_created_at: nbSignupCreatedAt || null,
        p_assigned_to: assignToUserId,
      }
    );

    if (error) {
      console.error("Assignment RPC error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Look up the assignee's email for Resend
    const { data: members } = await supabase.rpc("get_group_members");
    const assignee = members?.find(
      (m: { id: string }) => m.id === assignToUserId
    );

    // Send email via Resend
    if (assignee?.email && process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: "Tectonica.AI <onboarding@resend.dev>",
          to: assignee.email,
          subject: `New signup assigned to you: ${nbSignupName}`,
          html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
              <h2 style="color: #7C3AED;">New Signup Assigned to You</h2>
              <p>Hi ${assignee.full_name || "there"},</p>
              <p><strong>${nbSignupName}</strong> has been assigned to you by your team.</p>
              <p style="color: #d97706; font-weight: 600;">Contact them within 24 hours for best results.</p>
              ${nbSignupEmail ? `<p><strong>Email:</strong> ${nbSignupEmail}</p>` : ""}
              ${nbSignupPhone ? `<p><strong>Phone:</strong> ${nbSignupPhone}</p>` : ""}
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
              <p style="color: #6b7280; font-size: 14px;">Log in to your dashboard to see all your assignments.</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("Failed to send assignment email:", emailErr);
        // Don't fail the request if email fails — assignment is already saved
      }
    }

    return Response.json({ assignmentId, assigneeName: assignee?.full_name });
  } catch (err) {
    console.error("Assignment failed:", err);
    return Response.json({ error: "Assignment failed" }, { status: 500 });
  }
}
