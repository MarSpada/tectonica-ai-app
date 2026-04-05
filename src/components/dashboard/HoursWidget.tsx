"use client";

import { SparkAreaChart } from "@/components/tremor/SparkChart";
import type { HoursWeekBucket } from "@/lib/types";

interface HoursWidgetProps {
  totalHours: number;
  weekHours: number;
  prevWeekHours: number;
  hoursHistory: HoursWeekBucket[];
  onLogHours: () => void;
  onShowDetail: () => void;
}

export default function HoursWidget({
  totalHours,
  weekHours,
  hoursHistory,
  onLogHours,
  onShowDetail,
}: HoursWidgetProps) {

  return (
    <div
      className="h-full overflow-hidden p-5 cursor-pointer hover:ring-2 hover:ring-gray-300 transition-all flex flex-col"
      onClick={onShowDetail}
      title="Click to see details"
    >
      <h3 className="font-bold mb-3" style={{ fontSize: "var(--widget-title-size)", color: "var(--widget-text-color)" }}>Hours Volunteered</h3>

      {hoursHistory.length > 1 && (
        <div className="mb-2">
          <SparkAreaChart
            data={hoursHistory}
            categories={["hours"]}
            index="week"
            colors={["emerald"]}
            className="h-12 w-full"
            style={{ "--spark-color": "var(--widget-chart-hours)" } as React.CSSProperties}
          />
        </div>
      )}

      <div className="flex items-baseline gap-1">
        <span className="font-semibold" style={{ fontSize: "var(--widget-metric-lg)", color: "var(--widget-text-color)" }}>{totalHours}</span>
        <span className="font-semibold" style={{ fontSize: "var(--widget-metric-lg)", color: "var(--widget-text-color)" }}>hrs.</span>
      </div>
      <div className="font-medium" style={{ fontSize: "var(--widget-list-secondary-size)", color: "var(--widget-text-muted)" }}>
        {weekHours > 0 ? `${weekHours} people` : "0 people"}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onLogHours();
        }}
        className="widget-cta-btn mt-auto w-full rounded-sm text-white font-semibold cursor-pointer"
        style={{ backgroundColor: "var(--widget-btn-hours)", fontSize: "var(--widget-btn-label-size)", padding: "8px 0" }}
      >
        Log hours
      </button>
    </div>
  );
}
