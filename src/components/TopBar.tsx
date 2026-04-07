"use client";

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { useUserProfile } from "@/lib/UserProfileContext";
import type { AppNotification } from "@/lib/types";

interface TopBarProps {
  onToggleSidebar?: () => void;
}

export default function TopBar({ onToggleSidebar }: TopBarProps) {
  const { profile } = useUserProfile();
  const [approvalCount, setApprovalCount] = useState(0);

  const orgName = profile?.orgName || "Organization";
  const groupName = profile?.groupName || "Group";

  useEffect(() => {
    async function fetchApprovalNotifications() {
      try {
        const res = await fetch("/api/notifications");
        const json = await res.json();
        if (json.notifications) {
          const count = json.notifications.filter(
            (n: AppNotification) => n.type === "approval_request"
          ).length;
          setApprovalCount(count);
        }
      } catch {
        // Notifications unavailable
      }
    }
    fetchApprovalNotifications();

    function handleRefresh() {
      fetchApprovalNotifications();
    }
    window.addEventListener("refresh-approval-count", handleRefresh);
    return () => window.removeEventListener("refresh-approval-count", handleRefresh);
  }, []);

  return (
    <header className="flex items-center justify-between h-16 px-5 bg-topbar-bg border-b border-black/5">
      {/* Left section */}
      <div className="flex items-center gap-4">
        {/* Sidebar collapse button */}
        <button onClick={onToggleSidebar} className="p-1.5 rounded-md hover:bg-black/5 transition-colors cursor-pointer">
          <Icon name="menu" size={22} className="opacity-70" />
        </button>

        {/* Org icon */}
        <div className="w-9 h-9 rounded-full bg-[var(--widget-chart-members)] flex items-center justify-center text-white font-bold text-sm">
          {orgName.charAt(0).toUpperCase()}
        </div>

        {/* Org name */}
        <Link href="/" className="font-semibold hover:underline" style={{ fontSize: "20px", color: "var(--widget-text-color)" }}>
          {orgName}
        </Link>

        {/* Group pill — clickable */}
        <Link
          href="/group"
          className="flex items-center gap-1.5 font-semibold px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
          style={{ fontSize: "15px", color: "var(--widget-chart-members)", backgroundColor: "var(--topbar-pill-bg)", boxShadow: "inset 0 0 0 1px rgba(66, 45, 143, 0.05)" }}
        >
          <span
            className="inline-block shrink-0"
            style={{
              width: 16, height: 16,
              backgroundColor: "var(--widget-chart-members)",
              WebkitMaskImage: "url(/streamline-vectors-main/ultimate/bold/users/multiple-users-1.svg)",
              WebkitMaskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskImage: "url(/streamline-vectors-main/ultimate/bold/users/multiple-users-1.svg)",
              maskSize: "contain",
              maskRepeat: "no-repeat",
            }}
          />
          {groupName}
        </Link>

        {/* Approvals notification bell */}
        <Link
          href="/settings?tab=approvals"
          className="relative p-1.5 rounded-md hover:bg-black/5 transition-colors"
          title="Approval Requests"
        >
          <span
            className="inline-block"
            style={{
              width: 20, height: 20,
              backgroundColor: "var(--widget-chart-members)",
              WebkitMaskImage: "url(/streamline-vectors-main/ultimate/bold/interface-essential/alert-bell-notification-2.svg)",
              WebkitMaskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskImage: "url(/streamline-vectors-main/ultimate/bold/interface-essential/alert-bell-notification-2.svg)",
              maskSize: "contain",
              maskRepeat: "no-repeat",
            }}
          />
          {approvalCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[9px] font-bold text-white bg-pink-500 rounded-full">
              {approvalCount}
            </span>
          )}
        </Link>
      </div>

      {/* Right section — logo + about link */}
      <div className="flex items-center gap-4">
        <Link
          href="/about"
          className="text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          About Tectonica.AI
        </Link>
        <img
          src="/logo-color.png"
          alt="Tectonica.AI"
          className="h-7 w-auto"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.nextElementSibling?.classList.remove("hidden");
          }}
        />
        <span className="hidden text-sm font-bold text-accent-purple">
          Tectonica.AI
        </span>
      </div>
    </header>
  );
}
