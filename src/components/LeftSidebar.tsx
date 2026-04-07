"use client";

import { useState } from "react";
import { isAdminRole } from "@/lib/constants/roles";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useUserProfile } from "@/lib/UserProfileContext";
import { getAvatarColor, getInitials } from "@/lib/avatar";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/lib/icon-map";
import LeadersChat from "./LeadersChat";

const recentChats: { name: string; icon: IconName; botId: string }[] = [
  { name: "Graphics Creation", icon: "bot-graphics", botId: "graphics-creation" },
  { name: "Canvassing Planner", icon: "bot-canvassing", botId: "canvassing-planner" },
  { name: "Events Planning", icon: "bot-events-planning", botId: "events-planning" },
];

interface LeftSidebarProps {
  userName?: string;
  isCollapsed?: boolean;
  isDrawerOpen?: boolean;
  onDrawerClose?: () => void;
}

export default function LeftSidebar({
  userName = "",
  isCollapsed,
  isDrawerOpen,
  onDrawerClose,
}: LeftSidebarProps) {
  const pathname = usePathname();
  const [leadersChatOpen, setLeadersChatOpen] = useState(false);
  const { profile } = useUserProfile();

  const displayName = profile?.fullName || userName;
  const avatarUrl = profile?.avatarUrl || null;
  const initials = getInitials(displayName);

  const iconColor = (active: boolean) => active ? "var(--sidebar-icon-color)" : "var(--sidebar-icon-color-muted)";
  const navTextStyle = (active: boolean): React.CSSProperties => ({
    fontSize: "13px",
    color: active ? "var(--sidebar-icon-color)" : "var(--sidebar-icon-color-muted)",
  });

  return (
    <>
      {/* Backdrop for drawer mode (<=699px) */}
      {isDrawerOpen && (
        <div className="sidebar-backdrop" onClick={onDrawerClose} />
      )}

      <aside
        className={`left-sidebar-responsive w-[var(--sidebar-width)] bg-sidebar-bg flex flex-col h-full border-r border-black/5 ${
          isCollapsed ? "sidebar-collapsed" : ""
        } ${isDrawerOpen ? "drawer-open" : ""}`}
      >
        {/* Navigation */}
        <nav className="flex-1 px-3 pt-4 space-y-1">
          {/* Home */}
          {(() => {
            const active = pathname === "/";
            return (
              <Link
                href="/"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition-colors hover:bg-black/5"
              >
                <Icon name="home" size={22} color={iconColor(active)} />
                <span className="sidebar-label" style={navTextStyle(active)}>Home</span>
              </Link>
            );
          })()}

          {/* Main nav */}
          {([
            { href: "/coach", icon: "group-coach" as IconName, label: "Group Coach" },
            { href: "/media", icon: "group-media" as IconName, label: "Group Media" },
            { href: "/members", icon: "members" as IconName, label: "Members" },
          ] as const).map(({ href, icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition-colors hover:bg-black/5"
              >
                <Icon name={icon} size={22} color={iconColor(active)} />
                <span className="sidebar-label" style={navTextStyle(active)}>{label}</span>
              </Link>
            );
          })}

          {/* Admin (only for super_admin / group_admin) */}
          {isAdminRole(profile?.role) && (() => {
            const active = pathname?.startsWith("/admin") ?? false;
            return (
              <Link
                href="/admin"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition-colors hover:bg-black/5"
              >
                <Icon name="admin" size={22} color={iconColor(active)} />
                <span className="sidebar-label" style={navTextStyle(active)}>Admin</span>
              </Link>
            );
          })()}

          {/* Leaders Chat */}
          <button
            onClick={() => setLeadersChatOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold transition-colors hover:bg-black/5"
          >
            <Icon name="leaders-organizers" size={22} color={iconColor(leadersChatOpen)} />
            <span className="sidebar-label" style={navTextStyle(leadersChatOpen)}>Leaders Chat</span>
          </button>

          {/* Bot Chats section */}
          <div className="sidebar-bot-chats pt-4">
            <h3 className="sidebar-label px-3 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Helper Chats
            </h3>

            {/* Search */}
            <div className="sidebar-search px-1 mb-2">
              <Input
                type="text"
                placeholder="Search chats..."
                className="h-7 text-xs bg-white"
              />
            </div>

            {/* Recent chats */}
            <div className="space-y-0.5">
              {recentChats.map((chat) => (
                <Link
                  key={chat.name}
                  href={`/chat/${chat.botId}`}
                  className="w-full flex items-center px-3 py-1.5 rounded-md font-medium hover:bg-black/5 transition-colors"
                  style={{ fontSize: "10px", color: "var(--sidebar-icon-color)" }}
                >
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
                <p className="text-xs text-text-muted capitalize">{profile?.role?.replace("_", " ") || "Member"}</p>
              </div>
            </Link>
            <Link
              href="/settings"
              title="Settings"
              className="sidebar-signout p-1 rounded hover:bg-black/5 transition-colors"
            >
              <Icon name="settings" size={20} />
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
