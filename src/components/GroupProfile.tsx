"use client";

import Link from "next/link";

interface GroupProfileProps {
  name: string;
  description: string;
  memberCount: number;
  orgName: string;
}

export default function GroupProfile({
  name,
  description,
  memberCount,
  orgName,
}: GroupProfileProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-content-bg">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors mb-6"
        >
          <span className="material-icons-two-tone text-[16px]">arrow_back</span>
          Back to dashboard
        </Link>

        {/* Group header */}
        <div className="bg-card-bg rounded-2xl border border-card-stroke overflow-hidden">
          {/* Banner */}
          <div className="h-24 bg-gradient-to-r from-accent-purple/20 to-accent-purple/5" />

          {/* Content */}
          <div className="px-6 pb-6 -mt-6">
            {/* Group icon */}
            <div className="w-16 h-16 rounded-2xl bg-accent-purple flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-4">
              {name.charAt(0).toUpperCase()}
            </div>

            <h1 className="text-xl font-bold text-text-primary">{name}</h1>
            <p className="text-sm text-text-muted mt-1">
              Part of <strong>{orgName}</strong>
            </p>

            {/* Stats */}
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-1.5">
                <span className="material-icons-two-tone text-[16px] text-text-muted">
                  groups
                </span>
                <span className="text-sm text-text-secondary">
                  {memberCount} member{memberCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-6 bg-card-bg rounded-2xl border border-card-stroke p-6">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3">
            About this group
          </h2>
          {description ? (
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
              {description}
            </p>
          ) : (
            <p className="text-sm text-text-muted italic">
              No description yet. An admin can add one in the Admin panel.
            </p>
          )}
        </div>

        {/* Quick links */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link
            href="/members"
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card-bg border border-card-stroke hover:border-accent-purple/30 transition-colors"
          >
            <span className="material-icons-two-tone text-[20px] text-accent-purple">
              groups
            </span>
            <div>
              <p className="text-sm font-medium text-text-primary">Members</p>
              <p className="text-[11px] text-text-muted">View group directory</p>
            </div>
          </Link>
          <Link
            href="/media"
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card-bg border border-card-stroke hover:border-accent-purple/30 transition-colors"
          >
            <span className="material-icons-two-tone text-[20px] text-accent-purple">
              perm_media
            </span>
            <div>
              <p className="text-sm font-medium text-text-primary">Media</p>
              <p className="text-[11px] text-text-muted">Group media gallery</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
