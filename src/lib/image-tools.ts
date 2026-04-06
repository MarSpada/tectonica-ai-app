// Image API provider: Railway (qwen-image-editor)
// Credentials stored encrypted in org_integrations table
// ⚠️ ROTATE BEFORE PRODUCTION: token sk-j6gKait8TE8ZkV3LrNPPYDHEAvM8zqVN was exposed during testing
// All four Railway endpoints share the same base URL and bearer token
// Endpoint paths: /create, /edit, /combine, /apply (see RAILWAY_ENDPOINTS constant)
//
// This is the ONLY file that calls the Railway image API.
// Mirrors the pattern of lib/media-storage.ts — never import or call
// Railway image endpoints directly from components or API routes.

import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/encryption";
import type {
  ImageToolName,
  GenerateImageParams,
  EditImageParams,
  FuseImagesParams,
  ApplyBrandingParams,
  ImageToolErrorCode,
} from "@/lib/types";

// ────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────

export const RAILWAY_ENDPOINTS = {
  generate: "/api/external/flux-2-pro-edit-create",
  edit: "/api/external/flux-2-pro-edit-edit",
  fuse: "/api/external/flux-2-pro-edit-combine",
  brand: "/api/external/flux-2-pro-edit-apply",
  upload: "/api/external/upload-image",
} as const;

/** Platform + publication type → { width, height } */
export const IMAGE_PLATFORM_SIZES: Record<string, { width: number; height: number }> = {
  // Instagram
  "instagram_story": { width: 1080, height: 1920 },
  "instagram_post": { width: 1080, height: 1080 },
  "instagram_feed": { width: 1080, height: 1080 },
  "instagram_reel": { width: 1080, height: 1920 },
  "instagram_profile": { width: 320, height: 320 },
  // Facebook
  "facebook_post": { width: 1200, height: 630 },
  "facebook_story": { width: 1080, height: 1920 },
  "facebook_cover": { width: 820, height: 312 },
  "facebook_feed": { width: 1200, height: 630 },
  "facebook_event": { width: 1920, height: 1005 },
  "facebook_profile": { width: 170, height: 170 },
  // Twitter / X
  "twitter_post": { width: 1200, height: 675 },
  "twitter_header": { width: 1500, height: 500 },
  "twitter_profile": { width: 400, height: 400 },
  "x_post": { width: 1200, height: 675 },
  "x_header": { width: 1500, height: 500 },
  // LinkedIn
  "linkedin_post": { width: 1200, height: 627 },
  "linkedin_cover": { width: 1128, height: 191 },
  "linkedin_story": { width: 1080, height: 1920 },
  "linkedin_profile": { width: 400, height: 400 },
  // Print
  "flyer_letter": { width: 2550, height: 3300 },
  "flyer_a4": { width: 2480, height: 3508 },
  "flyer_half": { width: 2550, height: 1650 },
  "poster_18x24": { width: 5400, height: 7200 },
  "poster_24x36": { width: 7200, height: 10800 },
  "poster_11x17": { width: 3300, height: 5100 },
  // General
  "square": { width: 1080, height: 1080 },
  "landscape": { width: 1920, height: 1080 },
  "portrait": { width: 1080, height: 1920 },
  "banner": { width: 1920, height: 480 },
};

const ASPECT_RATIO_MAP: Record<string, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "4:3": { width: 1024, height: 768 },
  "3:4": { width: 768, height: 1024 },
  "16:9": { width: 1024, height: 576 },
  "9:16": { width: 576, height: 1024 },
  "21:9": { width: 1024, height: 439 },
};

// ────────────────────────────────────────────────────────────
// Error class
// ────────────────────────────────────────────────────────────

export class ImageToolError extends Error {
  code: ImageToolErrorCode;
  constructor(code: ImageToolErrorCode, message: string) {
    super(message);
    this.name = "ImageToolError";
    this.code = code;
  }
}

// ────────────────────────────────────────────────────────────
// Credentials
// ────────────────────────────────────────────────────────────

export interface OrgImageCredentials {
  endpoint: string;
  bearerToken: string;
  creditsAllocated: number;
  creditsUsed: number;
}

export async function getOrgImageCredentials(
  orgId: string
): Promise<OrgImageCredentials | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("org_integrations")
    .select(
      "image_api_endpoint, image_api_bearer_token, image_api_credits_allocated, image_api_credits_used"
    )
    .eq("org_id", orgId)
    .single();

  if (!data?.image_api_endpoint) {
    return null;
  }

  let token = "";
  if (data.image_api_bearer_token) {
    try {
      token = decrypt(data.image_api_bearer_token);
    } catch {
      // Token decryption failed — proceed without auth
    }
  }

  return {
    endpoint: data.image_api_endpoint.replace(/\/+$/, ""),
    bearerToken: token,
    creditsAllocated: data.image_api_credits_allocated,
    creditsUsed: data.image_api_credits_used,
  };
}

// ────────────────────────────────────────────────────────────
// Credit tracking
// ────────────────────────────────────────────────────────────

export async function incrementImageCredits(orgId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("increment_image_credits", { p_org_id: orgId });
}

// ────────────────────────────────────────────────────────────
// Size resolution
// ────────────────────────────────────────────────────────────

function resolveDimensions(
  platform?: string,
  publicationType?: string,
  aspectRatio?: string
): { width: number; height: number } | undefined {
  // Try platform + publication_type lookup first
  if (platform && publicationType) {
    const key = `${platform.toLowerCase()}_${publicationType.toLowerCase()}`;
    if (IMAGE_PLATFORM_SIZES[key]) return IMAGE_PLATFORM_SIZES[key];
  }

  // Try platform alone with common defaults
  if (platform) {
    const key = `${platform.toLowerCase()}_post`;
    if (IMAGE_PLATFORM_SIZES[key]) return IMAGE_PLATFORM_SIZES[key];
  }

  // Try aspect ratio
  if (aspectRatio && ASPECT_RATIO_MAP[aspectRatio]) {
    return ASPECT_RATIO_MAP[aspectRatio];
  }

  return undefined;
}

/** Valid presets accepted by the Railway/fal.ai API */
const FAL_SIZE_PRESETS = [
  "square_hd", "square", "portrait_4_3", "portrait_16_9",
  "landscape_4_3", "landscape_16_9",
] as const;

/** Map aspect ratios to fal.ai preset names */
const ASPECT_TO_FAL_PRESET: Record<string, string> = {
  "1:1": "square_hd",
  "4:3": "landscape_4_3",
  "3:4": "portrait_4_3",
  "16:9": "landscape_16_9",
  "9:16": "portrait_16_9",
};

/**
 * Resolves image size to a format the Railway API accepts:
 * either a preset string or a {width, height} object.
 */
function resolveImageSize(
  platform?: string,
  publicationType?: string,
  aspectRatio?: string
): string | { width: number; height: number } {
  // Try aspect ratio → fal preset mapping first
  if (aspectRatio && ASPECT_TO_FAL_PRESET[aspectRatio]) {
    return ASPECT_TO_FAL_PRESET[aspectRatio];
  }

  // Try platform dimensions → {width, height} object
  const dims = resolveDimensions(platform, publicationType, aspectRatio);
  if (dims) {
    return { width: dims.width, height: dims.height };
  }

  // Default to square
  return "square_hd";
}

// ────────────────────────────────────────────────────────────
// Railway API calls
// ────────────────────────────────────────────────────────────

async function callRailway(
  credentials: OrgImageCredentials,
  endpointPath: string,
  body: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const url = `${credentials.endpoint}${endpointPath}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  // Only send Authorization if a bearer token is configured
  if (credentials.bearerToken) {
    headers.Authorization = `Bearer ${credentials.bearerToken}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000), // 2 min timeout for image generation
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new ImageToolError(
      "api_error",
      `Railway API error (${res.status}): ${errText}`
    );
  }

  return res.json() as Promise<Record<string, unknown>>;
}

function extractImageUrl(result: Record<string, unknown>): string {
  // Railway API returns images array: { images: [{ url, width, height }] }
  const images = result.images as Array<{ url: string }> | undefined;
  if (images && images.length > 0 && images[0].url) {
    return images[0].url;
  }

  // Fallback: try other common fields
  const url =
    (result.url as string) ||
    (result.image_url as string) ||
    (result.output_url as string) ||
    (result.result as string);

  if (!url || typeof url !== "string") {
    throw new ImageToolError("api_error", "No image URL in Railway response");
  }
  return url;
}

// ────────────────────────────────────────────────────────────
// Public API functions
// ────────────────────────────────────────────────────────────

export async function uploadImageToRailway(
  base64: string,
  credentials: OrgImageCredentials
): Promise<{ url: string }> {
  const result = await callRailway(credentials, RAILWAY_ENDPOINTS.upload, {
    image: base64,
  });
  return { url: extractImageUrl(result) };
}

export async function generateImage(
  params: GenerateImageParams,
  credentials: OrgImageCredentials
): Promise<{ url: string }> {
  const imageSize = resolveImageSize(
    params.platform,
    params.publication_type,
    params.aspect_ratio
  );

  const body: Record<string, unknown> = {
    prompt: params.prompt,
    settings: {
      image_size: imageSize,
      output_format: "jpeg",
    },
    ...(params.with_branding && { with_branding: true }),
    ...(params.image_url && { imageUrl: params.image_url }),
  };

  const result = await callRailway(
    credentials,
    RAILWAY_ENDPOINTS.generate,
    body
  );
  return { url: extractImageUrl(result) };
}

export async function editImage(
  params: EditImageParams,
  credentials: OrgImageCredentials
): Promise<{ url: string }> {
  const imageSize = resolveImageSize(undefined, undefined, params.aspect_ratio);

  const body: Record<string, unknown> = {
    prompt: params.instructions,
    imageUrl: params.image_url,
    settings: {
      image_size: imageSize,
      output_format: "jpeg",
    },
  };

  const result = await callRailway(credentials, RAILWAY_ENDPOINTS.edit, body);
  return { url: extractImageUrl(result) };
}

export async function fuseImages(
  params: FuseImagesParams,
  credentials: OrgImageCredentials
): Promise<{ url: string }> {
  const imageSize = resolveImageSize(undefined, undefined, params.aspect_ratio);

  const body: Record<string, unknown> = {
    image_url_1: params.image_url_1,
    image_url_2: params.image_url_2,
    ...(params.instructions && { prompt: params.instructions }),
    settings: {
      image_size: imageSize,
      output_format: "jpeg",
    },
    ...(params.use_style_reference && { use_style_reference: true }),
  };

  const result = await callRailway(credentials, RAILWAY_ENDPOINTS.fuse, body);
  return { url: extractImageUrl(result) };
}

export async function applyBranding(
  params: ApplyBrandingParams,
  credentials: OrgImageCredentials
): Promise<{ url: string }> {
  const imageSize = resolveImageSize(undefined, undefined, params.aspect_ratio);

  const body: Record<string, unknown> = {
    image_url: params.image_url,
    ...(params.branding_style && { branding_style: params.branding_style }),
    settings: {
      image_size: imageSize,
      output_format: "jpeg",
    },
  };

  const result = await callRailway(credentials, RAILWAY_ENDPOINTS.brand, body);
  return { url: extractImageUrl(result) };
}

// ────────────────────────────────────────────────────────────
// Dispatcher — calls the correct function by tool name
// ────────────────────────────────────────────────────────────

export async function executeImageTool(
  toolName: ImageToolName,
  toolArgs: Record<string, unknown>,
  credentials: OrgImageCredentials
): Promise<{ url: string }> {
  switch (toolName) {
    case "generate_image":
      return generateImage(
        { tool: "generate_image", prompt: toolArgs.prompt as string, ...toolArgs } as GenerateImageParams,
        credentials
      );
    case "edit_image":
      return editImage(
        { tool: "edit_image", instructions: toolArgs.instructions as string, image_url: toolArgs.image_url as string, ...toolArgs } as EditImageParams,
        credentials
      );
    case "fuse_images":
      return fuseImages(
        { tool: "fuse_images", image_url_1: toolArgs.image_url_1 as string, image_url_2: toolArgs.image_url_2 as string, ...toolArgs } as FuseImagesParams,
        credentials
      );
    case "apply_branding":
      return applyBranding(
        { tool: "apply_branding", image_url: toolArgs.image_url as string, ...toolArgs } as ApplyBrandingParams,
        credentials
      );
    default:
      throw new ImageToolError("api_error", `Unknown image tool: ${toolName}`);
  }
}
