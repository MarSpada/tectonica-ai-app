"use client";

import { ProgressCircle } from "@/components/tremor/ProgressCircle";

interface RecruitmentGoalWidgetProps {
  memberCount: number;
  supporterCount: number;
  membersGoal: number;
  supportersGoal: number;
}

export default function RecruitmentGoalWidget({ memberCount, supporterCount, membersGoal, supportersGoal }: RecruitmentGoalWidgetProps) {
  const memberPct = membersGoal > 0 ? Math.min(Math.round((memberCount / membersGoal) * 100), 100) : 0;
  const supporterPct = supportersGoal > 0 ? Math.min(Math.round((supporterCount / supportersGoal) * 100), 100) : 0;

  return (
    <div className="h-full overflow-auto p-5">
      <h3 className="font-bold mb-4" style={{ fontSize: "var(--widget-title-size)", color: "var(--widget-text-color)" }}>Recruitment Goals</h3>
      <div className="flex gap-8 justify-center">
        <div className="flex flex-col items-center">
          <ProgressCircle value={memberPct} radius={36} strokeWidth={6} variant="default" style={{ "--progress-color": "var(--widget-chart-members)", "--track-color": "var(--widget-chart-members-track)" } as React.CSSProperties}>
            <span className="font-semibold" style={{ fontSize: "var(--widget-metric-sm)", color: "var(--widget-text-color)" }}>
              {membersGoal > 0 ? `${memberPct}%` : memberCount}
            </span>
          </ProgressCircle>
          <p className="font-semibold mt-2" style={{ fontSize: "var(--widget-label-size)", color: "var(--widget-text-color)" }}>Members</p>
          {membersGoal > 0 && (
            <p className="font-medium" style={{ fontSize: "var(--widget-list-secondary-size)", color: "var(--widget-text-muted)" }}>of {membersGoal}</p>
          )}
        </div>
        <div className="flex flex-col items-center">
          <ProgressCircle value={supporterPct} radius={36} strokeWidth={6} variant="success" style={{ "--progress-color": "var(--widget-chart-supporters)", "--track-color": "var(--widget-chart-supporters-track)" } as React.CSSProperties}>
            <span className="font-semibold" style={{ fontSize: "var(--widget-metric-sm)", color: "var(--widget-text-color)" }}>
              {supportersGoal > 0 ? `${supporterPct}%` : supporterCount}
            </span>
          </ProgressCircle>
          <p className="font-semibold mt-2" style={{ fontSize: "var(--widget-label-size)", color: "var(--widget-text-color)" }}>Supporters</p>
          {supportersGoal > 0 && (
            <p className="font-medium" style={{ fontSize: "var(--widget-list-secondary-size)", color: "var(--widget-text-muted)" }}>of {supportersGoal}</p>
          )}
        </div>
      </div>
    </div>
  );
}
