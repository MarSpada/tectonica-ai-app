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
    <div className="h-full overflow-auto p-6">
      <h3 className="text-sm font-semibold text-text-primary mb-4">Recruitment Goal</h3>
      <div className="flex gap-8 justify-center">
        <div className="flex flex-col items-center">
          <ProgressCircle value={memberPct} radius={36} strokeWidth={6} variant="default">
            <span className="text-base font-semibold text-text-primary">{memberCount}</span>
          </ProgressCircle>
          <p className="text-sm font-medium text-text-primary mt-2">Members</p>
          <p className="text-xs text-text-muted">of 18</p>
        </div>
        <div className="flex flex-col items-center">
          <ProgressCircle value={supporterPct} radius={36} strokeWidth={6} variant="success">
            <span className="text-base font-semibold text-text-primary">{supporterCount}</span>
          </ProgressCircle>
          <p className="text-sm font-medium text-text-primary mt-2">Supporters</p>
          <p className="text-xs text-text-muted">of 25</p>
        </div>
      </div>
    </div>
  );
}
