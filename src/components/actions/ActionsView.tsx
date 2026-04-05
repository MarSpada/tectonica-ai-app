"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import type { Action, ActionType, ActionStatus, UserRole } from "@/lib/types";
import ActionCard from "./ActionCard";
import CreateEditActionSheet from "./CreateEditActionSheet";
import ActionDetailSheet from "./ActionDetailSheet";

interface ActionsViewProps {
  userRole: UserRole;
}

type ScopeFilter = "all" | "mine";

const TYPE_FILTERS: { value: "" | ActionType; label: string }[] = [
  { value: "", label: "All Types" },
  { value: "petition", label: "Petition" },
  { value: "event_rsvp", label: "Event" },
  { value: "letter", label: "Letter" },
  { value: "phone_bank", label: "Phone Bank" },
  { value: "canvass", label: "Canvass" },
  { value: "donation", label: "Donation" },
  { value: "social_share", label: "Social Share" },
  { value: "custom", label: "Custom" },
];

const STATUS_FILTERS: { value: ActionStatus | ""; label: string; adminOnly?: boolean }[] = [
  { value: "", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived", adminOnly: true },
];

const ITEMS_PER_PAGE = 20;

export default function ActionsView({ userRole }: ActionsViewProps) {
  const isAdmin = userRole === "super_admin" || userRole === "group_admin";

  const [scope, setScope] = useState<ScopeFilter>("all");
  const [typeFilter, setTypeFilter] = useState<"" | ActionType>("");
  const [statusFilter, setStatusFilter] = useState<ActionStatus | "">("");
  const [page, setPage] = useState(0);

  const [actions, setActions] = useState<Action[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [editingAction, setEditingAction] = useState<Action | null>(null);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);

  const fetchActions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("scope", scope);
    params.set("page", String(page));
    params.set("limit", String(ITEMS_PER_PAGE));
    if (statusFilter) {
      params.set("status", statusFilter);
    } else {
      params.set("status", "active");
    }
    if (typeFilter) params.set("type", typeFilter);

    try {
      const res = await fetch(`/api/actions?${params}`);
      const data = await res.json();
      if (data.actions) {
        setActions(data.actions);
        setTotal(data.total ?? 0);
      }
    } catch {
      // Failed
    } finally {
      setLoading(false);
    }
  }, [scope, typeFilter, statusFilter, page]);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  // Reset page on filter change
  useEffect(() => {
    setPage(0);
  }, [scope, typeFilter, statusFilter]);

  async function handleArchive(action: Action) {
    if (!confirm(`Archive "${action.title}"? Completion history will be preserved.`)) return;

    try {
      const res = await fetch(`/api/actions/${action.id}`, { method: "DELETE" });
      if (res.ok) {
        fetchActions();
      }
    } catch {
      // Failed
    }
  }

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-content-bg">
      {/* Page title */}
      <div className="px-6 pt-5 pb-0">
        <div className="flex items-center gap-3 mb-4">
          <Icon name="bot-action-planning" size={28} />
          <h1 className="text-2xl font-bold text-foreground">Actions</h1>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Scope toggle */}
          <div className="flex items-center bg-card rounded-lg p-0.5 border border-border">
            {(["all", "mine"] as ScopeFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  scope === s
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-secondary-foreground"
                }`}
              >
                {s === "all" ? "All Actions" : "Assigned to Me"}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "" | ActionType)}
            className="px-3 py-1.5 text-xs border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-purple bg-card"
          >
            {TYPE_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>

          {/* Status filter pills */}
          <div className="flex gap-1.5">
            {STATUS_FILTERS.filter((f) => !f.adminOnly || isAdmin).map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value as ActionStatus | "")}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  statusFilter === f.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-secondary-foreground border border-border hover:bg-muted"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <Badge variant="outline" className="ml-auto text-muted-foreground">
            {total} action{total !== 1 ? "s" : ""}
          </Badge>

          {isAdmin && (
            <Button onClick={() => { setEditingAction(null); setShowCreate(true); }}>
              <Icon name="add" size={16} />
              Create Action
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : actions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-border bg-card">
            <Icon name="bot-action-planning" size={48} className="opacity-60" />
            <p className="text-sm font-medium text-foreground mt-3">
              {scope === "mine" ? "No actions assigned to you" : "No actions yet"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {scope === "mine"
                ? "Try switching to All Actions to see what's available."
                : isAdmin
                ? "Create your first action to get started."
                : "Check back later for new actions."}
            </p>
            {isAdmin && scope === "all" && (
              <Button
                className="mt-4"
                onClick={() => { setEditingAction(null); setShowCreate(true); }}
              >
                Create your first action
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {actions.map((action) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  userRole={userRole}
                  onSelect={(a) => setSelectedActionId(a.id)}
                  onEdit={isAdmin ? (a) => { setEditingAction(a); setShowCreate(true); } : undefined}
                  onArchive={isAdmin ? handleArchive : undefined}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Sheet */}
      <CreateEditActionSheet
        open={showCreate}
        action={editingAction}
        onClose={() => { setShowCreate(false); setEditingAction(null); }}
        onSaved={fetchActions}
      />

      {/* Detail Sheet */}
      <ActionDetailSheet
        actionId={selectedActionId}
        userRole={userRole}
        onClose={() => setSelectedActionId(null)}
        onUpdated={fetchActions}
      />
    </div>
  );
}
