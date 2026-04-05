"use client";

import { ProgressCircle } from "@/components/tremor/ProgressCircle";
import type { FundraisingGoal, FundraisingHistory, GroupGoals } from "@/lib/types";

interface FundraisingWidgetProps {
  fundraising: FundraisingGoal | null;
  groupGoals: GroupGoals | null;
  fundraisingHistory: FundraisingHistory[];
  onRequestReimbursement: () => void;
}

export default function FundraisingWidget({
  fundraising,
  groupGoals,
  onRequestReimbursement,
}: FundraisingWidgetProps) {
  const moneyGoal = groupGoals?.money_goal || 0;
  const moneyBudget = groupGoals?.money_budget || 0;
  const offlineAmount = groupGoals?.money_raised_offline || 0;
  const onlineRaised = fundraising?.amount_raised || 0;
  const totalRaised = onlineRaised + offlineAmount;

  const fundraisingPct = moneyGoal > 0
    ? Math.min(Math.round((totalRaised / moneyGoal) * 100), 100)
    : 0;

  return (
    <div className="h-full overflow-auto p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold" style={{ fontSize: "var(--widget-title-size)", color: "var(--widget-text-color)" }}>Current Month Goals</h3>
      </div>

      <div className="flex items-center gap-4">
        <ProgressCircle value={fundraisingPct} radius={36} strokeWidth={6} variant="neutral" style={{ "--progress-color": "var(--widget-chart-fundraising)", "--track-color": "var(--widget-chart-fundraising-track)" } as React.CSSProperties}>
          <span className="font-semibold" style={{ fontSize: "var(--widget-metric-sm)", color: "var(--widget-text-color)" }}>
            {moneyGoal > 0 ? `${fundraisingPct}%` : `$${totalRaised.toLocaleString()}`}
          </span>
        </ProgressCircle>
        <div>
          <p className="font-semibold" style={{ fontSize: "var(--widget-metric-lg)", color: "var(--widget-text-color)" }}>
            ${totalRaised.toLocaleString()}
          </p>
          {moneyGoal > 0 && (
            <p className="font-semibold mt-0.5" style={{ fontSize: "var(--widget-metric-sm)", color: "var(--widget-text-muted)" }}>
              of ${moneyGoal.toLocaleString()}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-black/5">
        <p className="font-semibold" style={{ fontSize: "var(--widget-label-size)", color: "var(--widget-text-color)" }}>Print Budget</p>
        <p className="font-semibold mt-1" style={{ fontSize: "var(--widget-metric-md)", color: "var(--widget-text-color)" }}>
          ${moneyBudget.toLocaleString()}
        </p>
      </div>

      <button
        onClick={onRequestReimbursement}
        className="widget-cta-btn mt-auto w-full rounded-sm text-white font-semibold cursor-pointer"
        style={{ backgroundColor: "var(--widget-btn-fundraising)", fontSize: "var(--widget-btn-label-size)", padding: "8px 0" }}
      >
        Request reimbursement
      </button>
    </div>
  );
}
