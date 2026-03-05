"use client";

interface RecentConversationsProps {
  conversations: Array<{ id: string; title: string; updated_at: string }>;
  currentConversationId: string | null;
  onSelect: (conversationId: string) => void;
  onNewChat: () => void;
}

export default function RecentConversations({
  conversations,
  currentConversationId,
  onSelect,
  onNewChat,
}: RecentConversationsProps) {
  return (
    <aside className="w-[260px] border-l border-card-stroke bg-card-bg/50 backdrop-blur-md flex flex-col h-full">
      <div className="px-4 py-3 border-b border-card-stroke flex items-center justify-between">
        <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">
          Recent Conversations
        </h2>
        <button
          onClick={onNewChat}
          className="text-[10px] font-medium text-accent-purple hover:underline"
        >
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <p className="px-4 py-6 text-xs text-text-muted text-center">
            No conversations yet
          </p>
        ) : (
          <div className="py-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`w-full text-left px-4 py-2.5 transition-colors ${
                  conv.id === currentConversationId
                    ? "bg-accent-purple/10"
                    : "hover:bg-black/3"
                }`}
              >
                <p className="text-xs font-semibold text-text-primary truncate">
                  {conv.title || "Untitled"}
                </p>
                <p className="text-[10px] text-text-muted mt-0.5">
                  {formatRelativeTime(conv.updated_at)}
                </p>
              </button>
            ))}
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
