import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import { isSuperAdmin } from "@/lib/constants/roles";

/**
 * GET /api/admin/branding
 * Returns group_branding row for the authenticated user's group.
 * If no row exists, returns all fields as null with 200 status.
 */
export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { profile, supabase } = auth;

    if (!profile.group_id) {
      return NextResponse.json({ error: "No group assigned" }, { status: 400 });
    }

    const { data: branding, error } = await supabase
      .from("group_branding")
      .select("*")
      .eq("group_id", profile.group_id)
      .maybeSingle();

    if (error) {
      console.error("Branding fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return null fields if no branding row exists yet
    if (!branding) {
      return NextResponse.json({
        branding: {
          id: null,
          group_id: profile.group_id,
          org_id: profile.org_id,
          logo_url: null,
          hero_image_url: null,
          primary_color: null,
          secondary_color: null,
          default_cta_url: null,
          social_facebook: null,
          social_instagram: null,
          social_twitter: null,
          social_bluesky: null,
          created_at: null,
          updated_at: null,
        },
      });
    }

    return NextResponse.json({ branding });
  } catch (err) {
    console.error("Branding GET failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch branding" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/admin/branding
 * Super admin only. Upserts group branding fields.
 * Body: { primary_color?, secondary_color?, default_cta_url?,
 *         social_facebook?, social_instagram?, social_twitter?, social_bluesky? }
 */
export async function PATCH(request: Request) {
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
    const allowedFields = [
      "primary_color",
      "secondary_color",
      "default_cta_url",
      "social_facebook",
      "social_instagram",
      "social_twitter",
      "social_bluesky",
    ] as const;

    const updateFields: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // Allow null or string values
        if (body[field] !== null && typeof body[field] !== "string") {
          return NextResponse.json(
            { error: `${field} must be a string or null` },
            { status: 400 },
          );
        }
        updateFields[field] = body[field];
      }
    }

    const { data: branding, error } = await supabase
      .from("group_branding")
      .upsert(
        {
          group_id: profile.group_id,
          org_id: profile.org_id,
          ...updateFields,
        },
        { onConflict: "group_id" },
      )
      .select()
      .single();

    if (error) {
      console.error("Branding update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ branding });
  } catch (err) {
    console.error("Branding PATCH failed:", err);
    return NextResponse.json(
      { error: "Failed to update branding" },
      { status: 500 },
    );
  }
}
