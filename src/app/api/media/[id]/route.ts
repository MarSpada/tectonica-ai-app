import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getSignedUrl, deleteFile } from "@/lib/media-storage";

/* GET /api/media/[id] — get single media item with signed URL */
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
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !item) {
    return NextResponse.json({ error: "Media item not found" }, { status: 404 });
  }

  // Build signed URL for files
  let signedUrl: string | null = null;
  if (item.storage_path) {
    try {
      signedUrl = await getSignedUrl(supabase, item.storage_path);
    } catch {
      signedUrl = null;
    }
  }

  // Enrich with uploader profile
  let uploaderName = "Unknown";
  let uploaderAvatar: string | null = null;
  if (item.uploaded_by) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", item.uploaded_by)
      .single();
    if (profile) {
      uploaderName = profile.full_name || "Unknown";
      uploaderAvatar = profile.avatar_url;
    }
  }

  return NextResponse.json({
    item: {
      ...item,
      uploader_name: uploaderName,
      uploader_avatar: uploaderAvatar,
      signed_url: signedUrl,
    },
  });
}

/* DELETE /api/media/[id] — soft delete a media item */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check role — only uploader or admins can delete
  const { data: profile } = await supabase
    .from("profiles")
    .select("group_id, role")
    .eq("id", user.id)
    .single();

  const { data: item, error } = await supabase
    .from("media_items")
    .select("id, uploaded_by, storage_path, file_size, group_id")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !item) {
    return NextResponse.json({ error: "Media item not found" }, { status: 404 });
  }

  const isOwner = item.uploaded_by === user.id;
  const isAdmin = profile?.role === "group_admin" || profile?.role === "super_admin";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  // Soft delete via RPC (bypasses RLS conflict with SELECT policy on deleted_at)
  const { error: rpcError } = await supabase.rpc("soft_delete_media_item", {
    p_media_id: id,
  });

  if (rpcError) {
    console.error("Media soft delete failed:", rpcError);
    return NextResponse.json({ error: rpcError.message }, { status: 500 });
  }

  // Delete file from storage
  if (item.storage_path) {
    try {
      await deleteFile(supabase, item.storage_path);
    } catch {
      // File may already be gone — continue
    }
  }

  return NextResponse.json({ success: true });
}
