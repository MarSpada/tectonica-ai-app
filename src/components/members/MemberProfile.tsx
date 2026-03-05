"use client";

import Link from "next/link";
import type { Member } from "@/lib/types";
import {
  getAvatarColor,
  getInitials,
  getRoleBadgeStyle,
  getRoleLabel,
} from "@/lib/avatar";

interface MemberProfileProps {
  member: Member;
  bio: string | null;
}

export default function MemberProfile({ member, bio }: MemberProfileProps) {
  const badge = getRoleBadgeStyle(member.role);
  const joinDate = new Date(member.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5">
        <Link
          href="/members"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors mb-4"
        >
          <span className="material-icons-two-tone text-[18px]">
            arrow_back
          </span>
          Back to Directory
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="max-w-xl mx-auto">
          <div className="bg-card-bg rounded-2xl border border-card-stroke p-8">
            {/* Avatar + Name */}
            <div className="flex flex-col items-center mb-6">
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt={member.full_name || "Member"}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div
                  className={`w-24 h-24 rounded-full ${getAvatarColor(member.id)} flex items-center justify-center text-3xl font-bold text-white`}
                >
                  {getInitials(member.full_name)}
                </div>
              )}

              <h1 className="mt-4 text-xl font-bold text-text-primary">
                {member.full_name || "Unknown"}
              </h1>

              <span
                className={`mt-2 text-xs font-semibold px-3 py-1 rounded-full ${badge.bg} ${badge.text}`}
              >
                {getRoleLabel(member.role)}
              </span>
            </div>

            {/* Bio */}
            {bio && (
              <p className="text-sm text-text-secondary text-center mb-6">
                {bio}
              </p>
            )}

            {/* Divider */}
            <div className="border-t border-black/5 my-5" />

            {/* Info rows */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="material-icons-two-tone text-[20px] text-text-muted">
                  mail
                </span>
                <span className="text-sm text-text-secondary">
                  {member.email}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-icons-two-tone text-[20px] text-text-muted">
                  calendar_today
                </span>
                <span className="text-sm text-text-secondary">
                  Joined {joinDate}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-8">
              <button
                disabled
                className="flex-1 px-4 py-2.5 text-sm font-medium text-accent-purple border border-accent-purple/30 rounded-xl hover:bg-accent-purple/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Message
              </button>
              <button
                disabled
                className="flex-1 px-4 py-2.5 text-sm font-medium text-text-secondary border border-black/10 rounded-xl hover:bg-black/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                View Activity
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
