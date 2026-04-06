"use client";

import { useState } from "react";
import {
  formatEnergyComparison,
  formatWh,
  ENERGY_DISCLAIMER,
  COMPARISON_LABELS,
} from "@/lib/energy";
import type { ComparisonMode } from "@/lib/energy";

interface EnergyEstimateProps {
  width: number;
  height: number;
  energyWh: number;
}

const MODES: ComparisonMode[] = ["searches", "phone", "led"];

export default function EnergyEstimate({
  width,
  height,
  energyWh,
}: EnergyEstimateProps) {
  const [open, setOpen] = useState(false);
  const [modeIndex, setModeIndex] = useState(0);

  const mode = MODES[modeIndex];

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 w-full px-3 py-2 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
      >
        <span className="text-amber-500">&#9889;</span>
        <span>Energy estimate</span>
        <svg
          className={`ml-auto w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 4.5L6 7.5L9 4.5" />
        </svg>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2.5">
          {/* Energy value */}
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              {width} x {height} px
            </span>
            <span className="font-medium">{formatWh(energyWh)}</span>
          </div>

          {/* Comparison toggle */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setModeIndex((modeIndex + 1) % MODES.length)}
              className="text-xs text-left w-full px-2 py-1.5 rounded bg-muted/50 hover:bg-muted transition-colors"
            >
              <span className="text-muted-foreground">
                {COMPARISON_LABELS[mode]}:
              </span>{" "}
              <span className="font-medium">
                {formatEnergyComparison(energyWh, mode)}
              </span>
            </button>
            <p className="text-[10px] text-muted-foreground/60 text-center">
              Click to toggle comparison
            </p>
          </div>

          {/* Disclaimer */}
          <p className="text-[10px] leading-relaxed text-muted-foreground/70">
            {ENERGY_DISCLAIMER}
          </p>
        </div>
      )}
    </div>
  );
}
