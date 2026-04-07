import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import {
  getOrgImageCredentials,
  executeImageTool,
  ImageToolError,
} from "@/lib/image-tools";
import { saveGeneratedImage } from "@/lib/image-save-utils";
import { calculateImageCost, countInputImages } from "@/lib/billing-utils";
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

  // check_and_increment_image_credits removed — replaced by debit_image_credit RPC (billing-utils).
  // Old columns retained for now, marked for deprecation.

  try {
    const toolArgs = params ?? {};
    const imageResult = await executeImageTool(
      tool as ImageToolName,
      toolArgs,
      credentials
    );

    const saved = await saveGeneratedImage(
      {
        externalUrl: imageResult.url,
        toolName: tool as ImageToolName,
        toolArgs,
        responseWidth: imageResult.width,
        responseHeight: imageResult.height,
      },
      supabase,
      user.id,
      profile.group_id
    );

    // Fire-and-forget: debit group credits and log generation
    if (profile.group_id) {
      const inputCount = countInputImages(toolArgs);
      const cost = calculateImageCost(
        imageResult.width,
        imageResult.height,
        inputCount,
      );
      // fal_request_id not yet captured — wire in a future session by extending ImageResult.
      Promise.resolve(
        supabase.rpc("debit_image_credit", {
          p_group_id: profile.group_id,
          p_org_id: profile.org_id,
          p_user_id: user.id,
          p_fal_request_id: null,
          p_endpoint: credentials.endpoint,
          p_output_width: imageResult.width || 1024,
          p_output_height: imageResult.height || 1024,
          p_input_image_count: inputCount,
          p_mp_total: cost.outputMp + cost.inputMp,
          p_cost_usd: cost.totalCost,
        })
      )
        .then(({ error: debitErr }) => {
          if (debitErr) {
            console.error("debit_image_credit failed:", debitErr.message);
          }
        })
        .catch((err: unknown) => {
          console.error("debit_image_credit error:", err);
        });
    } else {
      console.warn("debit_image_credit skipped: groupId is null for user " + user.id);
    }

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
