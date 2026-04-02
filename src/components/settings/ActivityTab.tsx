"use client";

import { useState, useEffect } from "react";
import type { HourEntry, ApprovalRequest, SignupAssignment, ReimbursementRequest } from "@/lib/types";

interface ActivityTabProps {
  userId: string;
}

interface ActivityItem {
  id: string;
  type: "hours" | "approval" | "signup" | "reimbursement";
  title: string;
  detail?: string;
  date: Date;
  status?: string;
}

const TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  hours: { bg: "bg-green-100", text: "text-green-700", label: "Hours" },
  approval: { bg: "bg-pink-100", text: "text-pink-700", label: "Approval" },
  signup: { bg: "bg-blue-100", text: "text-blue-700", label: "Signup Assigned" },
  reimbursement: { bg: "bg-orange-100", text: "text-orange-700", label: "Reimbursement" },
};

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  pending: { bg: "bg-amber-100", text: "text-amber-700" },
  approved: { bg: "bg-green-100", text: "text-green-700" },
  changes_requested: { bg: "bg-orange-100", text: "text-orange-700" },
  contacted: { bg: "bg-blue-100", text: "text-blue-700" },
  completed: { bg: "bg-green-100", text: "text-green-700" },
};

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ActivityTab({ userId }: ActivityTabProps) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [hoursRes, approvalsRes, signupsRes, reimbursementsRes] = await Promise.all([
          fetch("/api/hours"),
          fetch("/api/approvals"),
          fetch("/api/nationbuilder/signups"),
          fetch("/api/reimbursements"),
        ]);

        const all: ActivityItem[] = [];

        // Hours
        const hoursJson = await hoursRes.json();
        if (hoursJson.entries) {
          for (const e of hoursJson.entries as HourEntry[]) {
            if (e.user_id !== userId) continue;
            all.push({
              id: `h-${e.id}`,
              type: "hours",
              title: `Logged ${e.hours} hour${e.hours !== 1 ? "s" : ""}`,
              detail: e.description || undefined,
              date: new Date(e.activity_date),
            });
          }
        }

        // Approvals
        const approvalsJson = await approvalsRes.json();
        if (approvalsJson.requests) {
          for (const r of approvalsJson.requests as ApprovalRequest[]) {
            if (r.submitter_id !== userId) continue;
            all.push({
              id: `a-${r.id}`,
              type: "approval",
              title: r.title,
              detail: `To: ${r.reviewer_name || "Reviewer"}`,
              date: new Date(r.created_at),
              status: r.status,
            });
          }
        }

        // Signups assigned
        const signupsJson = await signupsRes.json();
        if (signupsJson.status === "connected" && signupsJson.assignments) {
          for (const a of signupsJson.assignments as SignupAssignment[]) {
            if (a.assigned_to !== userId) continue;
            all.push({
              id: `s-${a.id}`,
              type: "signup",
              title: a.nb_signup_name || "New signup",
              detail: "via NationBuilder",
              date: new Date(a.created_at),
              status: a.status,
            });
          }
        }

        // Reimbursements
        const reimbursementsJson = await reimbursementsRes.json();
        if (reimbursementsJson.requests) {
          for (const r of reimbursementsJson.requests as ReimbursementRequest[]) {
            if (r.submitter_id !== userId) continue;
            all.push({
              id: `r-${r.id}`,
              type: "reimbursement",
              title: `$${r.amount} — ${r.description}`,
              date: new Date(r.created_at),
              status: r.status,
            });
          }
        }

        // Sort by date descending
        all.sort((a, b) => b.date.getTime() - a.date.getTime());
        setItems(all.slice(0, 30));
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="material-icons-two-tone text-[24px] text-text-muted animate-spin">
          autorenew
        </span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="material-icons-two-tone text-[36px] text-text-muted">history</span>
        <p className="text-sm text-text-muted mt-2">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const typeStyle = TYPE_STYLES[item.type];
        const statusStyle = item.status ? STATUS_STYLES[item.status] : null;
        const statusLabel = item.status?.replace("_", " ");

        return (
          <div
            key={item.id}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-black/5 hover:border-black/10 transition-colors"
          >
            {/* Type tag */}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${typeStyle.bg} ${typeStyle.text}`}
            >
              {typeStyle.label}
            </span>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary truncate">{item.title}</p>
              {item.detail && (
                <p className="text-[11px] text-text-muted truncate">{item.detail}</p>
              )}
            </div>

            {/* Status + time */}
            <div className="flex items-center gap-2 shrink-0">
              {statusStyle && statusLabel && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${statusStyle.bg} ${statusStyle.text}`}
                >
                  {statusLabel}
                </span>
              )}
              <span className="text-[11px] text-text-muted whitespace-nowrap">
                {formatRelativeTime(item.date)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
