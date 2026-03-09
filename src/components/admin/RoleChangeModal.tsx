"use client";

import { useState } from "react";
import type { UserRole } from "@/lib/types";
import { getRoleLabel } from "@/lib/avatar";

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
    callerRole === "super_admin"
      ? ["super_admin", "group_admin", "member", "supporter"]
      : ["member", "supporter"];

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-card-bg rounded-xl border border-card-stroke p-6 w-full max-w-sm shadow-lg">
        <h3 className="text-sm font-semibold text-text-primary mb-1">
          Change Role
        </h3>
        <p className="text-xs text-text-muted mb-4">
          {member.full_name || "Unknown"} — currently{" "}
          <strong>{getRoleLabel(member.role)}</strong>
        </p>

        <div className="space-y-2 mb-5">
          {availableRoles.map((r) => (
            <label
              key={r}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                selectedRole === r
                  ? "border-accent-purple bg-accent-purple/5"
                  : "border-black/5 hover:bg-black/[0.02]"
              }`}
            >
              <input
                type="radio"
                name="role"
                value={r}
                checked={selectedRole === r}
                onChange={() => setSelectedRole(r)}
                className="accent-accent-purple"
              />
              <span className="text-sm font-medium text-text-primary">
                {getRoleLabel(r)}
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
            disabled={saving || selectedRole === member.role}
            className="px-4 py-2 text-sm font-medium text-white bg-accent-purple rounded-lg hover:bg-accent-purple/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Update Role"}
          </button>
        </div>
      </div>
    </div>
  );
}
