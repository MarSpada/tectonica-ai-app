"use client";

import { useState } from "react";
import { ProgressCircle } from "@/components/tremor/ProgressCircle";
import { SparkAreaChart } from "@/components/tremor/SparkChart";
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
    <div className="h-full overflow-auto p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">Current Month Goal</h3>
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
            <ProgressCircle value={fundraisingPct} radius={36} strokeWidth={6} variant="neutral">
              <span className="text-xs font-semibold text-text-primary">{fundraisingPct}%</span>
            </ProgressCircle>
            <div>
              <p className="text-3xl font-semibold text-text-primary">
                ${fundraising?.amount_raised || 0}
              </p>
              {(fundraising?.fundraising_goal || 0) > 0 && (
                <p className="text-sm text-text-muted mt-0.5">
                  of ${fundraising?.fundraising_goal || 0}
                </p>
              )}
            </div>
          </div>

          {fundraisingHistory.length > 1 && (
            <div className="mt-4">
              <SparkAreaChart
                data={fundraisingHistory}
                categories={["raised"]}
                index="month"
                colors={["blue"]}
                className="h-12 w-full"
              />
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-black/5">
            <p className="text-sm text-text-muted">Print Budget</p>
            <p className="text-2xl font-semibold text-text-primary mt-1">
              ${fundraising?.print_budget || 0}
            </p>
          </div>
        </>
      )}

      <Button
        variant="outline"
        onClick={onRequestReimbursement}
        className="mt-auto self-stretch"
      >
        Request Reimbursement
      </Button>
    </div>
  );
}
