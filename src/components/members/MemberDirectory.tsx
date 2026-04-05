"use client";

import { useState } from "react";
import { ROLES, VALID_ROLES } from "@/lib/constants/roles";
import Link from "next/link";
import type { Member } from "@/lib/types";
import {
  getAvatarColor,
  getInitials,
  getRoleBadgeStyle,
  getRoleLabel,
} from "@/lib/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";

interface MemberDirectoryProps {
  members: Member[];
}

type RoleFilter = "all" | "leaders" | "members" | "supporters";

const roleFilterMap: Record<RoleFilter, string[]> = {
  all: [...VALID_ROLES],
  leaders: [ROLES.SUPER_ADMIN, ROLES.GROUP_ADMIN],
  members: [ROLES.MEMBER],
  supporters: [ROLES.SUPPORTER],
};

const filterLabels: { key: RoleFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "leaders", label: "Leaders" },
  { key: "members", label: "Members" },
  { key: "supporters", label: "Supporters" },
];

export default function MemberDirectory({ members }: MemberDirectoryProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const filteredMembers = members.filter((m) => {
    const matchesRole = roleFilterMap[roleFilter].includes(m.role);
    const matchesSearch =
      (m.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (m.email ?? "").toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  function formatRelativeDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 1) return "Joined today";
    if (diffDays === 1) return "Joined yesterday";
    if (diffDays < 30) return `Joined ${diffDays} days ago`;
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `Joined ${months} month${months > 1 ? "s" : ""} ago`;
    }
    const years = Math.floor(diffDays / 365);
    return `Joined ${years} year${years > 1 ? "s" : ""} ago`;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-content-bg">
      {/* Page title */}
      <div className="px-6 pt-5 pb-0">
        <div className="flex items-center gap-3 mb-4">
          <Icon name="members" size={28} />
          <h1 className="text-2xl font-bold text-foreground">Members</h1>
        </div>
      </div>

      {/* Header */}
      <div className="px-6 py-5 space-y-4">
        {/* Toolbar: search + filters + count */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative w-72">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <Icon name="search" size={18} className="opacity-60" />
            </span>
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filter pills — matches admin panel pattern */}
          <div className="flex gap-1.5">
            {filterLabels.map((f) => (
              <button
                key={f.key}
                onClick={() => setRoleFilter(f.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  roleFilter === f.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-secondary-foreground border border-border hover:bg-muted"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <Badge variant="outline" className="ml-auto text-muted-foreground">
            {filteredMembers.length} member{filteredMembers.length !== 1 ? "s" : ""}
          </Badge>

          <Button disabled>
            <Icon name="person-add" size={16} />
            Invite Member
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-border bg-card">
            <Icon name="empty-members" size={48} className="opacity-60" />
            <p className="text-sm font-medium text-foreground mt-3">No members found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {search || roleFilter !== "all"
                ? "Try adjusting your search or filters."
                : "No members in this group yet."}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
            {filteredMembers.map((member) => {
              const badge = getRoleBadgeStyle(member.role);
              return (
                <Link
                  key={member.id}
                  href={`/members/${member.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  {/* Avatar */}
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.full_name || "Member"}
                      className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div
                      className={`w-9 h-9 rounded-full ${getAvatarColor(member.id)} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}
                    >
                      {getInitials(member.full_name)}
                    </div>
                  )}

                  {/* Name + email */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {member.full_name || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.email}
                    </p>
                  </div>

                  {/* Role badge */}
                  <span
                    className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${badge.bg} ${badge.text}`}
                  >
                    {getRoleLabel(member.role)}
                  </span>

                  {/* Joined date */}
                  <span className="text-xs text-muted-foreground shrink-0 w-32 text-right">
                    {formatRelativeDate(member.created_at)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
