"use client";

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

interface TopBarProps {
  onToggleSidebar?: () => void;
}

export default function TopBar({ onToggleSidebar }: TopBarProps) {
  const [approvalCount, setApprovalCount] = useState(0);
  const [orgName, setOrgName] = useState("People's Movement");
  const [groupName, setGroupName] = useState("Group Name");

  useEffect(() => {
    async function fetchOrgAndGroup() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("org_id, group_id")
          .eq("id", user.id)
          .single();

        if (profile?.org_id) {
          const { data: org } = await supabase
            .from("organizations")
            .select("name")
            .eq("id", profile.org_id)
            .single();
          if (org?.name) setOrgName(org.name);
        }

        if (profile?.group_id) {
          const { data: group } = await supabase
            .from("groups")
            .select("name")
            .eq("id", profile.group_id)
            .single();
          if (group?.name) setGroupName(group.name);
        }
      } catch {
        // Fallback to defaults
      }
    }
    fetchOrgAndGroup();

    async function fetchApprovalNotifications() {
      try {
        const res = await fetch("/api/notifications");
        const json = await res.json();
        if (json.notifications) {
          const count = json.notifications.filter(
            (n: { type: string }) => n.type === "approval_request"
          ).length;
          setApprovalCount(count);
        }
      } catch {
        // Notifications unavailable
      }
    }
    fetchApprovalNotifications();

    // Listen for refresh events (e.g. after approving a request)
    function handleRefresh() {
      fetchApprovalNotifications();
    }
    window.addEventListener("refresh-approval-count", handleRefresh);
    return () => window.removeEventListener("refresh-approval-count", handleRefresh);
  }, []);

  return (
    <header className="flex items-center justify-between h-14 px-4 bg-topbar-bg">
      {/* Left section */}
      <div className="flex items-center gap-3">
        {/* Sidebar collapse button */}
        <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </Button>

        {/* Org icon */}
        <div className="w-8 h-8 rounded-lg bg-orange-400 flex items-center justify-center text-white font-bold text-sm">
          {orgName.charAt(0).toUpperCase()}
        </div>

        {/* Org name */}
        <Link href="/" className="font-semibold text-text-primary hover:underline">
          {orgName}
        </Link>

        {/* Group pill */}
        <Link
          href="/group"
          className="px-3 py-1 text-xs font-medium bg-white/50 rounded-full text-text-secondary hover:bg-white/70 transition-colors"
        >
          {groupName}
        </Link>
      </div>

      {/* Right section — bell + logo */}
      <div className="flex items-center gap-3">
        {/* Approvals notification bell */}
        <Link
          href="/settings?tab=approvals"
          className="relative p-1.5 rounded-md hover:bg-black/5 transition-colors"
          title="Approval Requests"
        >
          <Icon name="notifications" size={22} className="opacity-70" />
          {approvalCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[9px] font-bold text-white bg-pink-500 rounded-full">
              {approvalCount}
            </span>
          )}
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
