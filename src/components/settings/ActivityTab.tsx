"use client";

import { useState, useEffect } from "react";
import { getAvatarColor, getInitials } from "@/lib/avatar";
import StatusBadge from "../approvals/StatusBadge";
import type { HourEntry, ApprovalRequest, SignupAssignment } from "@/lib/types";

interface ActivityTabProps {
  userId: string;
}

export default function ActivityTab({ userId }: ActivityTabProps) {
  const [hours, setHours] = useState<HourEntry[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [assignments, setAssignments] = useState<SignupAssignment[]>([]);
  const [nbConnected, setNbConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [hoursRes, approvalsRes, signupsRes] = await Promise.all([
          fetch("/api/hours"),
          fetch("/api/approvals"),
          fetch("/api/nationbuilder/signups"),
        ]);

        const hoursJson = await hoursRes.json();
        const approvalsJson = await approvalsRes.json();
        const signupsJson = await signupsRes.json();

        // Filter hours to current user only
        if (hoursJson.entries) {
          setHours(
            hoursJson.entries
              .filter((e: HourEntry) => e.user_id === userId)
              .slice(0, 10)
          );
        }

        // Show user's submitted approvals
        if (approvalsJson.requests) {
          setApprovals(
            approvalsJson.requests
              .filter((r: ApprovalRequest) => r.submitter_id === userId)
              .slice(0, 10)
          );
        }

        // Show signups assigned to this user
        if (signupsJson.status === "connected" && signupsJson.assignments) {
          setNbConnected(true);
          setAssignments(
            signupsJson.assignments.filter(
              (a: SignupAssignment) => a.assigned_to === userId
            )
          );
        }
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

  return (
    <div className="space-y-8">
      {/* Hours Logged */}
      <section>
        <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="material-icons-two-tone text-[18px] text-green-600">schedule</span>
          Hours Logged
        </h2>
        {hours.length > 0 ? (
          <div className="space-y-2">
            {hours.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-green-50 border border-green-100"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary">
                    {entry.hours} hour{entry.hours !== 1 ? "s" : ""}
                  </p>
                  {entry.description && (
                    <p className="text-xs text-text-muted truncate">{entry.description}</p>
                  )}
                </div>
                <span className="text-xs text-text-muted shrink-0 ml-3">
                  {new Date(entry.activity_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted px-4 py-3 rounded-xl bg-gray-50">
            No hours logged yet
          </p>
        )}
      </section>

      {/* Approval Requests */}
      <section>
        <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="material-icons-two-tone text-[18px] text-pink-600">fact_check</span>
          Approval Requests
        </h2>
        {approvals.length > 0 ? (
          <div className="space-y-2">
            {approvals.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-pink-50 border border-pink-100"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {req.title}
                    </p>
                    <p className="text-xs text-text-muted">
                      To: {req.reviewer_name || "Reviewer"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <StatusBadge status={req.status} />
                  <span className="text-xs text-text-muted">
                    {new Date(req.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted px-4 py-3 rounded-xl bg-gray-50">
            No approval requests submitted yet
          </p>
        )}
      </section>

      {/* People Assigned to Me */}
      {nbConnected && (
        <section>
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="material-icons-two-tone text-[18px] text-blue-600">person_add</span>
            People Assigned to Me
          </h2>
          {assignments.length > 0 ? (
            <div className="space-y-2">
              {assignments.map((a) => {
                const statusColors = {
                  pending: "bg-amber-50 border-amber-100",
                  contacted: "bg-blue-50 border-blue-100",
                  completed: "bg-green-50 border-green-100",
                };
                const statusLabels = {
                  pending: { bg: "bg-amber-100", text: "text-amber-700", label: "Pending" },
                  contacted: { bg: "bg-blue-100", text: "text-blue-700", label: "Contacted" },
                  completed: { bg: "bg-green-100", text: "text-green-700", label: "Completed" },
                };
                const style = statusLabels[a.status] || statusLabels.pending;
                return (
                  <div
                    key={a.id}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border ${statusColors[a.status] || statusColors.pending}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full shrink-0 ${getAvatarColor(a.nb_signup_id)} flex items-center justify-center text-xs font-bold text-white`}
                      >
                        {getInitials(a.nb_signup_name || "?")}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {a.nb_signup_name}
                        </p>
                        <p className="text-xs text-text-muted truncate">
                          via NationBuilder
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${style.bg} ${style.text}`}>
                        {style.label}
                      </span>
                      <span className="text-xs text-text-muted">
                        {new Date(a.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-text-muted px-4 py-3 rounded-xl bg-gray-50">
              No signups assigned to you yet
            </p>
          )}
        </section>
      )}
    </div>
  );
}
