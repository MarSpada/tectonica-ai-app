// Shared image save utility — used by both chat/route.ts and image-tools/execute/route.ts
// Consolidates the download-store-dimension-energy-save pipeline that was duplicated.

import { downloadAndStoreImage, resolveDimensions } from "@/lib/image-tools";
import { getSignedUrl } from "@/lib/media-storage";
import { calculateEnergyWh } from "@/lib/energy";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ImageToolName } from "@/lib/types";

export interface SaveGeneratedImageParams {
  /** URL returned by the image generation API (e.g. FAL URL) */
  externalUrl: string;
  /** Image tool name that produced this image */
  toolName: ImageToolName;
  /** Tool arguments (used for dimension fallback resolution) */
  toolArgs: Record<string, unknown>;
  /** Width from API response, if available */
  responseWidth?: number;
  /** Height from API response, if available */
  responseHeight?: number;
}

export interface SaveGeneratedImageResult {
  /** Signed URL for display (Supabase Storage if available, else FAL URL) */
  displayUrl: string;
  /** Media item ID from media_items table, null if insert failed */
  mediaItemId: string | null;
  /** Energy consumption estimate in Wh, null if dimensions unknown */
  energyWh: number | null;
  /** Resolved image width */
  imageWidth: number | null;
  /** Resolved image height */
  imageHeight: number | null;
}

/**
 * Download a generated image from an external URL, store it in Supabase Storage,
 * resolve dimensions, calculate energy, and save to media_items.
 *
 * Returns the display URL (signed Supabase URL or FAL fallback) and media item ID.
 */
export async function saveGeneratedImage(
  params: SaveGeneratedImageParams,
  supabase: SupabaseClient,
  userId: string,
  groupId: string | null
): Promise<SaveGeneratedImageResult> {
  // Download from FAL and store in Supabase Storage
  let storagePath: string | null = null;
  let fileSize: number | null = null;
  let displayUrl = params.externalUrl; // fallback to FAL URL
  if (groupId) try {
    const stored = await downloadAndStoreImage(
      params.externalUrl,
      supabase,
      groupId
    );
    storagePath = stored.storagePath;
    fileSize = stored.fileSize;
    displayUrl = await getSignedUrl(supabase, storagePath);
  } catch (storeErr) {
    console.warn("Failed to store image in Supabase Storage, using FAL URL as fallback:", storeErr);
  }

  // Resolve dimensions: prefer API response, fall back to request params
  let imageWidth = params.responseWidth ?? null;
  let imageHeight = params.responseHeight ?? null;
  if (!imageWidth || !imageHeight) {
    const fallback = resolveDimensions(
      params.toolArgs.platform as string | undefined,
      params.toolArgs.publication_type as string | undefined,
      params.toolArgs.aspect_ratio as string | undefined
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

  // Save to media_items as private generated image
  const toolLabel = params.toolName.replace(/_/g, " ");
  const { data: mediaItem, error: insertError } = await supabase
    .from("media_items")
    .insert({
      group_id: groupId,
      uploaded_by: userId,
      category: "generated",
      file_name: `${params.toolName}-${Date.now()}.jpg`,
      url: params.externalUrl, // keep FAL URL as fallback
      storage_path: storagePath,
      file_size: fileSize,
      title: `${toolLabel} — ${new Date().toLocaleDateString()}`,
      status: "ready",
      visibility: "private",
      image_width: imageWidth,
      image_height: imageHeight,
      energy_wh: energyWh,
    })
    .select("id")
    .single();

  if (insertError) {
    console.warn("Failed to save generated image to media_items:", insertError.message);
  }

  return {
    displayUrl,
    mediaItemId: mediaItem?.id ?? null,
    energyWh,
    imageWidth,
    imageHeight,
  };
}
