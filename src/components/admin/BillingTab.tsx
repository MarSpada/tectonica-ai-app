"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatCredits } from "@/lib/billing-utils";

interface BillingData {
  credit_balance_usd: number;
  cost_per_mp_base: number;
  cost_per_mp_extra: number;
  platform_fee_percentage: number | null;
  month_spend_usd: number;
}

interface TopupEntry {
  id: string;
  amount_usd: number;
  note: string | null;
  created_at: string;
  added_by_name: string;
}

interface BillingTabProps {
  groupId: string | null;
}

export default function BillingTab({ groupId }: BillingTabProps) {
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [topups, setTopups] = useState<TopupEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Add credits form state
  const [topupAmount, setTopupAmount] = useState("");
  const [topupNote, setTopupNote] = useState("");
  const [addingCredits, setAddingCredits] = useState(false);

  // Rates edit state
  const [editingRates, setEditingRates] = useState(false);
  const [baseRateInput, setBaseRateInput] = useState("");
  const [extraRateInput, setExtraRateInput] = useState("");
  const [savingRates, setSavingRates] = useState(false);

  // Platform fee edit state
  const [editingFee, setEditingFee] = useState(false);
  const [feeInput, setFeeInput] = useState("");
  const [savingFee, setSavingFee] = useState(false);

  const fetchBilling = useCallback(async () => {
    if (!groupId) return;
    try {
      const [balanceRes, topupsRes] = await Promise.all([
        fetch("/api/billing/balance"),
        fetch("/api/admin/billing/topups"),
      ]);
      const balanceJson = await balanceRes.json();
      const topupsJson = await topupsRes.json();
      if (!balanceJson.error) setBilling(balanceJson);
      if (topupsJson.topups) setTopups(topupsJson.topups);
    } catch {
      // Billing data unavailable
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  async function handleAddCredits() {
    const amount = parseFloat(topupAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a positive amount");
      return;
    }
    setAddingCredits(true);
    try {
      const res = await fetch("/api/admin/billing/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_usd: amount,
          note: topupNote.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (res.ok && json.billing) {
        setBilling((prev) =>
          prev ? { ...prev, credit_balance_usd: json.billing.credit_balance_usd } : prev,
        );
        // Prepend new entry to history
        setTopups((prev) => [
          {
            id: crypto.randomUUID(),
            amount_usd: amount,
            note: topupNote.trim() || null,
            created_at: new Date().toISOString(),
            added_by_name: "You",
          },
          ...prev,
        ]);
        setTopupAmount("");
        setTopupNote("");
        toast.success(`Added ${formatCredits(amount)} in credits`);
      } else {
        toast.error(json.error || "Failed to add credits");
      }
    } catch {
      toast.error("Failed to add credits");
    } finally {
      setAddingCredits(false);
    }
  }

  async function handleSaveRates() {
    setSavingRates(true);
    try {
      const res = await fetch("/api/admin/billing/rates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cost_per_mp_base: parseFloat(baseRateInput) || 0,
          cost_per_mp_extra: parseFloat(extraRateInput) || 0,
        }),
      });
      const json = await res.json();
      if (res.ok && json.billing) {
        setBilling((prev) =>
          prev
            ? {
                ...prev,
                cost_per_mp_base: json.billing.cost_per_mp_base,
                cost_per_mp_extra: json.billing.cost_per_mp_extra,
              }
            : prev,
        );
        setEditingRates(false);
        toast.success("Rates saved");
      } else {
        toast.error(json.error || "Failed to save rates");
      }
    } catch {
      toast.error("Failed to save rates");
    } finally {
      setSavingRates(false);
    }
  }

  async function handleSaveFee() {
    setSavingFee(true);
    try {
      const feeValue = feeInput.trim() === "" ? null : parseFloat(feeInput) / 100;
      const res = await fetch("/api/admin/billing/rates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform_fee_percentage: feeValue,
        }),
      });
      const json = await res.json();
      if (res.ok && json.billing) {
        setBilling((prev) =>
          prev
            ? { ...prev, platform_fee_percentage: json.billing.platform_fee_percentage }
            : prev,
        );
        setEditingFee(false);
        toast.success("Platform fee saved");
      } else {
        toast.error(json.error || "Failed to save platform fee");
      }
    } catch {
      toast.error("Failed to save platform fee");
    } finally {
      setSavingFee(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-8 max-w-3xl">
        <div className="bg-card-bg rounded-xl border border-card-stroke p-5 space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="bg-card-bg rounded-xl border border-card-stroke p-5 space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    );
  }

  const balance = billing?.credit_balance_usd ?? 0;
  const monthSpend = billing?.month_spend_usd ?? 0;

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Credit Balance */}
      <section className="bg-card-bg rounded-xl border border-card-stroke p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-4">
          Credit Balance
        </h2>
        <p
          className={`text-3xl font-bold ${
            balance < 0
              ? "text-red-600"
              : balance < 1
                ? "text-amber-600"
                : "text-text-primary"
          }`}
        >
          {formatCredits(balance)}
        </p>
        <p className="text-xs text-text-muted mt-1">
          This month: {formatCredits(monthSpend)}
        </p>
      </section>

      {/* Add Credits */}
      <section className="bg-card-bg rounded-xl border border-card-stroke p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-4">
          Add Credits
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">
              Amount ($)
            </label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={topupAmount}
              onChange={(e) => setTopupAmount(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCredits();
              }}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">
              Note (optional)
            </label>
            <Input
              type="text"
              placeholder="e.g. Monthly top-up"
              value={topupNote}
              onChange={(e) => setTopupNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCredits();
              }}
            />
          </div>
          <Button onClick={handleAddCredits} disabled={addingCredits}>
            {addingCredits ? "Adding..." : "Add Credits"}
          </Button>
        </div>
      </section>

      {/* Top-up History */}
      <section className="bg-card-bg rounded-xl border border-card-stroke p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-4">
          Top-up History
        </h2>
        {topups.length === 0 ? (
          <p className="text-xs text-text-muted">No top-ups yet.</p>
        ) : (
          <div className="space-y-3">
            {topups.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-black/[0.02] border border-black/5"
              >
                <span className="text-xs text-text-muted">
                  {new Date(t.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span className="text-sm font-medium text-green-600">
                  +{formatCredits(t.amount_usd)}
                </span>
                {t.note && (
                  <span className="text-xs text-text-muted truncate max-w-[140px]">
                    {t.note}
                  </span>
                )}
                <span className="text-xs text-text-muted">{t.added_by_name}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Rates */}
      <section className="bg-card-bg rounded-xl border border-card-stroke p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary">
            Generation Rates
          </h2>
          {!editingRates && (
            <Button
              variant="link"
              onClick={() => {
                setBaseRateInput(String(billing?.cost_per_mp_base ?? 0.03));
                setExtraRateInput(String(billing?.cost_per_mp_extra ?? 0.015));
                setEditingRates(true);
              }}
            >
              Edit
            </Button>
          )}
        </div>

        {editingRates ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-text-muted mb-1 block">
                Base Cost per MP ($)
              </label>
              <Input
                type="number"
                min="0"
                step="0.001"
                value={baseRateInput}
                onChange={(e) => setBaseRateInput(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Escape") setEditingRates(false);
                }}
              />
              <p className="text-xs text-text-muted mt-1">
                Charged per output megapixel (rounded up to nearest MP).
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-text-muted mb-1 block">
                Extra Cost per Input MP ($)
              </label>
              <Input
                type="number"
                min="0"
                step="0.001"
                value={extraRateInput}
                onChange={(e) => setExtraRateInput(e.target.value)}
              />
              <p className="text-xs text-text-muted mt-1">
                Charged per input image (each treated as 1 MP).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleSaveRates} disabled={savingRates}>
                {savingRates ? "Saving..." : "Save"}
              </Button>
              <Button variant="ghost" onClick={() => setEditingRates(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-black/[0.02] border border-black/5">
              <span className="text-xs text-text-muted">Base Cost per MP</span>
              <span className="text-sm font-medium text-text-primary">
                ${billing?.cost_per_mp_base ?? 0.03}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-black/[0.02] border border-black/5">
              <span className="text-xs text-text-muted">Extra Cost per Input MP</span>
              <span className="text-sm font-medium text-text-primary">
                ${billing?.cost_per_mp_extra ?? 0.015}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Platform Fee */}
      <section className="bg-card-bg rounded-xl border border-card-stroke p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary">
            Platform Fee
          </h2>
          {!editingFee && (
            <Button
              variant="link"
              onClick={() => {
                const current = billing?.platform_fee_percentage;
                setFeeInput(current != null ? String(Math.round(current * 100)) : "");
                setEditingFee(true);
              }}
            >
              Edit
            </Button>
          )}
        </div>

        {editingFee ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-text-muted mb-1 block">
                Fee Percentage (%)
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                step="1"
                placeholder="e.g. 15"
                value={feeInput}
                onChange={(e) => setFeeInput(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Escape") setEditingFee(false);
                }}
              />
              <p className="text-xs text-text-muted mt-1">
                Applied on top of generation costs. Leave empty to clear.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleSaveFee} disabled={savingFee}>
                {savingFee ? "Saving..." : "Save"}
              </Button>
              <Button variant="ghost" onClick={() => setEditingFee(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-black/[0.02] border border-black/5">
              <span className="text-xs text-text-muted">Platform Fee</span>
              <span className="text-sm font-medium text-text-primary">
                {billing?.platform_fee_percentage != null
                  ? `${Math.round(billing.platform_fee_percentage * 100)}%`
                  : "Not set"}
              </span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
