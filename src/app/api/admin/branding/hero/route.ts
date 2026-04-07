import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import { isSuperAdmin } from "@/lib/constants/roles";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_HERO_IMAGES = 5;

/**
 * POST /api/admin/branding/hero
 * Super admin only. Uploads a hero image and appends it to the hero_images array.
 * Accepts multipart form data with "hero" file field and optional "label" text field.
 * Maximum 5 hero images per group.
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
    const label = (formData.get("label") as string) || "";

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

    // Fetch current branding to check hero_images count
    const { data: current } = await supabase
      .from("group_branding")
      .select("hero_images")
      .eq("group_id", profile.group_id)
      .maybeSingle();

    const existingImages: Array<{ url: string; label: string }> =
      Array.isArray(current?.hero_images) ? current.hero_images : [];

    if (existingImages.length >= MAX_HERO_IMAGES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_HERO_IMAGES} hero images allowed` },
        { status: 400 },
      );
    }

    // Upload with unique filename
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const imageId = crypto.randomUUID();
    const storagePath = `${profile.group_id}/hero-${imageId}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadErr } = await supabase.storage
      .from("branding")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
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
    const heroLabel = label || `Hero ${existingImages.length + 1}`;

    // Append to hero_images array
    const updatedImages = [...existingImages, { url: heroUrl, label: heroLabel }];

    // Also set hero_image_url to the first image as the default
    const { data: branding, error: dbError } = await supabase
      .from("group_branding")
      .upsert(
        {
          group_id: profile.group_id,
          org_id: profile.org_id,
          hero_images: updatedImages,
          hero_image_url: updatedImages[0].url,
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

/**
 * DELETE /api/admin/branding/hero
 * Super admin only. Removes a hero image from the hero_images array by URL.
 * Body: { url: string }
 */
export async function DELETE(request: Request) {
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

    const body = await request.json();
    const urlToRemove = body.url;

    if (!urlToRemove || typeof urlToRemove !== "string") {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    // Fetch current images
    const { data: current } = await supabase
      .from("group_branding")
      .select("hero_images")
      .eq("group_id", profile.group_id)
      .maybeSingle();

    const existingImages: Array<{ url: string; label: string }> =
      Array.isArray(current?.hero_images) ? current.hero_images : [];

    const updatedImages = existingImages.filter((img) => img.url !== urlToRemove);

    // Update array and set hero_image_url to first remaining image (or null)
    const { data: branding, error: dbError } = await supabase
      .from("group_branding")
      .update({
        hero_images: updatedImages,
        hero_image_url: updatedImages[0]?.url || null,
        updated_at: new Date().toISOString(),
      })
      .eq("group_id", profile.group_id)
      .select()
      .single();

    if (dbError) {
      console.error("Hero delete DB error:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // Try to delete from storage (best-effort — extract path from URL)
    try {
      const urlObj = new URL(urlToRemove);
      const pathMatch = urlObj.pathname.match(/\/branding\/(.+)$/);
      if (pathMatch) {
        await supabase.storage.from("branding").remove([pathMatch[1]]);
      }
    } catch {
      // Storage deletion is best-effort
    }

    return NextResponse.json({ branding });
  } catch (err) {
    console.error("Hero delete failed:", err);
    return NextResponse.json(
      { error: "Failed to remove hero image" },
      { status: 500 },
    );
  }
}
