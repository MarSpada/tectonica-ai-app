"use client";

import { useState, useEffect } from "react";
import { isAdminRole } from "@/lib/constants/roles";
import type { ApprovalRequest, ApprovalStatus } from "@/lib/types";
import ApprovalCard from "./ApprovalCard";
import ApprovalDetailView from "./ApprovalDetailView";
import CreateApprovalModal from "./CreateApprovalModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";

type FilterTab = "all" | ApprovalStatus;
type ViewMode = "submitted" | "assigned";

interface ApprovalsViewProps {
  currentUserId: string;
  currentUserRole: string;
}

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "changes_requested", label: "Changes Requested" },
];

export default function ApprovalsView({ currentUserId, currentUserRole }: ApprovalsViewProps) {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("submitted");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const isAdmin = isAdminRole(currentUserRole);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    setLoading(true);
    try {
      const res = await fetch("/api/approvals");
      const json = await res.json();
      if (json.requests) setRequests(json.requests);
    } catch {
      // Error fetching
    } finally {
      setLoading(false);
    }
  }

  // Filter requests
  const filtered = requests.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    if (isAdmin) {
      if (viewMode === "submitted" && r.submitter_id !== currentUserId) return false;
      if (viewMode === "assigned" && r.reviewer_id !== currentUserId) return false;
    }
    return true;
  });

  // If viewing detail
  if (selectedId) {
    return (
      <ApprovalDetailView
        requestId={selectedId}
        currentUserId={currentUserId}
        onBack={() => setSelectedId(null)}
        onUpdated={fetchRequests}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar — matches admin panel pattern */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Admin toggle: Submitted by Me / Assigned to Me */}
        {isAdmin && (
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode("submitted")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === "submitted"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-secondary-foreground"
              }`}
            >
              Submitted by Me
            </button>
            <button
              onClick={() => setViewMode("assigned")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === "assigned"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-secondary-foreground"
              }`}
            >
              Assigned to Me
            </button>
          </div>
        )}

        {/* Status filter pills — matches admin panel pattern */}
        <div className="flex gap-1.5">
          {FILTER_TABS.map((tab) => {
            const count = requests.filter((r) => {
              if (tab.key !== "all" && r.status !== tab.key) return false;
              if (isAdmin) {
                if (viewMode === "submitted" && r.submitter_id !== currentUserId) return false;
                if (viewMode === "assigned" && r.reviewer_id !== currentUserId) return false;
              }
              return true;
            }).length;

            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  filter === tab.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-secondary-foreground border border-border hover:bg-muted"
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className="ml-1 opacity-70">({count})</span>
                )}
              </button>
            );
          })}
        </div>

        <Badge variant="outline" className="ml-auto text-muted-foreground">
          {filtered.length} request{filtered.length !== 1 ? "s" : ""}
        </Badge>

        <Button onClick={() => setShowCreate(true)}>
          <Icon name="add" size={16} />
          New Request
        </Button>
      </div>

      {/* Request list */}
      {loading ? (
        <div className="flex items-center justify-center py-16 rounded-xl border border-border bg-card">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-border bg-card">
          <Icon name="check-circle" size={48} className="opacity-60" />
          <p className="text-sm font-medium text-foreground mt-3">
            {filter === "all"
              ? "No approval requests yet"
              : `No ${filter.replace("_", " ")} requests`}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {filter === "all"
              ? "Submit an idea or asset for admin review."
              : "Try adjusting your filters."}
          </p>
          {filter === "all" && (
            <Button
              variant="link"
              onClick={() => setShowCreate(true)}
              className="mt-2 text-xs"
            >
              Create your first request
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          {filtered.map((r) => (
            <ApprovalCard key={r.id} request={r} onClick={() => setSelectedId(r.id)} />
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <CreateApprovalModal
          onClose={() => setShowCreate(false)}
          onCreated={fetchRequests}
        />
      )}
    </div>
  );
}
