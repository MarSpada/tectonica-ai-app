"use client";

import { useState, useEffect, useCallback } from "react";
import type { UserRole } from "@/lib/types";
import {
  getAvatarColor,
  getInitials,
  getRoleBadgeStyle,
  getRoleLabel,
} from "@/lib/avatar";
import RoleChangeModal from "./RoleChangeModal";
import GroupReassignModal from "./GroupReassignModal";

interface AdminMember {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  email: string;
  group_id: string | null;
  group_name: string | null;
  created_at: string;
}

interface PeopleTabProps {
  role: UserRole;
  orgId: string | null;
  groupId: string | null;
}

type RoleFilter = "all" | "super_admin" | "group_admin" | "member" | "supporter";

export default function PeopleTab({ role, orgId, groupId }: PeopleTabProps) {
  const isSuperAdmin = role === "super_admin";
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [roleChangeTarget, setRoleChangeTarget] = useState<AdminMember | null>(null);
  const [groupReassignTarget, setGroupReassignTarget] = useState<AdminMember | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/members");
    if (res.ok) {
      const data = await res.json();
      setMembers(data.members);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Get unique groups for filter dropdown
  const uniqueGroups = Array.from(
    new Map(
      members
        .filter((m) => m.group_id && m.group_name)
        .map((m) => [m.group_id!, m.group_name!])
    ).entries()
  ).map(([id, name]) => ({ id, name }));

  const filteredMembers = members.filter((m) => {
    const matchesSearch = (m.full_name ?? "")
      .toLowerCase()
      .includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || m.role === roleFilter;
    const matchesGroup = groupFilter === "all" || m.group_id === groupFilter;
    return matchesSearch && matchesRole && matchesGroup;
  });

  async function handleRoleChange(memberId: string, newRole: UserRole) {
    const res = await fetch(`/api/admin/members/${memberId}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      setRoleChangeTarget(null);
      fetchMembers();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to change role");
    }
  }

  async function handleGroupReassign(memberId: string, newGroupId: string) {
    const res = await fetch(`/api/admin/members/${memberId}/group`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: newGroupId }),
    });
    if (res.ok) {
      setGroupReassignTarget(null);
      fetchMembers();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to reassign group");
    }
  }

  async function handleRemoveMember(member: AdminMember) {
    if (
      !confirm(
        `Remove ${member.full_name || member.email} from the organization? This cannot be undone.`
      )
    )
      return;

    const res = await fetch(`/api/admin/members/${member.id}`, {
      method: "DELETE",
    });
    if (res.ok) fetchMembers();
    else {
      const data = await res.json();
      alert(data.error || "Failed to remove member");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const roleFilterOptions: { key: RoleFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "super_admin", label: "Super Admin" },
    { key: "group_admin", label: "Group Admin" },
    { key: "member", label: "Member" },
    { key: "supporter", label: "Supporter" },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative w-72">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-icons-two-tone text-[18px] text-text-muted">
            search
          </span>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white/60 rounded-xl border border-black/5 placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-purple/30"
          />
        </div>

        {/* Role filter pills */}
        <div className="flex gap-1.5">
          {roleFilterOptions.map((f) => (
            <button
              key={f.key}
              onClick={() => setRoleFilter(f.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                roleFilter === f.key
                  ? "bg-accent-purple text-white"
                  : "bg-white/60 text-text-secondary border border-black/5 hover:bg-black/5"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Group filter (super_admin only) */}
        {isSuperAdmin && uniqueGroups.length > 1 && (
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-accent-purple/30"
          >
            <option value="all">All Groups</option>
            {uniqueGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        )}

        <span className="text-xs text-text-muted ml-auto">
          {filteredMembers.length} member{filteredMembers.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Members table */}
      {filteredMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <span className="material-icons-two-tone text-5xl text-text-muted">
            group_off
          </span>
          <p className="text-sm text-text-muted mt-2">No members found.</p>
        </div>
      ) : (
        <div className="bg-card-bg rounded-xl border border-card-stroke overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/5 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Member
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Role
                </th>
                {isSuperAdmin && (
                  <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Group
                  </th>
                )}
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => {
                const badge = getRoleBadgeStyle(member.role);
                return (
                  <tr
                    key={member.id}
                    className="border-b border-black/[0.03] last:border-0 hover:bg-black/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={member.full_name || ""}
                            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div
                            className={`w-9 h-9 rounded-full ${getAvatarColor(member.id)} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}
                          >
                            {getInitials(member.full_name)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {member.full_name || "Unknown"}
                          </p>
                          <p className="text-xs text-text-muted truncate">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}
                      >
                        {getRoleLabel(member.role)}
                      </span>
                    </td>
                    {isSuperAdmin && (
                      <td className="px-4 py-3 text-xs text-text-secondary">
                        {member.group_name || "—"}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setRoleChangeTarget(member)}
                          className="p-1.5 rounded hover:bg-black/5 transition-colors"
                          title="Change role"
                        >
                          <span className="material-icons-two-tone text-[16px] text-text-muted">
                            manage_accounts
                          </span>
                        </button>
                        {isSuperAdmin && (
                          <>
                            <button
                              onClick={() => setGroupReassignTarget(member)}
                              className="p-1.5 rounded hover:bg-black/5 transition-colors"
                              title="Reassign group"
                            >
                              <span className="material-icons-two-tone text-[16px] text-text-muted">
                                swap_horiz
                              </span>
                            </button>
                            <button
                              onClick={() => handleRemoveMember(member)}
                              className="p-1.5 rounded hover:bg-red-50 transition-colors"
                              title="Remove member"
                            >
                              <span className="material-icons-two-tone text-[16px] text-red-400">
                                person_remove
                              </span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Role Change Modal */}
      {roleChangeTarget && (
        <RoleChangeModal
          member={roleChangeTarget}
          callerRole={role}
          onConfirm={handleRoleChange}
          onClose={() => setRoleChangeTarget(null)}
        />
      )}

      {/* Group Reassign Modal */}
      {groupReassignTarget && (
        <GroupReassignModal
          member={groupReassignTarget}
          orgId={orgId}
          onConfirm={handleGroupReassign}
          onClose={() => setGroupReassignTarget(null)}
        />
      )}
    </div>
  );
}
