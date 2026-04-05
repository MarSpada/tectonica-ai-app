"use client";

import type { GroupMessage } from "@/lib/types";

interface ConversationsWidgetProps {
  groupMessages: GroupMessage[];
  onOpenConversation?: () => void;
}

export default function ConversationsWidget({ groupMessages, onOpenConversation }: ConversationsWidgetProps) {
  return (
    <div className="h-full overflow-auto p-5 flex flex-col">
      <h3 className="font-bold mb-3" style={{ fontSize: "var(--widget-title-size)", color: "var(--widget-text-color)" }}>Group Conversations</h3>
      <div className="space-y-2 flex-1">
        {groupMessages.length > 0 ? (
          groupMessages.slice(-3).map((msg) => (
            <p key={msg.id} className="truncate" style={{ fontSize: "var(--widget-list-primary-size)", color: "var(--widget-text-color)" }}>
              <span className="font-semibold text-accent-purple">
                @{msg.sender_name || "Unknown"}
              </span>{" "}
              {msg.content}
            </p>
          ))
        ) : (
          <p style={{ fontSize: "var(--widget-list-primary-size)", color: "var(--widget-text-muted)" }}>No messages yet</p>
        )}
      </div>
      <button
        onClick={onOpenConversation}
        className="widget-cta-btn mt-auto w-full rounded-sm text-white font-semibold cursor-pointer"
        style={{ backgroundColor: "var(--widget-btn-conversations)", fontSize: "var(--widget-btn-label-size)", padding: "8px 0" }}
      >
        Open Conversation
      </button>
    </div>
  );
}
