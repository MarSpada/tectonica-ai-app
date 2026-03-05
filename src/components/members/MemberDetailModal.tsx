"use client";

import type { Member } from "@/lib/types";
import {
  getAvatarColor,
  getInitials,
  getRoleBadgeStyle,
  getRoleLabel,
} from "@/lib/avatar";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card-bg rounded-2xl shadow-xl max-w-md w-full mx-4 p-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-black/5 transition-colors"
        >
          <span className="material-icons-two-tone text-[20px] text-text-muted">
            close
          </span>
        </button>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-5">
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

          <span
            className={`mt-1 text-xs font-semibold px-3 py-1 rounded-full ${badge.bg} ${badge.text}`}
          >
            {getRoleLabel(member.role)}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-black/5 my-4" />

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
        <div className="flex gap-3 mt-6">
          <button
            disabled
            className="flex-1 px-4 py-2 text-sm font-medium text-accent-purple border border-accent-purple/30 rounded-xl hover:bg-accent-purple/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send Message
          </button>
          <button
            disabled
            className="flex-1 px-4 py-2 text-sm font-medium text-text-secondary border border-black/10 rounded-xl hover:bg-black/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            View Activity
          </button>
        </div>
      </div>
    </div>
  );
}
