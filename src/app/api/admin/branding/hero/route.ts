import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import { isSuperAdmin } from "@/lib/constants/roles";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

/**
 * POST /api/admin/branding/hero
 * Super admin only. Uploads a hero image to Supabase Storage bucket "branding".
 * Accepts multipart form data with a "hero" file field.
 * Updates group_branding.hero_image_url with the public URL.
 *
 * Storage bucket "branding" must be created manually in Supabase dashboard as a PUBLIC bucket.
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { profile, supabase } = auth;

    if (!isSuperAdmin(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!profile.group_id || !profile.org_id) {
      return NextResponse.json(
        { error: "No group or org assigned" },
        { status: 400 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("hero") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, and WebP images are allowed" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds maximum size of 2MB" },
        { status: 400 },
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const storagePath = `${profile.group_id}/hero.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to branding bucket (upsert to overwrite previous hero image)
    const { error: uploadErr } = await supabase.storage
      .from("branding")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadErr) {
      console.error("Hero upload error:", uploadErr);
      return NextResponse.json(
        { error: `Upload failed: ${uploadErr.message}` },
        { status: 500 },
      );
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from("branding")
      .getPublicUrl(storagePath);

    const heroUrl = urlData.publicUrl;

    // Upsert group_branding row with hero_image_url
    const { data: branding, error: dbError } = await supabase
      .from("group_branding")
      .upsert(
        {
          group_id: profile.group_id,
          org_id: profile.org_id,
          hero_image_url: heroUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "group_id" },
      )
      .select()
      .single();

    if (dbError) {
      console.error("Branding hero DB error:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ branding });
  } catch (err) {
    console.error("Hero upload failed:", err);
    return NextResponse.json(
      { error: "Failed to upload hero image" },
      { status: 500 },
    );
  }
}
