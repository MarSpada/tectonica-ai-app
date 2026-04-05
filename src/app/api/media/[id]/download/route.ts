import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getSignedUrl } from "@/lib/media-storage";

/* GET /api/media/[id]/download — increment download count + return signed URL */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: item, error } = await supabase
    .from("media_items")
    .select("id, storage_path, url, category, download_count")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !item) {
    return NextResponse.json({ error: "Media item not found" }, { status: 404 });
  }

  // Increment download count
  await supabase
    .from("media_items")
    .update({ download_count: (item.download_count ?? 0) + 1 })
    .eq("id", id);

  // For links, return the external URL directly
  if (item.category === "link" && item.url) {
    return NextResponse.json({ url: item.url });
  }

  // For files, return a signed URL
  if (!item.storage_path) {
    return NextResponse.json({ error: "No file associated with this item" }, { status: 400 });
  }

  try {
    const signedUrl = await getSignedUrl(supabase, item.storage_path);
    return NextResponse.json({ url: signedUrl });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate download URL" },
      { status: 500 }
    );
  }
}
