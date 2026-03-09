"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface GroupReassignMember {
  id: string;
  full_name: string | null;
  group_id: string | null;
  group_name: string | null;
}

interface GroupReassignModalProps {
  member: GroupReassignMember;
  orgId: string | null;
  onConfirm: (memberId: string, newGroupId: string) => void;
  onClose: () => void;
}

interface Group {
  id: string;
  name: string;
}

export default function GroupReassignModal({
  member,
  orgId,
  onConfirm,
  onClose,
}: GroupReassignModalProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState(member.group_id || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchGroups() {
      if (!orgId) return;
      const supabase = createClient();
      const { data } = await supabase
        .from("groups")
        .select("id, name")
        .eq("org_id", orgId)
        .order("name");
      if (data) setGroups(data);
    }
    fetchGroups();
  }, [orgId]);

  async function handleConfirm() {
    if (!selectedGroupId || selectedGroupId === member.group_id) {
      onClose();
      return;
    }
    setSaving(true);
    await onConfirm(member.id, selectedGroupId);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-card-bg rounded-xl border border-card-stroke p-6 w-full max-w-sm shadow-lg">
        <h3 className="text-sm font-semibold text-text-primary mb-1">
          Reassign Group
        </h3>
        <p className="text-xs text-text-muted mb-4">
          Move <strong>{member.full_name || "Unknown"}</strong> from{" "}
          <strong>{member.group_name || "No Group"}</strong> to:
        </p>

        <div className="space-y-2 mb-5">
          {groups.map((g) => (
            <label
              key={g.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                selectedGroupId === g.id
                  ? "border-accent-purple bg-accent-purple/5"
                  : "border-black/5 hover:bg-black/[0.02]"
              }`}
            >
              <input
                type="radio"
                name="group"
                value={g.id}
                checked={selectedGroupId === g.id}
                onChange={() => setSelectedGroupId(g.id)}
                className="accent-accent-purple"
              />
              <span className="text-sm font-medium text-text-primary">
                {g.name}
              </span>
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving || selectedGroupId === member.group_id}
            className="px-4 py-2 text-sm font-medium text-white bg-accent-purple rounded-lg hover:bg-accent-purple/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Moving..." : "Move Member"}
          </button>
        </div>
      </div>
    </div>
  );
}
