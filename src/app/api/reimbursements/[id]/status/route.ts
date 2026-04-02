import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!["approved", "changes_requested"].includes(status)) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }

    const { error } = await supabase.rpc("update_reimbursement_status", {
      p_request_id: id,
      p_new_status: status,
    });

    if (error) {
      console.error("RPC error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("Reimbursement status update failed:", err);
    return Response.json({ error: "Failed to update status" }, { status: 500 });
  }
}
