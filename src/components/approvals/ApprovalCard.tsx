"use client";

import type { ApprovalRequest } from "@/lib/types";
import { getAvatarColor, getInitials } from "@/lib/avatar";
import StatusBadge from "./StatusBadge";

function Avatar({ name, url, size = 24 }: { name: string; url?: string | null; size?: number }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  const bg = getAvatarColor(name);
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold"
      style={{ width: size, height: size, backgroundColor: bg, fontSize: size * 0.4 }}
    >
      {getInitials(name)}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

interface ApprovalCardProps {
  request: ApprovalRequest;
  onClick: () => void;
}

export default function ApprovalCard({ request, onClick }: ApprovalCardProps) {
  const attachmentCount = request.attachments?.length || 0;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card-bg border border-card-stroke rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-text-primary line-clamp-2">{request.title}</h3>
        <StatusBadge status={request.status} />
      </div>

      {request.description && (
        <p className="text-[11px] text-text-muted line-clamp-2 mb-3">{request.description}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Avatar name={request.submitter_name || "?"} url={request.submitter_avatar} size={20} />
            <span className="text-[10px] text-text-secondary">{request.submitter_name}</span>
          </div>
          <span className="text-[10px] text-text-muted">→</span>
          <div className="flex items-center gap-1.5">
            <Avatar name={request.reviewer_name || "?"} url={request.reviewer_avatar} size={20} />
            <span className="text-[10px] text-text-secondary">{request.reviewer_name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-text-muted">
          {attachmentCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px]">
              <span className="material-icons-two-tone text-[14px]">attach_file</span>
              {attachmentCount}
            </span>
          )}
          <span className="text-[10px]">{timeAgo(request.created_at)}</span>
        </div>
      </div>
    </button>
  );
}
