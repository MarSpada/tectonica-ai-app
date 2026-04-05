"use client";

import { useState, useEffect, useCallback } from "react";
import type { GroupGoals } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@/components/ui/icon";
import { toast } from "sonner";

interface GoalsTabProps {
  groupId: string | null;
}

export default function GoalsTab({ groupId }: GoalsTabProps) {
  const [goals, setGoals] = useState<GroupGoals | null>(null);
  const [loading, setLoading] = useState(true);

  // Fundraising edit state
  const [editingFundraising, setEditingFundraising] = useState(false);
  const [moneyGoalInput, setMoneyGoalInput] = useState("");
  const [moneyBudgetInput, setMoneyBudgetInput] = useState("");
  const [offlineInput, setOfflineInput] = useState("");
  const [savingFundraising, setSavingFundraising] = useState(false);

  // Recruitment edit state
  const [editingRecruitment, setEditingRecruitment] = useState(false);
  const [membersGoalInput, setMembersGoalInput] = useState("");
  const [supportersGoalInput, setSupportersGoalInput] = useState("");
  const [savingRecruitment, setSavingRecruitment] = useState(false);

  const fetchGoals = useCallback(async () => {
    if (!groupId) return;
    try {
      const res = await fetch("/api/goals");
      const json = await res.json();
      if (json.goals) setGoals(json.goals);
    } catch {
      // Goals unavailable
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  async function handleSaveFundraising() {
    setSavingFundraising(true);
    try {
      const res = await fetch("/api/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          money_goal: parseInt(moneyGoalInput) || 0,
          money_budget: parseInt(moneyBudgetInput) || 0,
          money_raised_offline: parseInt(offlineInput) || 0,
        }),
      });
      const json = await res.json();
      if (res.ok && json.goals) {
        setGoals(json.goals);
        setEditingFundraising(false);
        toast.success("Fundraising goals saved");
      } else {
        toast.error(json.error || "Failed to save");
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setSavingFundraising(false);
    }
  }

  async function handleSaveRecruitment() {
    setSavingRecruitment(true);
    try {
      const res = await fetch("/api/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          members_goal: parseInt(membersGoalInput) || 0,
          supporters_goal: parseInt(supportersGoalInput) || 0,
        }),
      });
      const json = await res.json();
      if (res.ok && json.goals) {
        setGoals(json.goals);
        setEditingRecruitment(false);
        toast.success("Recruitment goals saved");
      } else {
        toast.error(json.error || "Failed to save");
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setSavingRecruitment(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-8 max-w-3xl">
        <div className="bg-card-bg rounded-xl border border-card-stroke p-5 space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="bg-card-bg rounded-xl border border-card-stroke p-5 space-y-3">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Fundraising Goals */}
      <section className="bg-card-bg rounded-xl border border-card-stroke p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary">
            Fundraising Goals
          </h2>
          {!editingFundraising && (
            <Button
              variant="link"
              onClick={() => {
                setMoneyGoalInput(String(goals?.money_goal || 0));
                setMoneyBudgetInput(String(goals?.money_budget || 0));
                setOfflineInput(String(goals?.money_raised_offline || 0));
                setEditingFundraising(true);
              }}
            >
              Edit
            </Button>
          )}
        </div>

        {editingFundraising ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-text-muted mb-1 block">
                Monthly Fundraising Target ($)
              </label>
              <Input
                type="number"
                min="0"
                value={moneyGoalInput}
                onChange={(e) => setMoneyGoalInput(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Escape") setEditingFundraising(false);
                }}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-muted mb-1 block">
                Monthly Print Budget ($)
              </label>
              <Input
                type="number"
                min="0"
                value={moneyBudgetInput}
                onChange={(e) => setMoneyBudgetInput(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-muted mb-1 block">
                Offline Fundraising to Date ($)
              </label>
              <Input
                type="number"
                min="0"
                value={offlineInput}
                onChange={(e) => setOfflineInput(e.target.value)}
              />
              <p className="text-xs text-text-muted mt-1">
                This amount is added to online fundraising when displaying progress for the current month.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleSaveFundraising} disabled={savingFundraising}>
                {savingFundraising ? "Saving..." : "Save"}
              </Button>
              <Button variant="ghost" onClick={() => setEditingFundraising(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-black/[0.02] border border-black/5">
              <span className="text-xs text-text-muted">Monthly Fundraising Target</span>
              <span className="text-sm font-medium text-text-primary">
                ${(goals?.money_goal || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-black/[0.02] border border-black/5">
              <span className="text-xs text-text-muted">Monthly Print Budget</span>
              <span className="text-sm font-medium text-text-primary">
                ${(goals?.money_budget || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-black/[0.02] border border-black/5">
              <div>
                <span className="text-xs text-text-muted">Offline Fundraising to Date</span>
                <p className="text-[10px] text-text-muted mt-0.5">Offsets displayed monthly total</p>
              </div>
              <span className="text-sm font-medium text-text-primary">
                ${(goals?.money_raised_offline || 0).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Recruitment Goals */}
      <section className="bg-card-bg rounded-xl border border-card-stroke p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary">
            Recruitment Goals
          </h2>
          {!editingRecruitment && (
            <Button
              variant="link"
              onClick={() => {
                setMembersGoalInput(String(goals?.members_goal || 0));
                setSupportersGoalInput(String(goals?.supporters_goal || 0));
                setEditingRecruitment(true);
              }}
            >
              Edit
            </Button>
          )}
        </div>

        {editingRecruitment ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-text-muted mb-1 block">
                Member Recruitment Goal
              </label>
              <Input
                type="number"
                min="0"
                value={membersGoalInput}
                onChange={(e) => setMembersGoalInput(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Escape") setEditingRecruitment(false);
                }}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-muted mb-1 block">
                Supporter Recruitment Goal
              </label>
              <Input
                type="number"
                min="0"
                value={supportersGoalInput}
                onChange={(e) => setSupportersGoalInput(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleSaveRecruitment} disabled={savingRecruitment}>
                {savingRecruitment ? "Saving..." : "Save"}
              </Button>
              <Button variant="ghost" onClick={() => setEditingRecruitment(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-black/[0.02] border border-black/5">
              <span className="text-xs text-text-muted">Member Recruitment Goal</span>
              <span className="text-sm font-medium text-text-primary">
                {goals?.members_goal || 0}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-black/[0.02] border border-black/5">
              <span className="text-xs text-text-muted">Supporter Recruitment Goal</span>
              <span className="text-sm font-medium text-text-primary">
                {goals?.supporters_goal || 0}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Last updated info */}
      {goals?.updated_at && (
        <p className="text-xs text-text-muted">
          Last updated: {new Date(goals.updated_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      )}
    </div>
  );
}
