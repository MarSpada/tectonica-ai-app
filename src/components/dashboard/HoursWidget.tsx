"use client";

import { BadgeDelta } from "@/components/tremor/BadgeDelta";
import { SparkAreaChart } from "@/components/tremor/SparkChart";
import { Button } from "@/components/ui/button";
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
  prevWeekHours,
  hoursHistory,
  onLogHours,
  onShowDetail,
}: HoursWidgetProps) {
  const hoursDelta = weekHours - prevWeekHours;

  return (
    <div
      className="h-full overflow-auto p-6 cursor-pointer hover:ring-2 hover:ring-gray-300 transition-all flex flex-col"
      onClick={onShowDetail}
      title="Click to see details"
    >
      <h3 className="text-sm font-semibold text-text-primary mb-3">Hours Volunteered</h3>
      <div className="flex items-baseline gap-2.5">
        <span className="text-3xl font-semibold text-text-primary">{totalHours}</span>
        <span className="text-sm text-text-muted">hrs</span>
        {weekHours > 0 && <BadgeDelta value={hoursDelta} suffix=" this wk" />}
      </div>

      {hoursHistory.length > 1 && (
        <div className="mt-4">
          <SparkAreaChart
            data={hoursHistory}
            categories={["hours"]}
            index="week"
            colors={["emerald"]}
            className="h-12 w-full"
          />
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onLogHours();
        }}
        className="mt-auto self-start text-green-600 hover:text-green-700 px-0"
      >
        + Log hours
      </Button>
    </div>
  );
}
