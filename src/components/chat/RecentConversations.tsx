"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import CreativeBrief, { SavedBriefs, type BriefRequirement } from "./CreativeBrief";

const MAX_VISIBLE = 10;

interface RecentConversationsProps {
  conversations: Array<{ id: string; title: string; updated_at: string }>;
  currentConversationId: string | null;
  onSelect: (conversationId: string) => void;
  onNewChat: () => void;
  onDeleteConversation?: (conversationId: string) => void;
  onUseBrief?: (briefContent: string) => void;
  briefRequirements?: BriefRequirement[];
  isImageBot?: boolean;
}

export default function RecentConversations({
  conversations,
  currentConversationId,
  onSelect,
  onNewChat,
  onDeleteConversation,
  onUseBrief,
  briefRequirements = [],
  isImageBot = false,
}: RecentConversationsProps) {
  const [showAll, setShowAll] = useState(false);
  const [chatsExpanded, setChatsExpanded] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const visibleConversations = showAll
    ? conversations
    : conversations.slice(0, MAX_VISIBLE);
  const hasMore = conversations.length > MAX_VISIBLE;

  function handleDelete(e: React.MouseEvent, convId: string) {
    e.stopPropagation();
    if (deletingId === convId) {
      // Second click = confirm
      onDeleteConversation?.(convId);
      setDeletingId(null);
    } else {
      // First click = show confirm state
      setDeletingId(convId);
      // Auto-reset after 3 seconds
      setTimeout(() => setDeletingId((prev) => (prev === convId ? null : prev)), 3000);
    }
  }

  return (
    <aside className="w-[320px] border-l border-card-stroke bg-card-bg/50 backdrop-blur-md flex flex-col h-full">
      <div className="px-4 py-3 border-b border-card-stroke flex items-center justify-end">
        <button
          onClick={onNewChat}
          className="text-[10px] font-medium text-accent-purple hover:underline"
        >
          + New Chat
        </button>
      </div>

      {/* Creative Brief — live from [REQ:] tags */}
      <CreativeBrief requirements={briefRequirements} />

      {/* Saved Briefs — only for image-capable bots */}
      <SavedBriefs isImageBot={isImageBot} onUseBrief={onUseBrief} />

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <p className="px-4 py-6 text-xs text-text-muted text-center">
            No conversations yet
          </p>
        ) : (
          <div>
            {/* Past Chats header — collapsible */}
            <button
              onClick={() => setChatsExpanded(!chatsExpanded)}
              className="w-full px-4 py-2.5 border-t border-card-stroke flex items-center justify-between hover:bg-black/3 transition-colors"
            >
              <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                Past Chats
                <span className="font-normal ml-1">({conversations.length})</span>
              </h3>
              <Icon name={chatsExpanded ? "arrow-up" : "arrow-down"} size={10} className="opacity-40" />
            </button>
            {chatsExpanded && visibleConversations.map((conv) => (
              <div
                key={conv.id}
                className={`group relative flex items-center transition-colors ${
                  conv.id === currentConversationId
                    ? "bg-accent-purple/10"
                    : "hover:bg-black/3"
                }`}
              >
                <button
                  onClick={() => onSelect(conv.id)}
                  className="flex-1 text-left px-4 py-2.5"
                >
                  <p className="text-xs font-semibold text-text-primary truncate pr-6">
                    {conv.title || "Untitled"}
                  </p>
                  <p className="text-[10px] text-text-muted mt-0.5">
                    {formatRelativeTime(conv.updated_at)}
                  </p>
                </button>
                {/* Delete button — visible on hover */}
                {onDeleteConversation && (
                  <button
                    onClick={(e) => handleDelete(e, conv.id)}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                      deletingId === conv.id
                        ? "bg-red-100 text-red-600 opacity-100"
                        : "opacity-0 group-hover:opacity-100 hover:bg-red-50 text-text-muted hover:text-red-500"
                    }`}
                    title={deletingId === conv.id ? "Click again to confirm" : "Delete conversation"}
                  >
                    <Icon name={deletingId === conv.id ? "check" : "close"} size={12} />
                  </button>
                )}
              </div>
            ))}
            {/* Show all / Show less */}
            {chatsExpanded && hasMore && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full px-4 py-2 text-[10px] font-medium text-accent-purple hover:underline text-center"
              >
                {showAll ? "Show less" : `Show all ${conversations.length}`}
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
