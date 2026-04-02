"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Group } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface OrgTabProps {
  orgId: string | null;
}

export default function OrgTab({ orgId }: OrgTabProps) {
  const [orgName, setOrgName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState("");
  const [editingGroupDesc, setEditingGroupDesc] = useState("");

  const fetchData = useCallback(async () => {
    if (!orgId) return;
    const supabase = createClient();

    const [orgRes, groupsRes] = await Promise.all([
      supabase.from("organizations").select("name").eq("id", orgId).single(),
      supabase.from("groups").select("id, name, description").eq("org_id", orgId).order("created_at"),
    ]);

    if (orgRes.data) setOrgName(orgRes.data.name);
    if (groupsRes.data) setGroups(groupsRes.data);
    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSaveOrgName() {
    if (!orgId || !orgName.trim()) return;
    setSavingName(true);
    const res = await fetch("/api/admin/org", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: orgName.trim() }),
    });
    if (res.ok) setEditingName(false);
    setSavingName(false);
  }

  async function handleCreateGroup() {
    if (!newGroupName.trim()) return;
    setCreatingGroup(true);
    const res = await fetch("/api/admin/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newGroupName.trim() }),
    });
    if (res.ok) {
      setNewGroupName("");
      fetchData();
    }
    setCreatingGroup(false);
  }

  async function handleUpdateGroup(groupId: string) {
    if (!editingGroupName.trim()) return;
    const res = await fetch(`/api/admin/groups/${groupId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editingGroupName.trim(), description: editingGroupDesc }),
    });
    if (res.ok) {
      setEditingGroupId(null);
      fetchData();
    }
  }

  async function handleDeleteGroup(groupId: string) {
    if (!confirm("Delete this group? Members will be unassigned.")) return;
    const res = await fetch(`/api/admin/groups/${groupId}`, { method: "DELETE" });
    if (res.ok) fetchData();
  }

  if (loading) {
    return (
      <div className="space-y-8 max-w-3xl">
        <div className="bg-card-bg rounded-xl border border-card-stroke p-5 space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="bg-card-bg rounded-xl border border-card-stroke p-5 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Organization Name */}
      <section className="bg-card-bg rounded-xl border border-card-stroke p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-3">
          Organization Name
        </h2>
        {editingName ? (
          <div className="flex items-center gap-3">
            <Input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="flex-1"
              autoFocus
            />
            <Button
              onClick={handleSaveOrgName}
              disabled={savingName}
            >
              {savingName ? "Saving..." : "Save"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setEditingName(false);
                fetchData();
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-primary">{orgName}</p>
            <Button variant="link" onClick={() => setEditingName(true)}>
              Edit
            </Button>
          </div>
        )}
      </section>

      {/* Groups */}
      <section className="bg-card-bg rounded-xl border border-card-stroke p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary">
            Groups ({groups.length})
          </h2>
        </div>

        <div className="space-y-3">
          {groups.map((group) => (
            <div
              key={group.id}
              className="py-2.5 px-3 rounded-lg bg-black/[0.02] border border-black/5"
            >
              {editingGroupId === group.id ? (
                <div className="space-y-2">
                  <Input
                    type="text"
                    value={editingGroupName}
                    onChange={(e) => setEditingGroupName(e.target.value)}
                    placeholder="Group name"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setEditingGroupId(null);
                    }}
                  />
                  <textarea
                    value={editingGroupDesc}
                    onChange={(e) => setEditingGroupDesc(e.target.value)}
                    placeholder="Group description (visible to all members)..."
                    maxLength={500}
                    rows={3}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-accent-purple/50 resize-none"
                  />
                  <div className="flex items-center gap-2">
                    <Button variant="link" size="xs" onClick={() => handleUpdateGroup(group.id)}>
                      Save
                    </Button>
                    <Button variant="ghost" size="xs" onClick={() => setEditingGroupId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <span className="text-sm text-text-primary font-medium">
                      {group.name}
                    </span>
                    {group.description && (
                      <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
                        {group.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        setEditingGroupId(group.id);
                        setEditingGroupName(group.name);
                        setEditingGroupDesc(group.description || "");
                      }}
                      title="Edit group"
                    >
                      <span className="material-icons-two-tone text-[16px] text-text-muted">
                        edit
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDeleteGroup(group.id)}
                      className="hover:bg-red-50"
                      title="Delete group"
                    >
                      <span className="material-icons-two-tone text-[16px] text-red-400">
                        delete
                      </span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Create new group */}
        <div className="mt-4 flex items-center gap-2">
          <Input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="New group name..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateGroup();
            }}
          />
          <Button
            onClick={handleCreateGroup}
            disabled={creatingGroup || !newGroupName.trim()}
          >
            {creatingGroup ? "Creating..." : "Create Group"}
          </Button>
        </div>
      </section>
    </div>
  );
}
