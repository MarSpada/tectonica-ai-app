// billing-utils.ts
// Single source of truth for image generation cost calculation.
// No other file should reimplement this logic.

const DEFAULT_DIMENSION = 1024;
const DEFAULT_COST_PER_MP_BASE = 0.03;
const DEFAULT_COST_PER_MP_EXTRA = 0.015;

interface ImageCostResult {
  outputMp: number;
  inputMp: number;
  totalCost: number;
  usedFallbackDimensions: boolean;
}

/**
 * Calculate the USD cost of an image generation based on megapixels.
 *
 * - Output MP = ceil(outputPixels / 1,000,000), minimum 1
 * - Input MP = number of input images (one MP each)
 * - Total cost = (base rate × output MP) + (extra rate × input MP)
 *
 * // Simplified: treats each input image as 1MP. fal.ai actual billing may vary by input dimensions.
 *
 * If outputWidth or outputHeight is 0, null, or undefined, falls back to 1024
 * for the missing dimension and logs a warning.
 */
export function calculateImageCost(
  outputWidth: number | null | undefined,
  outputHeight: number | null | undefined,
  inputImageCount: number,
  costPerMpBase: number = DEFAULT_COST_PER_MP_BASE,
  costPerMpExtra: number = DEFAULT_COST_PER_MP_EXTRA,
): ImageCostResult {
  let usedFallbackDimensions = false;

  const w = outputWidth || DEFAULT_DIMENSION;
  const h = outputHeight || DEFAULT_DIMENSION;

  if (!outputWidth || !outputHeight) {
    console.warn(
      "calculateImageCost: missing dimensions, falling back to 1024. Result may be approximate.",
    );
    usedFallbackDimensions = true;
  }

  const outputMp = Math.max(1, Math.ceil((w * h) / 1_000_000));
  const inputMp = inputImageCount;
  const totalCost = parseFloat(
    (costPerMpBase * outputMp + costPerMpExtra * inputMp).toFixed(4),
  );

  return { outputMp, inputMp, totalCost, usedFallbackDimensions };
}

/**
 * Count the number of input images from tool arguments.
 * Each tool uses different field names for input image URLs.
 */
export function countInputImages(toolArgs: Record<string, unknown>): number {
  let count = 0;
  if (toolArgs.image_url) count++;
  if (toolArgs.image_url_1) count++;
  if (toolArgs.image_url_2) count++;
  return count;
}

/**
 * Format a USD credit balance for display.
 */
export function formatCredits(balanceUsd: number): string {
  return `$${balanceUsd.toFixed(2)}`;
}
