"use client";

import { useState } from "react";
import type { ApprovalComment } from "@/lib/types";
import { getAvatarColor, getInitials } from "@/lib/avatar";

function Avatar({ name, url }: { name: string; url?: string | null }) {
  if (url) {
    return <img src={url} alt={name} className="w-7 h-7 rounded-full object-cover shrink-0" />;
  }
  const bg = getAvatarColor(name);
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[10px] shrink-0"
      style={{ backgroundColor: bg }}
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

interface CommentThreadProps {
  comments: ApprovalComment[];
  currentUserId: string;
  submitterId: string;
  onAddComment: (content: string) => Promise<void>;
}

export default function CommentThread({
  comments,
  currentUserId,
  submitterId,
  onAddComment,
}: CommentThreadProps) {
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!newComment.trim() || sending) return;
    setSending(true);
    try {
      await onAddComment(newComment.trim());
      setNewComment("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Comments</h4>

      {comments.length === 0 && (
        <p className="text-[11px] text-text-muted italic">No comments yet.</p>
      )}

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {comments.map((c) => {
          const isSubmitter = c.author_id === submitterId;
          return (
            <div
              key={c.id}
              className={`rounded-lg p-3 ${isSubmitter ? "bg-purple-50" : "bg-gray-50"}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Avatar name={c.author_name || "?"} url={c.author_avatar} />
                <span className="text-xs font-medium text-text-primary">{c.author_name}</span>
                <span className="text-[10px] text-text-muted ml-auto">{timeAgo(c.created_at)}</span>
              </div>
              <p className="text-xs text-text-secondary whitespace-pre-wrap pl-9">{c.content}</p>
              {c.attachments && c.attachments.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1 pl-9">
                  {c.attachments.map((a, i) => (
                    <a
                      key={i}
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-accent-purple hover:underline flex items-center gap-0.5"
                    >
                      <span className="material-icons-two-tone text-[12px]">attach_file</span>
                      {a.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Comment input */}
      <div className="flex gap-2 pt-2 border-t border-black/5">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          className="flex-1 px-3 py-2 text-xs border border-black/10 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-accent-purple"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button
          onClick={handleSend}
          disabled={!newComment.trim() || sending}
          className="self-end px-3 py-2 text-xs font-semibold text-white bg-accent-purple rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {sending ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
