"use client";

import type { Member } from "@/lib/types";
import {
  getAvatarColor,
  getInitials,
  getRoleBadgeStyle,
  getRoleLabel,
} from "@/lib/avatar";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MemberDetailModalProps {
  member: Member | null;
  onClose: () => void;
}

export default function MemberDetailModal({
  member,
  onClose,
}: MemberDetailModalProps) {
  if (!member) return null;

  const badge = getRoleBadgeStyle(member.role);
  const joinDate = new Date(member.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-1">
          {member.avatar_url ? (
            <img
              src={member.avatar_url}
              alt={member.full_name || "Member"}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div
              className={`w-20 h-20 rounded-full ${getAvatarColor(member.id)} flex items-center justify-center text-2xl font-bold text-white`}
            >
              {getInitials(member.full_name)}
            </div>
          )}

          <h2 className="mt-3 text-lg font-bold text-text-primary">
            {member.full_name || "Unknown"}
          </h2>

          <Badge variant="outline" className={`mt-1 text-xs ${badge.bg} ${badge.text}`}>
            {getRoleLabel(member.role)}
          </Badge>
        </div>

        {/* Divider */}
        <div className="border-t border-black/5 my-2" />

        {/* Info rows */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="material-icons-two-tone text-[18px] text-text-muted">
              mail
            </span>
            <span className="text-sm text-text-secondary">{member.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="material-icons-two-tone text-[18px] text-text-muted">
              calendar_today
            </span>
            <span className="text-sm text-text-secondary">
              Joined {joinDate}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            disabled
            className="flex-1 border-accent-purple/30 text-accent-purple"
          >
            Send Message
          </Button>
          <Button
            variant="outline"
            disabled
            className="flex-1"
          >
            View Activity
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
