"use client";

import { useState, useEffect } from "react";
import type { ApprovalRequest, ApprovalComment } from "@/lib/types";
import { getAvatarColor, getInitials } from "@/lib/avatar";
import StatusBadge from "./StatusBadge";
import CommentThread from "./CommentThread";

function Avatar({ name, url, size = 32 }: { name: string; url?: string | null; size?: number }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  const bg = getAvatarColor(name);
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold"
      style={{ width: size, height: size, backgroundColor: bg, fontSize: size * 0.4 }}
    >
      {getInitials(name)}
    </div>
  );
}

function isImageType(type: string) {
  return type.startsWith("image/");
}

interface ApprovalDetailViewProps {
  requestId: string;
  currentUserId: string;
  onBack: () => void;
  onUpdated: () => void;
}

export default function ApprovalDetailView({
  requestId,
  currentUserId,
  onBack,
  onUpdated,
}: ApprovalDetailViewProps) {
  const [request, setRequest] = useState<ApprovalRequest | null>(null);
  const [comments, setComments] = useState<ApprovalComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionComment, setActionComment] = useState("");
  const [showActionInput, setShowActionInput] = useState<"approve" | "changes" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Resubmit state
  const [resubDescription, setResubDescription] = useState("");
  const [showResubmit, setShowResubmit] = useState(false);

  useEffect(() => {
    fetchDetail();
  }, [requestId]);

  async function fetchDetail() {
    setLoading(true);
    try {
      const res = await fetch(`/api/approvals/${requestId}`);
      const json = await res.json();
      if (json.request) {
        setRequest(json.request);
        setComments(json.comments || []);
        setResubDescription(json.request.description || "");
      }
    } catch {
      // Error fetching
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(status: "approved" | "changes_requested") {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/approvals/${requestId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, comment: actionComment || null }),
      });
      if (res.ok) {
        setShowActionInput(null);
        setActionComment("");
        await fetchDetail();
        onUpdated();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResubmit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/approvals/${requestId}/resubmit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: resubDescription || null,
        }),
      });
      if (res.ok) {
        setShowResubmit(false);
        await fetchDetail();
        onUpdated();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddComment(content: string) {
    const res = await fetch(`/api/approvals/${requestId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      const json = await res.json();
      setComments((prev) => [...prev, json.comment]);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-text-muted">Request not found.</p>
        <button onClick={onBack} className="text-xs text-accent-purple mt-2 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  const isReviewer = currentUserId === request.reviewer_id;
  const isSubmitter = currentUserId === request.submitter_id;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
        >
          <span className="material-icons-two-tone text-[20px] text-text-secondary">
            arrow_back
          </span>
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-text-primary truncate">{request.title}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <StatusBadge status={request.status} />
            <span className="text-[10px] text-text-muted">
              {new Date(request.created_at).toLocaleDateString()} at{" "}
              {new Date(request.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="flex items-center gap-6 bg-card-bg border border-card-stroke rounded-xl p-4">
        <div className="flex items-center gap-2">
          <Avatar name={request.submitter_name || "?"} url={request.submitter_avatar} />
          <div>
            <p className="text-xs font-medium text-text-primary">{request.submitter_name}</p>
            <p className="text-[10px] text-text-muted">Submitter</p>
          </div>
        </div>
        <span className="material-icons-two-tone text-[18px] text-text-muted">arrow_forward</span>
        <div className="flex items-center gap-2">
          <Avatar name={request.reviewer_name || "?"} url={request.reviewer_avatar} />
          <div>
            <p className="text-xs font-medium text-text-primary">{request.reviewer_name}</p>
            <p className="text-[10px] text-text-muted">Reviewer</p>
          </div>
        </div>
      </div>

      {/* Description */}
      {request.description && (
        <div className="bg-card-bg border border-card-stroke rounded-xl p-4">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
            Description
          </h4>
          <p className="text-sm text-text-secondary whitespace-pre-wrap">{request.description}</p>
        </div>
      )}

      {/* Attachments */}
      {request.attachments && request.attachments.length > 0 && (
        <div className="bg-card-bg border border-card-stroke rounded-xl p-4">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">
            Attachments ({request.attachments.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {request.attachments.map((a, i) =>
              isImageType(a.type) ? (
                <a
                  key={i}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg overflow-hidden border border-black/5 hover:shadow-md transition-shadow"
                >
                  <img src={a.url} alt={a.name} className="w-full h-32 object-cover" />
                  <div className="px-2 py-1.5">
                    <p className="text-[10px] text-text-secondary truncate">{a.name}</p>
                  </div>
                </a>
              ) : (
                <a
                  key={i}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-black/5 p-3 hover:shadow-md transition-shadow"
                >
                  <span className="material-icons-two-tone text-[24px] text-text-muted">
                    {a.type === "application/pdf" ? "picture_as_pdf" : "description"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-text-primary truncate">{a.name}</p>
                    <p className="text-[10px] text-text-muted">
                      {(a.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                </a>
              )
            )}
          </div>
        </div>
      )}

      {/* Reviewer Actions */}
      {isReviewer && request.status === "pending" && (
        <div className="bg-card-bg border border-card-stroke rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Review Actions
          </h4>

          {showActionInput ? (
            <div className="space-y-2">
              <p className="text-xs text-text-secondary">
                {showActionInput === "approve"
                  ? "Add an optional comment with your approval:"
                  : "Explain what changes are needed:"}
              </p>
              <textarea
                value={actionComment}
                onChange={(e) => setActionComment(e.target.value)}
                placeholder={
                  showActionInput === "approve"
                    ? "Optional comment..."
                    : "Describe the changes needed..."
                }
                rows={3}
                className="w-full px-3 py-2 text-xs border border-black/10 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-accent-purple"
              />
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handleStatusChange(
                      showActionInput === "approve" ? "approved" : "changes_requested"
                    )
                  }
                  disabled={submitting || (showActionInput === "changes" && !actionComment.trim())}
                  className={`px-4 py-2 text-xs font-semibold text-white rounded-lg disabled:opacity-50 transition-colors ${
                    showActionInput === "approve"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-orange-500 hover:bg-orange-600"
                  }`}
                >
                  {submitting
                    ? "..."
                    : showActionInput === "approve"
                    ? "Confirm Approval"
                    : "Send Changes Request"}
                </button>
                <button
                  onClick={() => {
                    setShowActionInput(null);
                    setActionComment("");
                  }}
                  className="px-4 py-2 text-xs font-medium text-text-secondary hover:bg-black/5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setShowActionInput("approve")}
                className="px-4 py-2 text-xs font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                <span className="flex items-center gap-1">
                  <span className="material-icons-two-tone text-[16px]">check_circle</span>
                  Approve
                </span>
              </button>
              <button
                onClick={() => setShowActionInput("changes")}
                className="px-4 py-2 text-xs font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
              >
                <span className="flex items-center gap-1">
                  <span className="material-icons-two-tone text-[16px]">edit_note</span>
                  Request Changes
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Submitter Resubmit */}
      {isSubmitter && request.status === "changes_requested" && (
        <div className="bg-card-bg border border-card-stroke rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Changes Requested
          </h4>
          <p className="text-xs text-text-secondary">
            The reviewer requested changes. Update your description and resubmit.
          </p>

          {showResubmit ? (
            <div className="space-y-2">
              <textarea
                value={resubDescription}
                onChange={(e) => setResubDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 text-xs border border-black/10 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-accent-purple"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleResubmit}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-accent-purple rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? "..." : "Resubmit"}
                </button>
                <button
                  onClick={() => setShowResubmit(false)}
                  className="px-4 py-2 text-xs font-medium text-text-secondary hover:bg-black/5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowResubmit(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-accent-purple rounded-lg hover:bg-purple-700 transition-colors"
            >
              Edit & Resubmit
            </button>
          )}
        </div>
      )}

      {/* Comment Thread */}
      <div className="bg-card-bg border border-card-stroke rounded-xl p-4">
        <CommentThread
          comments={comments}
          currentUserId={currentUserId}
          submitterId={request.submitter_id}
          onAddComment={handleAddComment}
        />
      </div>
    </div>
  );
}
