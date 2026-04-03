"use client";

import { useState, useEffect, useCallback } from "react";
import type { UserRole } from "@/lib/types";
import {
  getAvatarColor,
  getInitials,
  getRoleBadgeStyle,
  getRoleLabel,
} from "@/lib/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icon } from "@/components/ui/icon";
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
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState("");

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

  async function handleSaveName(memberId: string) {
    if (!editingNameValue.trim()) return;
    const res = await fetch(`/api/admin/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: editingNameValue.trim() }),
    });
    if (res.ok) {
      setEditingNameId(null);
      fetchMembers();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to update name");
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

  const roleFilterOptions: { key: RoleFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "super_admin", label: "Super Admin" },
    { key: "group_admin", label: "Group Admin" },
    { key: "member", label: "Member" },
    { key: "supporter", label: "Supporter" },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Toolbar skeleton */}
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-8 w-72 rounded-lg" />
          <div className="flex gap-1.5">
            {roleFilterOptions.map((f) => (
              <Skeleton key={f.key} className="h-7 w-20 rounded-full" />
            ))}
          </div>
        </div>
        {/* Table skeleton */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <div className="flex gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
              {isSuperAdmin && <Skeleton className="h-4 w-24" />}
              <Skeleton className="h-4 w-16 ml-auto" />
            </div>
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
              <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
              {isSuperAdmin && <Skeleton className="h-4 w-24" />}
              <div className="flex gap-1">
                <Skeleton className="h-7 w-7 rounded-lg" />
                {isSuperAdmin && (
                  <>
                    <Skeleton className="h-7 w-7 rounded-lg" />
                    <Skeleton className="h-7 w-7 rounded-lg" />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
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

        {/* Role filter pills */}
        <div className="flex gap-1.5">
          {roleFilterOptions.map((f) => (
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

        {/* Group filter (super_admin only) */}
        {isSuperAdmin && uniqueGroups.length > 1 && (
          <Select value={groupFilter} onValueChange={(v) => setGroupFilter(v ?? "all")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {uniqueGroups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Badge variant="outline" className="ml-auto text-muted-foreground">
          {filteredMembers.length} member{filteredMembers.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Members table */}
      {filteredMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-border bg-card">
          <Icon name="empty-members" size={48} className="opacity-40" />
          <p className="text-sm font-medium text-foreground mt-3">No members found</p>
          <p className="text-xs text-muted-foreground mt-1">
            {search || roleFilter !== "all"
              ? "Try adjusting your search or filters."
              : "No members in this organization yet."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Member</TableHead>
                <TableHead>Role</TableHead>
                {isSuperAdmin && <TableHead>Group</TableHead>}
                <TableHead className="text-right pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => {
                const badge = getRoleBadgeStyle(member.role);
                return (
                  <TableRow key={member.id}>
                    <TableCell className="pl-4">
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
                          {editingNameId === member.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="text"
                                value={editingNameValue}
                                onChange={(e) => setEditingNameValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveName(member.id);
                                  if (e.key === "Escape") setEditingNameId(null);
                                }}
                                autoFocus
                                className="h-7 w-40 text-sm"
                              />
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => handleSaveName(member.id)}
                                title="Save"
                              >
                                <Icon name="confirm" size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => setEditingNameId(null)}
                                title="Cancel"
                              >
                                <Icon name="cancel" size={16} className="opacity-60" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 group/name">
                              <p className="text-sm font-medium text-foreground truncate">
                                {member.full_name || "Unknown"}
                              </p>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => {
                                  setEditingNameId(member.id);
                                  setEditingNameValue(member.full_name || "");
                                }}
                                title="Edit name"
                                className="opacity-0 group-hover/name:opacity-100"
                              >
                                <Icon name="edit" size={14} className="opacity-60" />
                              </Button>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground truncate">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}
                      >
                        {getRoleLabel(member.role)}
                      </span>
                    </TableCell>
                    {isSuperAdmin && (
                      <TableCell className="text-sm text-secondary-foreground">
                        {member.group_name || "—"}
                      </TableCell>
                    )}
                    <TableCell className="pr-4">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setRoleChangeTarget(member)}
                          title="Change role"
                        >
                          <Icon name="change-role" size={16} className="opacity-60" />
                        </Button>
                        {isSuperAdmin && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setGroupReassignTarget(member)}
                              title="Reassign group"
                            >
                              <Icon name="reassign-group" size={16} className="opacity-60" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleRemoveMember(member)}
                              title="Remove member"
                              className="hover:bg-destructive/10"
                            >
                              <Icon name="remove-member" size={16} />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
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
