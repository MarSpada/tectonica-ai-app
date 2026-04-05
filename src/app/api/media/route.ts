import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  buildStoragePath,
  checkQuota,
  getFileExtension,
  incrementStorageUsed,
  mimeToCategory,
  sanitizeFileName,
  uploadFile,
} from "@/lib/media-storage";

/* GET /api/media — list media items for the user's group */
export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const page = Math.max(0, parseInt(searchParams.get("page") || "0", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "24", 10)));

  // Get user's group
  const { data: profile } = await supabase
    .from("profiles")
    .select("group_id")
    .eq("id", user.id)
    .single();
  if (!profile?.group_id) {
    return NextResponse.json({ error: "No group assigned" }, { status: 400 });
  }

  let query = supabase
    .from("media_items")
    .select("*", { count: "exact" })
    .eq("group_id", profile.group_id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(page * limit, page * limit + limit - 1);

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  if (search) {
    query = query.textSearch("search_vector", search, { type: "websearch" });
  }

  const { data: items, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with uploader names (same pattern as approvals)
  const userIds = new Set<string>();
  for (const item of items || []) {
    if (item.uploaded_by) userIds.add(item.uploaded_by);
  }

  let profileMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
  if (userIds.size > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", [...userIds]);
    for (const p of profiles || []) {
      profileMap[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
    }
  }

  const enriched = (items || []).map((item) => ({
    ...item,
    uploader_name: profileMap[item.uploaded_by]?.full_name || "Unknown",
    uploader_avatar: profileMap[item.uploaded_by]?.avatar_url || null,
  }));

  return NextResponse.json({
    items: enriched,
    total: count ?? 0,
    page,
    limit,
  });
}

/* POST /api/media — upload a file */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check role — supporters blocked
  const { data: profile } = await supabase
    .from("profiles")
    .select("group_id, role")
    .eq("id", user.id)
    .single();
  if (!profile?.group_id) {
    return NextResponse.json({ error: "No group assigned" }, { status: 400 });
  }
  if (profile.role === "supporter") {
    return NextResponse.json({ error: "Supporters cannot upload media" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const title = (formData.get("title") as string) || null;
  const description = (formData.get("description") as string) || null;
  const tagsRaw = formData.get("tags") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
      { status: 400 }
    );
  }

  // Validate MIME type (server-side — client MIME is informational)
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: `File type "${file.type}" is not allowed` },
      { status: 400 }
    );
  }

  // Check quota server-side before accepting upload
  const quotaResult = await checkQuota(supabase, profile.group_id, file.size);
  if (!quotaResult.allowed) {
    return NextResponse.json(
      {
        error: "Group storage quota exceeded",
        usedBytes: quotaResult.usedBytes,
        quotaBytes: quotaResult.quotaBytes,
      },
      { status: 413 }
    );
  }

  const ext = getFileExtension(file.name);
  const storagePath = buildStoragePath(profile.group_id, ext);
  const safeName = sanitizeFileName(file.name);
  const category = mimeToCategory(file.type);
  const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];

  // Upload to storage
  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    await uploadFile(supabase, storagePath, buffer, file.type);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }

  // Insert media_items record
  const { data: item, error: dbError } = await supabase
    .from("media_items")
    .insert({
      group_id: profile.group_id,
      uploaded_by: user.id,
      category,
      file_name: safeName,
      storage_path: storagePath,
      title: title || safeName,
      description,
      mime_type: file.type,
      file_size: file.size,
      status: "ready",
      tags,
    })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  // Increment group storage counter
  await incrementStorageUsed(supabase, profile.group_id, file.size);

  return NextResponse.json({ item }, { status: 201 });
}
