import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { supabase } = auth;

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
