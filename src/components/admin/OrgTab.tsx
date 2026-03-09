"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface Group {
  id: string;
  name: string;
  member_count?: number;
}

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

  const fetchData = useCallback(async () => {
    if (!orgId) return;
    const supabase = createClient();

    const [orgRes, groupsRes] = await Promise.all([
      supabase.from("organizations").select("name").eq("id", orgId).single(),
      supabase.from("groups").select("id, name").eq("org_id", orgId).order("created_at"),
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
      body: JSON.stringify({ name: editingGroupName.trim() }),
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
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
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
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
              autoFocus
            />
            <button
              onClick={handleSaveOrgName}
              disabled={savingName}
              className="px-4 py-2 text-sm font-medium text-white bg-accent-purple rounded-lg hover:bg-accent-purple/90 disabled:opacity-50"
            >
              {savingName ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => {
                setEditingName(false);
                fetchData();
              }}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-primary">{orgName}</p>
            <button
              onClick={() => setEditingName(true)}
              className="text-sm font-medium text-accent-purple hover:underline"
            >
              Edit
            </button>
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
              className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-black/[0.02] border border-black/5"
            >
              {editingGroupId === group.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={editingGroupName}
                    onChange={(e) => setEditingGroupName(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdateGroup(group.id);
                      if (e.key === "Escape") setEditingGroupId(null);
                    }}
                  />
                  <button
                    onClick={() => handleUpdateGroup(group.id)}
                    className="text-xs font-medium text-accent-purple hover:underline"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingGroupId(null)}
                    className="text-xs text-text-muted hover:text-text-primary"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-sm text-text-primary font-medium">
                    {group.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingGroupId(group.id);
                        setEditingGroupName(group.name);
                      }}
                      className="p-1 rounded hover:bg-black/5 transition-colors"
                      title="Edit group"
                    >
                      <span className="material-icons-two-tone text-[16px] text-text-muted">
                        edit
                      </span>
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="p-1 rounded hover:bg-red-50 transition-colors"
                      title="Delete group"
                    >
                      <span className="material-icons-two-tone text-[16px] text-red-400">
                        delete
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Create new group */}
        <div className="mt-4 flex items-center gap-2">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="New group name..."
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateGroup();
            }}
          />
          <button
            onClick={handleCreateGroup}
            disabled={creatingGroup || !newGroupName.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-accent-purple rounded-lg hover:bg-accent-purple/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creatingGroup ? "Creating..." : "Create Group"}
          </button>
        </div>
      </section>
    </div>
  );
}
