"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAvatarColor, getInitials } from "@/lib/avatar";
import { formatSignupTime } from "@/lib/signup-utils";
import { useUserProfile } from "@/lib/UserProfileContext";
import type { AppNotification, NbSignup, SignupAssignment } from "@/lib/types";
import { Icon } from "@/components/ui/icon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function NotificationBar() {
  const { profile } = useUserProfile();
  const groupId = profile?.groupId;

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [nbConnected, setNbConnected] = useState<boolean | null>(null);
  const [pendingAssignments, setPendingAssignments] = useState<
    (SignupAssignment & { signup?: NbSignup })[]
  >([]);
  const [showLightbox, setShowLightbox] = useState(false);

  // Check sessionStorage for prior dismiss in this browser session
  useEffect(() => {
    if (!groupId) return;
    const key = `notificationBar_dismissed_${groupId}`;
    if (sessionStorage.getItem(key) === "true") {
      setDismissed(true);
    }
  }, [groupId]);

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
    if (groupId) {
      sessionStorage.setItem(`notificationBar_dismissed_${groupId}`, "true");
    }
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
          <Icon name="notifications" size={18} className="shrink-0" />
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
                . Follow up with them or reassign to another member in the next 48 hours
              </>
            )}
            {assignmentCount > 0 && (approvalCount > 0 || reimbursementCount > 0) && ". Also: "}
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
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleDismiss}
          title="Dismiss"
          className="shrink-0 hover:bg-amber-100"
        >
          <Icon name="close" size={16} />
        </Button>
      </div>

      {/* Signups Lightbox */}
      <Dialog open={showLightbox} onOpenChange={setShowLightbox}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <DialogTitle>Signups Assigned to You</DialogTitle>
              <DialogDescription>
                {pendingAssignments.length} pending contact
                {pendingAssignments.length !== 1 ? "s" : ""}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowLightbox(false)}
            >
              <Icon name="close" size={18} className="opacity-60" />
            </Button>
          </DialogHeader>

          {/* List */}
          <div className="max-h-80 overflow-y-auto -mx-4 px-4 space-y-2">
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
          <div className="-mx-4 -mb-4 px-5 py-3 border-t border-black/5 bg-gray-50 rounded-b-xl">
            <p className="text-[10px] text-text-muted text-center">
              Click a signup in the dashboard widget for full details and actions
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
