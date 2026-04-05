import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { description, attachments } = body;

    const { error } = await supabase.rpc("resubmit_reimbursement", {
      p_request_id: id,
      p_description: description || null,
      p_attachments: attachments || null,
    });

    if (error) {
      console.error("RPC error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Reimbursement resubmit failed:", err);
    return NextResponse.json({ error: "Failed to resubmit" }, { status: 500 });
  }
}
