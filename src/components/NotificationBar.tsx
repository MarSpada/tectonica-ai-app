"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAvatarColor, getInitials } from "@/lib/avatar";
import { formatSignupTime } from "@/lib/signup-utils";
import type { AppNotification, NbSignup, SignupAssignment } from "@/lib/types";

export default function NotificationBar() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [nbConnected, setNbConnected] = useState<boolean | null>(null);
  const [pendingAssignments, setPendingAssignments] = useState<
    (SignupAssignment & { signup?: NbSignup })[]
  >([]);
  const [showLightbox, setShowLightbox] = useState(false);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications");
        const json = await res.json();
        if (json.notifications) setNotifications(json.notifications);
      } catch {
        // Notifications unavailable
      }
    }
    async function checkNbStatus() {
      try {
        const res = await fetch("/api/nationbuilder/signups");
        const json = await res.json();
        const connected = json.status === "connected";
        setNbConnected(connected);

        if (connected && json.assignments && json.signups) {
          // Get pending assignments and match with signup data
          const pending = json.assignments.filter(
            (a: SignupAssignment) => a.status === "pending"
          );
          const signupMap = new Map(
            json.signups.map((s: NbSignup) => [s.id, s])
          );
          setPendingAssignments(
            pending.map((a: SignupAssignment) => ({
              ...a,
              signup: signupMap.get(a.nb_signup_id),
            }))
          );
        }
      } catch {
        setNbConnected(false);
      }
    }
    fetchNotifications();
    checkNbStatus();
  }, []);

  if (dismissed || nbConnected === null) return null;

  // Use real assignment count instead of notification records
  const assignmentCount = nbConnected ? pendingAssignments.length : 0;
  const approvalCount = notifications.filter(
    (n) => n.type === "approval_request"
  ).length;
  const reimbursementCount = notifications.filter(
    (n) => n.type === "reimbursement_request"
  ).length;

  if (assignmentCount === 0 && approvalCount === 0 && reimbursementCount === 0) return null;

  async function handleDismiss() {
    setDismissed(true);
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: "all" }),
      });
    } catch {
      // Silent fail
    }
  }

  return (
    <>
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-icons-two-tone text-[18px] text-amber-600 shrink-0">
            notifications_active
          </span>
          <p className="text-xs text-amber-800 truncate">
            You have{" "}
            {assignmentCount > 0 && (
              <>
                <button
                  onClick={() => setShowLightbox(true)}
                  className="underline hover:no-underline font-bold"
                >
                  {assignmentCount} new signup{assignmentCount !== 1 ? "s" : ""}
                </button>
              </>
            )}
            {assignmentCount > 0 && (approvalCount > 0 || reimbursementCount > 0) && ", "}
            {approvalCount > 0 && (
              <Link href="/settings?tab=approvals" className="underline hover:no-underline">
                <strong>{approvalCount}</strong> approval update{approvalCount !== 1 ? "s" : ""}
              </Link>
            )}
            {approvalCount > 0 && reimbursementCount > 0 && ", "}
            {reimbursementCount > 0 && (
              <Link href="/settings?tab=approvals" className="underline hover:no-underline">
                <strong>{reimbursementCount}</strong> reimbursement update{reimbursementCount !== 1 ? "s" : ""}
              </Link>
            )}
            .
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1 rounded-lg hover:bg-amber-100 transition-colors"
          title="Dismiss"
        >
          <span className="material-icons-two-tone text-[16px] text-amber-600">
            close
          </span>
        </button>
      </div>

      {/* Signups Lightbox */}
      {showLightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowLightbox(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/5">
              <div>
                <h2 className="text-sm font-bold text-text-primary">
                  Signups Assigned to You
                </h2>
                <p className="text-[11px] text-text-muted mt-0.5">
                  {pendingAssignments.length} pending contact
                  {pendingAssignments.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={() => setShowLightbox(false)}
                className="p-1 rounded-lg hover:bg-black/5 transition-colors"
              >
                <span className="material-icons-two-tone text-[18px] text-text-muted">
                  close
                </span>
              </button>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto px-5 py-3 space-y-2">
              {pendingAssignments.map((a) => {
                const name = a.nb_signup_name || a.signup?.name || "Unknown";
                const email = a.signup?.email || "";
                const phone = a.signup?.phone || "";
                const time = formatSignupTime(a.signup?.created_at || a.created_at);
                return (
                  <div
                    key={a.id}
                    className="flex items-start gap-3 px-3 py-3 rounded-xl bg-amber-50 border border-amber-100"
                  >
                    <div
                      className={`w-9 h-9 rounded-full shrink-0 ${getAvatarColor(a.nb_signup_id)} flex items-center justify-center text-xs font-bold text-white`}
                    >
                      {getInitials(name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-text-primary truncate">
                          {name}
                        </p>
                        <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 shrink-0">
                          <img src="/nb-icon.png" alt="" className="w-3 h-3" />
                          NB
                        </span>
                      </div>
                      {email && (
                        <p className="text-xs text-text-muted truncate">{email}</p>
                      )}
                      {phone && (
                        <p className="text-xs text-text-muted">{phone}</p>
                      )}
                      <p
                        className={`text-[10px] mt-1 ${
                          time.urgent ? "font-semibold text-red-500" : "text-text-muted"
                        }`}
                      >
                        {time.text}
                      </p>
                    </div>
                  </div>
                );
              })}
              {pendingAssignments.length === 0 && (
                <p className="text-sm text-text-muted text-center py-4">
                  No pending signups
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-black/5 bg-gray-50">
              <p className="text-[10px] text-text-muted text-center">
                Click a signup in the dashboard widget for full details and actions
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
