"use client";

import { useState, useEffect } from "react";
import type { ApprovalRequest, ApprovalStatus } from "@/lib/types";
import ApprovalCard from "./ApprovalCard";
import ApprovalDetailView from "./ApprovalDetailView";
import CreateApprovalModal from "./CreateApprovalModal";

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

  const isAdmin = currentUserRole === "super_admin" || currentUserRole === "group_admin";

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
    // Filter by status tab
    if (filter !== "all" && r.status !== filter) return false;
    // Filter by view mode (admin toggle)
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
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Approval Requests</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Submit ideas or assets for admin review
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-pink-500 rounded-lg hover:bg-pink-600 transition-colors"
        >
          <span className="material-icons-two-tone text-[16px]">add</span>
          New Request
        </button>
      </div>

      {/* Admin toggle: Submitted by Me / Assigned to Me */}
      {isAdmin && (
        <div className="flex gap-1 bg-black/5 rounded-lg p-1 w-fit">
          <button
            onClick={() => setViewMode("submitted")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === "submitted"
                ? "bg-white text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            Submitted by Me
          </button>
          <button
            onClick={() => setViewMode("assigned")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === "assigned"
                ? "bg-white text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            Assigned to Me
          </button>
        </div>
      )}

      {/* Filter tabs */}
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
                  ? "bg-accent-purple text-white"
                  : "bg-black/5 text-text-secondary hover:bg-black/10"
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

      {/* Request list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-icons-two-tone text-[48px] text-text-muted/30 mb-3 block">
            approval
          </span>
          <p className="text-sm text-text-muted">
            {filter === "all"
              ? "No approval requests yet."
              : `No ${filter.replace("_", " ")} requests.`}
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-3 text-xs text-accent-purple hover:underline"
          >
            Create your first request
          </button>
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
