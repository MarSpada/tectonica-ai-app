import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import {
  getOrgImageCredentials,
  executeImageTool,
  incrementImageCredits,
  resolveDimensions,
  ImageToolError,
} from "@/lib/image-tools";
import { calculateEnergyWh } from "@/lib/energy";
import type { ImageToolName } from "@/lib/types";

const VALID_TOOLS: ImageToolName[] = [
  "generate_image",
  "edit_image",
  "fuse_images",
  "apply_branding",
];

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, profile, supabase } = auth;

  if (!profile.org_id) {
    return NextResponse.json({ error: "No organization" }, { status: 400 });
  }

  const { tool, params, botId } = await req.json();

  // Validate tool name
  if (!VALID_TOOLS.includes(tool)) {
    return NextResponse.json(
      { error: `Invalid tool: ${tool}` },
      { status: 400 }
    );
  }

  // Validate bot has image tools enabled — DB-driven, not hardcoded slug
  const { data: botRow } = await supabase
    .from("bots")
    .select("id, image_tools_enabled")
    .eq("slug", botId)
    .single();

  if (!botRow || !botRow.image_tools_enabled) {
    return NextResponse.json(
      { error: "This bot does not support image tools" },
      { status: 403 }
    );
  }

  // Check image API credentials
  const credentials = await getOrgImageCredentials(profile.org_id);
  if (!credentials) {
    return NextResponse.json(
      { error: "not_configured" },
      { status: 503 }
    );
  }

  // Check credit limit
  if (credentials.creditsUsed >= credentials.creditsAllocated) {
    return NextResponse.json(
      { error: "no_credits" },
      { status: 402 }
    );
  }

  try {
    const imageResult = await executeImageTool(
      tool as ImageToolName,
      params ?? {},
      credentials
    );

    // Resolve dimensions: prefer Railway response, fall back to request params
    let imageWidth = imageResult.width;
    let imageHeight = imageResult.height;
    if (!imageWidth || !imageHeight) {
      const fallback = resolveDimensions(
        params?.platform,
        params?.publication_type,
        params?.aspect_ratio
      );
      if (fallback) {
        imageWidth = fallback.width;
        imageHeight = fallback.height;
      }
    }

    // Calculate energy from dimensions
    const energyWh =
      imageWidth && imageHeight
        ? calculateEnergyWh(imageWidth, imageHeight)
        : null;

    // Increment credits
    await incrementImageCredits(profile.org_id);

    // Save to media_items as private generated image
    const toolLabel = (tool as string).replace(/_/g, " ");
    const { data: mediaItem, error: insertError } = await supabase
      .from("media_items")
      .insert({
        group_id: profile.group_id,
        uploaded_by: user.id,
        category: "generated",
        file_name: `${tool}-${Date.now()}.png`,
        url: imageResult.url,
        title: `${toolLabel} — ${new Date().toLocaleDateString()}`,
        status: "ready",
        visibility: "private",
        image_width: imageWidth ?? null,
        image_height: imageHeight ?? null,
        energy_wh: energyWh,
      })
      .select("id")
      .single();

    if (insertError) {
      console.warn("Failed to save generated image to media_items:", insertError.message);
    }

    return NextResponse.json({
      url: imageResult.url,
      mediaItemId: mediaItem?.id ?? null,
    });
  } catch (err) {
    if (err instanceof ImageToolError) {
      const statusMap: Record<string, number> = {
        not_configured: 503,
        no_credits: 402,
        api_error: 502,
        upload_error: 502,
      };
      return NextResponse.json(
        { error: err.message },
        { status: statusMap[err.code] ?? 500 }
      );
    }
    return NextResponse.json(
      { error: "Image generation failed" },
      { status: 500 }
    );
  }
}
