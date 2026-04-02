"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Group } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function GroupReassignModal({
  member,
  orgId,
  onConfirm,
  onClose,
}: GroupReassignModalProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState(member.group_id || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchGroups() {
      if (!orgId) {
        setLoading(false);
        return;
      }
      const supabase = createClient();
      const { data } = await supabase
        .from("groups")
        .select("id, name")
        .eq("org_id", orgId)
        .order("name");
      if (data) setGroups(data);
      setLoading(false);
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
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reassign Group</DialogTitle>
          <DialogDescription>
            Move <strong className="text-foreground">{member.full_name || "Unknown"}</strong> from{" "}
            <strong className="text-foreground">{member.group_name || "No Group"}</strong> to:
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full rounded-lg" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="py-6 text-center">
            <span className="material-icons-two-tone text-3xl text-muted-foreground">folder_off</span>
            <p className="text-sm text-muted-foreground mt-2">No groups available.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {groups.map((g) => (
              <label
                key={g.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                  selectedGroupId === g.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted"
                }`}
              >
                <input
                  type="radio"
                  name="group"
                  value={g.id}
                  checked={selectedGroupId === g.id}
                  onChange={() => setSelectedGroupId(g.id)}
                  className="accent-[var(--accent-purple)]"
                />
                <span className="text-sm font-medium text-foreground">
                  {g.name}
                </span>
              </label>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={saving || selectedGroupId === member.group_id || loading}
          >
            {saving ? "Moving..." : "Move Member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
