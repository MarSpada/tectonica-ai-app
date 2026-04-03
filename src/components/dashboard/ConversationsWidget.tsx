"use client";

import { Button } from "@/components/ui/button";
import type { GroupMessage } from "@/lib/types";

interface ConversationsWidgetProps {
  groupMessages: GroupMessage[];
  onOpenConversation?: () => void;
}

export default function ConversationsWidget({ groupMessages, onOpenConversation }: ConversationsWidgetProps) {
  return (
    <div className="h-full overflow-auto p-6 flex flex-col">
      <h3 className="text-sm font-semibold text-text-primary mb-3">Group Conversations</h3>
      <div className="space-y-2 flex-1">
        {groupMessages.length > 0 ? (
          groupMessages.slice(-3).map((msg) => (
            <p key={msg.id} className="text-sm text-text-primary truncate">
              <span className="font-semibold text-accent-purple">
                @{msg.sender_name || "Unknown"}
              </span>{" "}
              {msg.content}
            </p>
          ))
        ) : (
          <p className="text-sm text-text-muted">No messages yet</p>
        )}
      </div>
      <Button
        variant="outline"
        onClick={onOpenConversation}
        className="mt-auto self-start"
      >
        Open Conversation
      </Button>
    </div>
  );
}
