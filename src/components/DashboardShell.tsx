"use client";

import { useState } from "react";
import AppShell from "./AppShell";
import BotGrid from "./BotGrid";
import RightSidebar from "./RightSidebar";
import GroupConversationOverlay from "./GroupConversationOverlay";
import { useGroupMessages } from "@/hooks/useGroupMessages";

interface DashboardShellProps {
  userName: string;
  initialFavorites?: string[];
}

export default function DashboardShell({
  userName,
  initialFavorites,
}: DashboardShellProps) {
  const [conversationOpen, setConversationOpen] = useState(false);
  const [welcomeExpanded, setWelcomeExpanded] = useState(false);
  const { messages, sendMessage, loadMore, hasMore, currentUserId } =
    useGroupMessages();

  return (
    <AppShell userName={userName}>
      <BotGrid
        userName={userName.split(" ")[0]}
        initialFavorites={initialFavorites}
        onWelcomeExpandChange={setWelcomeExpanded}
      />
      {conversationOpen ? (
        <GroupConversationOverlay
          messages={messages}
          currentUserId={currentUserId}
          hasMore={hasMore}
          onSend={sendMessage}
          onLoadMore={loadMore}
          onClose={() => setConversationOpen(false)}
        />
      ) : (
        <RightSidebar
          groupMessages={messages}
          onOpenConversation={() => setConversationOpen(true)}
        />
      )}
    </AppShell>
  );
}
