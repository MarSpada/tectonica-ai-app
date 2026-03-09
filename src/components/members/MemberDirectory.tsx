"use client";

import { useState } from "react";
import Link from "next/link";
import type { Member } from "@/lib/types";
import {
  getAvatarColor,
  getInitials,
  getRoleBadgeStyle,
  getRoleLabel,
} from "@/lib/avatar";

interface MemberDirectoryProps {
  members: Member[];
}

type RoleFilter = "all" | "leaders" | "members" | "supporters";

const roleFilterMap: Record<RoleFilter, string[]> = {
  all: ["super_admin", "group_admin", "member", "supporter"],
  leaders: ["super_admin", "group_admin"],
  members: ["member"],
  supporters: ["supporter"],
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
    const matchesSearch = (m.full_name ?? "")
      .toLowerCase()
      .includes(search.toLowerCase());
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
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5">
        <div className="flex items-baseline justify-between mb-4">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-bold text-text-primary">
              Member Directory
            </h1>
            <span className="text-sm text-text-muted">
              {members.length} member{members.length !== 1 ? "s" : ""}
            </span>
          </div>
          <button
            disabled
            className="px-5 py-2.5 text-sm font-semibold text-white bg-accent-purple rounded-xl hover:bg-accent-purple/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-lg font-bold">+</span>
            Invite Member
          </button>
        </div>

        {/* Toolbar: search + filters */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative w-72">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-icons-two-tone text-[18px] text-text-muted">
              search
            </span>
            <input
              type="text"
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white/60 rounded-xl border border-black/5 placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-purple/30"
            />
          </div>

          {/* Filter pills */}
          <div className="flex gap-2">
            {filterLabels.map((f) => (
              <button
                key={f.key}
                onClick={() => setRoleFilter(f.key)}
                className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                  roleFilter === f.key
                    ? "bg-accent-purple text-white"
                    : "bg-white/60 text-text-secondary border border-black/5 hover:bg-black/5"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="material-icons-two-tone text-6xl text-text-muted">
              group_off
            </span>
            <p className="text-sm text-text-muted mt-2">
              No members found matching your search.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
            {filteredMembers.map((member) => {
              const badge = getRoleBadgeStyle(member.role);
              return (
                <Link
                  key={member.id}
                  href={`/members/${member.id}`}
                  className="bg-card-bg rounded-xl border border-card-stroke p-5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.full_name || "Member"}
                        className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div
                        className={`w-16 h-16 rounded-full ${getAvatarColor(member.id)} flex items-center justify-center text-xl font-bold text-white flex-shrink-0`}
                      >
                        {getInitials(member.full_name)}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {member.full_name || "Unknown"}
                      </p>
                      <span
                        className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}
                      >
                        {getRoleLabel(member.role)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-text-muted mt-3 truncate">
                    {member.email}
                  </p>
                  <p className="text-[10px] text-text-muted mt-0.5">
                    {formatRelativeDate(member.created_at)}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
