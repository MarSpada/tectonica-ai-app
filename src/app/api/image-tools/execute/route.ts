import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import {
  getOrgImageCredentials,
  executeImageTool,
  ImageToolError,
} from "@/lib/image-tools";
import { saveGeneratedImage } from "@/lib/image-save-utils";
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

  // Atomically check and consume one credit (prevents TOCTOU race condition)
  const { data: creditOk } = await supabase.rpc("check_and_increment_image_credits", {
    p_org_id: profile.org_id,
  });
  if (!creditOk) {
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

    // Credit already consumed atomically above via check_and_increment_image_credits

    const saved = await saveGeneratedImage(
      {
        externalUrl: imageResult.url,
        toolName: tool as ImageToolName,
        toolArgs: params ?? {},
        responseWidth: imageResult.width,
        responseHeight: imageResult.height,
      },
      supabase,
      user.id,
      profile.group_id
    );

    return NextResponse.json({
      url: saved.displayUrl,
      mediaItemId: saved.mediaItemId,
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
