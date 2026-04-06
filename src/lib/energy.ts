// Energy consumption estimation for AI-generated images
// Based on: "Energy Scaling Laws for Diffusion Models" (Stanford University & AXA, 2025)
//
// Reference points from the paper:
//   512 x 512  (~262,144 pixels) -> ~0.051 Wh
//   1024 x 1024 (~1,048,576 pixels) -> ~3.58 Wh
//
// Interpolation: linear by total pixel count between the two anchors.
// All constants are named so they can be updated as better data becomes available.

// ────────────────────────────────────────────────────────────
// Reference anchors
// ────────────────────────────────────────────────────────────

/** Pixels in the low reference image (512 x 512) */
const REF_LOW_PIXELS = 512 * 512; // 262_144

/** Energy in Wh for the low reference image */
const REF_LOW_WH = 0.051;

/** Pixels in the high reference image (1024 x 1024) */
const REF_HIGH_PIXELS = 1024 * 1024; // 1_048_576

/** Energy in Wh for the high reference image */
const REF_HIGH_WH = 3.58;

// ────────────────────────────────────────────────────────────
// Comparison rates
// ────────────────────────────────────────────────────────────

/** Wh per Google search (approximate) */
const WH_PER_SEARCH = 0.3;

/** Wh for a full smartphone charge */
const WH_PER_FULL_CHARGE = 10;

/** Watts consumed by a standard LED bulb */
const LED_BULB_WATTS = 10;

// ────────────────────────────────────────────────────────────
// Calculation
// ────────────────────────────────────────────────────────────

/**
 * Estimate the energy consumed to generate an image at the given dimensions.
 * Uses linear interpolation between the two Stanford/AXA reference points.
 * Extrapolates for images larger than 1024x1024 or smaller than 512x512.
 */
export function calculateEnergyWh(width: number, height: number): number {
  const pixels = width * height;

  // Linear interpolation: y = y0 + (x - x0) * (y1 - y0) / (x1 - x0)
  const wh =
    REF_LOW_WH +
    ((pixels - REF_LOW_PIXELS) * (REF_HIGH_WH - REF_LOW_WH)) /
      (REF_HIGH_PIXELS - REF_LOW_PIXELS);

  // Clamp to a minimum of 0 (negative energy makes no physical sense)
  return Math.max(0, Math.round(wh * 1000) / 1000);
}

// ────────────────────────────────────────────────────────────
// Human-readable comparisons
// ────────────────────────────────────────────────────────────

export type ComparisonMode = "searches" | "phone" | "led";

export const COMPARISON_LABELS: Record<ComparisonMode, string> = {
  searches: "Google searches",
  phone: "Smartphone charge",
  led: "LED bulb (10W)",
};

/**
 * Format an energy value as a human-readable comparison.
 */
export function formatEnergyComparison(
  wh: number,
  mode: ComparisonMode
): string {
  switch (mode) {
    case "searches": {
      const count = wh / WH_PER_SEARCH;
      if (count < 1) return `${(count * 100).toFixed(0)}% of one Google search`;
      return `~${count.toFixed(1)} Google searches`;
    }
    case "phone": {
      const minutes = (wh / WH_PER_FULL_CHARGE) * 60;
      if (minutes < 1) return `${(minutes * 60).toFixed(0)} seconds of phone charging`;
      return `~${minutes.toFixed(1)} min of phone charging`;
    }
    case "led": {
      // 1 Wh at 10W = 0.1 hours = 6 minutes
      const minutes = (wh / LED_BULB_WATTS) * 60;
      if (minutes < 1) return `${(minutes * 60).toFixed(0)} seconds of LED light`;
      return `~${minutes.toFixed(1)} min of LED light`;
    }
  }
}

/**
 * Format Wh for display — e.g. "0.051 Wh" or "3.58 Wh"
 */
export function formatWh(wh: number): string {
  if (wh < 0.01) return `${(wh * 1000).toFixed(1)} mWh`;
  if (wh < 1) return `${wh.toFixed(3)} Wh`;
  return `${wh.toFixed(2)} Wh`;
}

// ────────────────────────────────────────────────────────────
// Disclaimer
// ────────────────────────────────────────────────────────────

export const ENERGY_DISCLAIMER =
  "Energy costs for AI image generation fluctuate depending on model, infrastructure, and resolution, and are not disclosed by providers. These estimates are based on the Stanford/AXA report Energy Scaling Laws for Diffusion Models (2025). Actual consumption may vary.";
