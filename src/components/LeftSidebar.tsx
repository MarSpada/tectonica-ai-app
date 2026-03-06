"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useUserProfile } from "@/lib/UserProfileContext";
import { getAvatarColor, getInitials } from "@/lib/avatar";
import LeadersChat from "./LeadersChat";

const recentChats = [
  { name: "Graphics Creation", icon: "palette", botId: "graphics-creation" },
  { name: "Canvassing Planner", icon: "directions_walk", botId: "canvassing-planner" },
  { name: "Events Planning", icon: "event", botId: "events-planning" },
];

interface LeftSidebarProps {
  userName?: string;
  isDrawerOpen?: boolean;
  onDrawerClose?: () => void;
}

export default function LeftSidebar({
  userName = "Ned Howey",
  isDrawerOpen,
  onDrawerClose,
}: LeftSidebarProps) {
  const pathname = usePathname();
  const [leadersChatOpen, setLeadersChatOpen] = useState(false);
  const { profile } = useUserProfile();

  const displayName = profile?.fullName || userName;
  const avatarUrl = profile?.avatarUrl || null;
  const initials = getInitials(displayName);

  return (
    <>
      {/* Backdrop for drawer mode (<=699px) */}
      {isDrawerOpen && (
        <div className="sidebar-backdrop" onClick={onDrawerClose} />
      )}

      <aside
        className={`left-sidebar-responsive w-[var(--sidebar-width)] bg-sidebar-bg flex flex-col h-full border-r border-black/5 ${
          isDrawerOpen ? "drawer-open" : ""
        }`}
      >
        {/* Navigation */}
        <nav className="flex-1 px-3 pt-4 space-y-1">
          {/* Group Coach Bot */}
          <Link
            href="/coach"
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/coach"
                ? "bg-sidebar-active text-white"
                : "text-text-primary hover:bg-black/5"
            }`}
          >
            <span className="material-icons-two-tone text-[18px]">groups</span>
            <span className="sidebar-label">Group Coach</span>
          </Link>

          {/* Group Media */}
          <Link
            href="/media"
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/media"
                ? "bg-sidebar-active text-white"
                : "text-text-primary hover:bg-black/5"
            }`}
          >
            <span className="material-icons-two-tone text-[18px]">
              perm_media
            </span>
            <span className="sidebar-label">Group Media</span>
          </Link>

          {/* Members */}
          <Link
            href="/members"
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/members"
                ? "bg-sidebar-active text-white"
                : "text-text-primary hover:bg-black/5"
            }`}
          >
            <span className="material-icons-two-tone text-[18px]">people</span>
            <span className="sidebar-label">Members</span>
          </Link>

          {/* Leaders & Organizers Chat */}
          <button
            onClick={() => setLeadersChatOpen(true)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              leadersChatOpen
                ? "bg-sidebar-active text-white"
                : "text-text-primary hover:bg-black/5"
            }`}
          >
            <span className="material-icons-two-tone text-[18px]">chat</span>
            <span className="sidebar-label">Leaders &amp; Organizers</span>
          </button>

          {/* Bot Chats section */}
          <div className="sidebar-bot-chats pt-4">
            <h3 className="sidebar-label px-3 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Helper Chats
            </h3>

            {/* Search */}
            <div className="sidebar-search px-1 mb-2">
              <input
                type="text"
                placeholder="Search chats..."
                className="w-full px-3 py-1.5 text-xs bg-white/60 rounded-md border border-black/5 placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-purple"
              />
            </div>

            {/* Recent chats */}
            <div className="space-y-0.5">
              {recentChats.map((chat) => (
                <Link
                  key={chat.name}
                  href={`/chat/${chat.botId}`}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-text-secondary hover:bg-black/5 transition-colors"
                >
                  <span className="material-icons-two-tone text-[16px]">
                    {chat.icon}
                  </span>
                  <span className="sidebar-label truncate">{chat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* User info */}
        <div className="px-3 py-3 border-t border-black/5">
          <div className="sidebar-user-row flex items-center gap-2.5">
            <Link href="/settings" className="flex items-center gap-2.5 flex-1 min-w-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div
                  className={`w-8 h-8 rounded-full ${getAvatarColor(profile?.userId || "")} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}
                >
                  {initials}
                </div>
              )}
              <div className="sidebar-user-details flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {displayName}
                </p>
                <p className="text-xs text-text-muted">Settings</p>
              </div>
            </Link>
            <Link
              href="/settings"
              title="Settings"
              className="sidebar-signout p-1 rounded hover:bg-black/5 transition-colors"
            >
              <span className="material-icons-two-tone text-[18px] text-text-muted">
                settings
              </span>
            </Link>
          </div>
        </div>
      </aside>

      <LeadersChat
        open={leadersChatOpen}
        onClose={() => setLeadersChatOpen(false)}
        userName={userName.split(" ")[0]}
      />
    </>
  );
}
