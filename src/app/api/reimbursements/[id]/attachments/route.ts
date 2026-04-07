import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-utils";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * POST /api/reimbursements/[id]/attachments
 * Upload file attachments for a reimbursement request.
 * Accepts multipart/form-data with one or more "file" fields.
 * Updates the reimbursement_requests row with the uploaded URLs.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  // Verify the reimbursement request exists and belongs to this user
  const { data: reimbursement } = await supabase
    .from("reimbursement_requests")
    .select("id, submitter_id, attachments")
    .eq("id", id)
    .single();

  if (!reimbursement) {
    return NextResponse.json({ error: "Reimbursement request not found" }, { status: 404 });
  }
  if (reimbursement.submitter_id !== user.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const formData = await request.formData();
  const files = formData.getAll("file");

  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  const uploaded: { url: string; name: string; type: string }[] = [];

  for (const entry of files) {
    if (!(entry instanceof File)) continue;

    if (!ALLOWED_TYPES.includes(entry.type)) {
      return NextResponse.json({ error: `Invalid file type: ${entry.type}. Only JPG, PNG, and PDF are allowed.` }, { status: 400 });
    }
    if (entry.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `File "${entry.name}" exceeds 5MB limit` }, { status: 400 });
    }

    const ext = entry.name.split(".").pop() || "bin";
    const storagePath = `${user.id}/${id}/${crypto.randomUUID()}.${ext}`;
    const buffer = Buffer.from(await entry.arrayBuffer());

    const { error: uploadErr } = await supabase.storage
      .from("reimbursements")
      .upload(storagePath, buffer, { contentType: entry.type });

    if (uploadErr) {
      return NextResponse.json({ error: `Upload failed: ${uploadErr.message}` }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from("reimbursements")
      .getPublicUrl(storagePath);

    uploaded.push({ url: urlData.publicUrl, name: entry.name, type: entry.type });
  }

  // Merge with any existing attachments and update the request
  const existingAttachments = (reimbursement.attachments as { url: string; name: string; type: string }[]) || [];
  const allAttachments = [...existingAttachments, ...uploaded];

  const { error: updateErr } = await supabase
    .from("reimbursement_requests")
    .update({ attachments: allAttachments })
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ attachments: allAttachments });
}
