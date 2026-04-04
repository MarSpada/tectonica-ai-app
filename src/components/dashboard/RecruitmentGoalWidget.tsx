"use client";

import { ProgressCircle } from "@/components/tremor/ProgressCircle";

interface RecruitmentGoalWidgetProps {
  memberCount: number;
  supporterCount: number;
}

export default function RecruitmentGoalWidget({ memberCount, supporterCount }: RecruitmentGoalWidgetProps) {
  const memberPct = Math.round((memberCount / 18) * 100);
  const supporterPct = Math.round((supporterCount / 25) * 100);

  return (
    <div className="h-full overflow-auto p-5">
      <h3 className="font-bold mb-4" style={{ fontSize: "var(--widget-title-size)", color: "var(--widget-text-color)" }}>Recruitment Goals</h3>
      <div className="flex gap-8 justify-center">
        <div className="flex flex-col items-center">
          <ProgressCircle value={memberPct} radius={36} strokeWidth={6} variant="default" style={{ "--progress-color": "var(--widget-chart-members)", "--track-color": "var(--widget-chart-members-track)" } as React.CSSProperties}>
            <span className="font-semibold" style={{ fontSize: "var(--widget-metric-sm)", color: "var(--widget-text-color)" }}>{memberPct}%</span>
          </ProgressCircle>
          <p className="font-semibold mt-2" style={{ fontSize: "var(--widget-label-size)", color: "var(--widget-text-color)" }}>Members</p>
          <p className="font-medium" style={{ fontSize: "var(--widget-list-secondary-size)", color: "var(--widget-text-muted)" }}>of 18</p>
        </div>
        <div className="flex flex-col items-center">
          <ProgressCircle value={supporterPct} radius={36} strokeWidth={6} variant="success" style={{ "--progress-color": "var(--widget-chart-supporters)", "--track-color": "var(--widget-chart-supporters-track)" } as React.CSSProperties}>
            <span className="font-semibold" style={{ fontSize: "var(--widget-metric-sm)", color: "var(--widget-text-color)" }}>{supporterPct}%</span>
          </ProgressCircle>
          <p className="font-semibold mt-2" style={{ fontSize: "var(--widget-label-size)", color: "var(--widget-text-color)" }}>Supporters</p>
          <p className="font-medium" style={{ fontSize: "var(--widget-list-secondary-size)", color: "var(--widget-text-muted)" }}>of 25</p>
        </div>
      </div>
    </div>
  );
}
