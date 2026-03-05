"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { getAvatarColor, getInitials } from "@/lib/avatar";
import type { GroupMessage } from "@/lib/types";

interface GroupConversationOverlayProps {
  messages: GroupMessage[];
  currentUserId: string | null;
  hasMore: boolean;
  onSend: (content: string) => void;
  onLoadMore: () => void;
  onClose: () => void;
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;

  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function GroupConversationOverlay({
  messages,
  currentUserId,
  hasMore,
  onSend,
  onLoadMore,
  onClose,
}: GroupConversationOverlayProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const wasAtBottomRef = useRef(true);

  // Track if user is scrolled to bottom
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 40;
    wasAtBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, []);

  // Auto-scroll on new messages (only if already at bottom)
  useEffect(() => {
    if (wasAtBottomRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Scroll to bottom on open
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  function handleSend() {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
    // Force scroll to bottom after send
    wasAtBottomRef.current = true;
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <aside className="right-sidebar-responsive w-[var(--right-sidebar)] bg-white border-l border-black/5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 flex-shrink-0">
        <h2 className="text-sm font-bold text-text-primary">
          Group Conversation
        </h2>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors"
        >
          <span className="material-icons-two-tone text-[18px] text-text-muted">
            close
          </span>
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-4"
      >
        {/* Load more */}
        {hasMore && (
          <div className="text-center pb-2">
            <button
              onClick={onLoadMore}
              className="text-xs font-medium text-accent-purple hover:underline"
            >
              Load older messages
            </button>
          </div>
        )}

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <span className="material-icons-two-tone text-[48px] text-text-muted/40 mb-3">
              chat_bubble_outline
            </span>
            <p className="text-sm text-text-muted">Start the conversation!</p>
          </div>
        )}

        {messages.map((msg) => {
          const isOwn = msg.sender_id === currentUserId;

          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${isOwn ? "flex-row-reverse" : ""}`}
            >
              {/* Avatar */}
              {msg.sender_avatar ? (
                <img
                  src={msg.sender_avatar}
                  alt={msg.sender_name || ""}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5"
                />
              ) : (
                <div
                  className={`w-8 h-8 rounded-full ${getAvatarColor(msg.sender_id)} flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5`}
                >
                  {getInitials(msg.sender_name)}
                </div>
              )}

              {/* Content */}
              <div
                className={`flex-1 min-w-0 ${isOwn ? "text-right" : ""}`}
              >
                <div
                  className={`flex items-baseline gap-2 ${isOwn ? "justify-end" : ""}`}
                >
                  <span className="text-xs font-semibold text-text-primary">
                    {msg.sender_name || "Unknown"}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    {formatRelativeTime(msg.created_at)}
                  </span>
                </div>
                <div
                  className={`inline-block mt-1 px-3 py-2 rounded-xl text-sm leading-relaxed max-w-[85%] ${
                    isOwn
                      ? "bg-accent-purple text-white rounded-tr-sm"
                      : "bg-black/[.04] text-text-secondary rounded-tl-sm"
                  } ${msg.id.startsWith("optimistic-") ? "opacity-70" : ""}`}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-black/5 flex-shrink-0">
        <div className="flex items-center gap-2 bg-black/[.03] rounded-xl px-3 py-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message your group..."
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-text-muted"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-opacity disabled:opacity-30"
            style={{
              background: "linear-gradient(135deg, #7C3AED, #9B5CF6)",
            }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
