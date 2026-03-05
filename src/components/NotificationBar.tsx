"use client";

import { useState, useEffect } from "react";
import type { AppNotification } from "@/lib/types";

export default function NotificationBar() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [dismissed, setDismissed] = useState(false);

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
    fetchNotifications();
  }, []);

  if (dismissed || notifications.length === 0) return null;

  const assignmentCount = notifications.filter(
    (n) => n.type === "signup_assignment"
  ).length;

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
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <span className="material-icons-two-tone text-[18px] text-amber-600 shrink-0">
          notifications_active
        </span>
        <p className="text-xs text-amber-800 truncate">
          {assignmentCount > 0 ? (
            <>
              You have <strong>{assignmentCount}</strong> new signup
              {assignmentCount !== 1 ? "s" : ""} assigned to you.
              Contact them within 24 hours for best results.
            </>
          ) : (
            <>You have new notifications.</>
          )}
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
  );
}
