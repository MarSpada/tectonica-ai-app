"use client";

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from "react";
import Link from "next/link";
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
    <header className="flex items-center justify-between h-16 px-5 bg-topbar-bg border-b border-black/5">
      {/* Left section */}
      <div className="flex items-center gap-4">
        {/* Sidebar collapse button */}
        <button onClick={onToggleSidebar} className="p-1.5 rounded-md hover:bg-black/5 transition-colors cursor-pointer">
          <Icon name="menu" size={22} className="opacity-70" />
        </button>

        {/* Org icon */}
        <div className="w-9 h-9 rounded-full bg-[#422D8F] flex items-center justify-center text-white font-bold text-sm">
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
          style={{ fontSize: "15px", color: "#422D8F", backgroundColor: "#F8F7FF", boxShadow: "inset 0 0 0 1px rgba(66, 45, 143, 0.05)" }}
        >
          <span
            className="inline-block shrink-0"
            style={{
              width: 16, height: 16,
              backgroundColor: "#422D8F",
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
              backgroundColor: "#422D8F",
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

      {/* Right section — logo */}
      <div className="flex items-center gap-4">
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
