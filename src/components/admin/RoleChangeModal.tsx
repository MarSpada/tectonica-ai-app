"use client";

import { useState } from "react";
import { ROLES, VALID_ROLES, isSuperAdmin } from "@/lib/constants/roles";
import type { UserRole } from "@/lib/types";
import { getRoleLabel } from "@/lib/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface RoleChangeMember {
  id: string;
  full_name: string | null;
  role: UserRole;
}

interface RoleChangeModalProps {
  member: RoleChangeMember;
  callerRole: UserRole;
  onConfirm: (memberId: string, newRole: UserRole) => void;
  onClose: () => void;
}

export default function RoleChangeModal({
  member,
  callerRole,
  onConfirm,
  onClose,
}: RoleChangeModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(member.role);
  const [saving, setSaving] = useState(false);

  const availableRoles: UserRole[] =
    isSuperAdmin(callerRole)
      ? [...VALID_ROLES]
      : [ROLES.MEMBER, ROLES.SUPPORTER];

  async function handleConfirm() {
    if (selectedRole === member.role) {
      onClose();
      return;
    }
    setSaving(true);
    await onConfirm(member.id, selectedRole);
    setSaving(false);
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Role</DialogTitle>
          <DialogDescription>
            {member.full_name || "Unknown"} — currently{" "}
            <strong className="text-foreground">{getRoleLabel(member.role)}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {availableRoles.map((r) => (
            <label
              key={r}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                selectedRole === r
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted"
              }`}
            >
              <input
                type="radio"
                name="role"
                value={r}
                checked={selectedRole === r}
                onChange={() => setSelectedRole(r)}
                className="accent-[var(--accent-purple)]"
              />
              <span className="text-sm font-medium text-foreground">
                {getRoleLabel(r)}
              </span>
            </label>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={saving || selectedRole === member.role}
          >
            {saving ? "Saving..." : "Update Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
