"use client";

import { useState } from "react";
import { ProgressCircle } from "@/components/tremor/ProgressCircle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import type { FundraisingGoal, FundraisingHistory } from "@/lib/types";

interface FundraisingWidgetProps {
  fundraising: FundraisingGoal | null;
  fundraisingHistory: FundraisingHistory[];
  isAdmin: boolean;
  onFundraisingUpdate: (goal: FundraisingGoal) => void;
  onRequestReimbursement: () => void;
}

export default function FundraisingWidget({
  fundraising,
  fundraisingHistory,
  isAdmin,
  onFundraisingUpdate,
  onRequestReimbursement,
}: FundraisingWidgetProps) {
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [budgetInput, setBudgetInput] = useState("");

  const fundraisingPct =
    (fundraising?.fundraising_goal || 0) > 0
      ? Math.round(((fundraising?.amount_raised || 0) / (fundraising?.fundraising_goal || 1)) * 100)
      : 0;

  return (
    <div className="h-full overflow-auto p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold" style={{ fontSize: "var(--widget-title-size)", color: "var(--widget-text-color)" }}>Current Month Goals</h3>
        {isAdmin && !editingGoal && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => {
              setGoalInput(String(fundraising?.fundraising_goal || 0));
              setBudgetInput(String(fundraising?.print_budget || 0));
              setEditingGoal(true);
            }}
            title="Edit goals"
          >
            <Icon name="edit" size={18} className="opacity-60" />
          </Button>
        )}
      </div>

      {editingGoal ? (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-text-muted">Fundraising Goal ($)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted">Print Budget ($)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const res = await fetch("/api/fundraising", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      fundraising_goal: parseFloat(goalInput) || 0,
                      print_budget: parseFloat(budgetInput) || 0,
                    }),
                  });
                  const json = await res.json();
                  if (json.goal) onFundraisingUpdate(json.goal);
                } catch {
                  /* silent */
                }
                setEditingGoal(false);
              }}
              className="flex-1"
            >
              Save
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setEditingGoal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <ProgressCircle value={fundraisingPct} radius={36} strokeWidth={6} variant="neutral" style={{ "--progress-color": "var(--widget-chart-fundraising)", "--track-color": "var(--widget-chart-fundraising-track)" } as React.CSSProperties}>
              <span className="font-semibold" style={{ fontSize: "var(--widget-metric-sm)", color: "var(--widget-text-color)" }}>{fundraisingPct}%</span>
            </ProgressCircle>
            <div>
              <p className="font-semibold" style={{ fontSize: "var(--widget-metric-lg)", color: "var(--widget-text-color)" }}>
                ${(fundraising?.amount_raised || 0).toLocaleString()}
              </p>
              {(fundraising?.fundraising_goal || 0) > 0 && (
                <p className="font-semibold mt-0.5" style={{ fontSize: "var(--widget-metric-sm)", color: "var(--widget-text-muted)" }}>
                  of ${(fundraising?.fundraising_goal || 0).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-black/5">
            <p className="font-semibold" style={{ fontSize: "var(--widget-label-size)", color: "var(--widget-text-color)" }}>Print Budget</p>
            <p className="font-semibold mt-1" style={{ fontSize: "var(--widget-metric-md)", color: "var(--widget-text-color)" }}>
              ${(fundraising?.print_budget || 0).toLocaleString()}
            </p>
          </div>
        </>
      )}

      <button
        onClick={onRequestReimbursement}
        className="widget-cta-btn mt-auto w-full rounded-sm text-white font-semibold cursor-pointer"
        style={{ backgroundColor: "var(--widget-btn-fundraising)", fontSize: "var(--widget-btn-label-size)", padding: "10px 0" }}
      >
        Request reimbursement
      </button>
    </div>
  );
}
