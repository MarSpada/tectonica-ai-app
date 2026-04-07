import { type NextRequest, NextResponse } from "next/server";
import { requireApiKey } from "@/lib/api-utils";
import { createServiceClient } from "@/lib/supabase/service";
import { renderLandingPage } from "@/lib/landing-page-utils";
import type { LandingPageBrief } from "@/lib/landing-page-utils";

/**
 * POST /api/tools/generate-landing-page
 *
 * Called by ChangeAgent (external bot platform), NOT by a user browser session.
 * Authenticates via static Bearer token (CHANGE_AGENT_API_KEY), not Supabase session.
 * Uses service role client to bypass RLS for branding fetch and landing page insert.
 *
 * Storage bucket "landing-pages" must be created manually in Supabase dashboard
 * as a PUBLIC bucket so generated HTML files are publicly accessible.
 */
export async function POST(request: NextRequest) {
  try {
    const authError = requireApiKey(request);
    if (authError) return authError;

    const body = await request.json();

    // Validate required fields
    const { headline, type, cta_label, cta_url, key_messages, urgency, group_id, org_id } = body;

    if (!headline || typeof headline !== "string") {
      return NextResponse.json({ error: "headline is required (string)" }, { status: 400 });
    }
    if (type !== "signup" && type !== "donate") {
      return NextResponse.json({ error: "type must be 'signup' or 'donate'" }, { status: 400 });
    }
    if (!cta_label || typeof cta_label !== "string") {
      return NextResponse.json({ error: "cta_label is required (string)" }, { status: 400 });
    }
    if (!cta_url || typeof cta_url !== "string") {
      return NextResponse.json({ error: "cta_url is required (string)" }, { status: 400 });
    }
    if (!Array.isArray(key_messages) || key_messages.length === 0) {
      return NextResponse.json({ error: "key_messages is required (non-empty array of strings)" }, { status: 400 });
    }
    if (!group_id || typeof group_id !== "string") {
      return NextResponse.json({ error: "group_id is required (UUID string)" }, { status: 400 });
    }
    if (!org_id || typeof org_id !== "string") {
      return NextResponse.json({ error: "org_id is required (UUID string)" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Fetch group branding — DB values override anything in the request
    const { data: branding } = await supabase
      .from("group_branding")
      .select("*")
      .eq("group_id", group_id)
      .maybeSingle();

    // Substitute [DEFAULT_CTA_URL] placeholder with group's configured default
    // cta_url falls back to '#' if default not configured — admin should set default_cta_url in Branding tab
    const resolvedCtaUrl = cta_url === "[DEFAULT_CTA_URL]"
      ? (branding?.default_cta_url || "#")
      : cta_url;

    const brief: LandingPageBrief = {
      headline,
      type,
      cta_label,
      cta_url: resolvedCtaUrl,
      key_messages: key_messages.filter((m: unknown) => typeof m === "string" && m.trim().length > 0),
      urgency: typeof urgency === "string" ? urgency : undefined,
      branding: {
        logo_url: branding?.logo_url ?? null,
        hero_image_url: branding?.hero_image_url ?? null,
        primary_color: branding?.primary_color ?? null,
        secondary_color: branding?.secondary_color ?? null,
        social_facebook: branding?.social_facebook ?? null,
        social_instagram: branding?.social_instagram ?? null,
        social_twitter: branding?.social_twitter ?? null,
        social_bluesky: branding?.social_bluesky ?? null,
      },
    };

    // Render HTML
    const html = renderLandingPage(brief);

    // Upload to Supabase Storage
    const pageId = crypto.randomUUID();
    const storagePath = `${group_id}/${pageId}.html`;

    const { error: uploadErr } = await supabase.storage
      .from("landing-pages")
      .upload(storagePath, html, {
        contentType: "text/html",
        upsert: false,
      });

    if (uploadErr) {
      console.error("Landing page upload error:", uploadErr);
      return NextResponse.json(
        { error: `Upload failed: ${uploadErr.message}` },
        { status: 500 },
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("landing-pages")
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // Insert record into group_landing_pages
    const { data: landingPage, error: dbError } = await supabase
      .from("group_landing_pages")
      .insert({
        group_id,
        org_id,
        created_by: null,
        headline,
        type,
        public_url: publicUrl,
        status: "live",
      })
      .select()
      .single();

    if (dbError) {
      console.error("Landing page DB insert error:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({
      url: publicUrl,
      landing_page_id: landingPage.id,
    });
  } catch (err) {
    console.error("Generate landing page failed:", err);
    return NextResponse.json(
      { error: "Failed to generate landing page" },
      { status: 500 },
    );
  }
}
