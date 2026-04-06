"use client";

import { useState, useCallback } from "react";
import { type Bot } from "@/lib/bots";
import { type Message } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import RecentConversations from "./RecentConversations";
import { Icon } from "@/components/ui/icon";

interface ChatViewProps {
  bot: Bot;
  userName: string;
  recentConversations: Array<{ id: string; title: string; updated_at: string }>;
}

export default function ChatView({
  bot,
  userName,
  recentConversations: initialConversations,
}: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState(initialConversations);
  const [notConfigured, setNotConfigured] = useState(false);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    // Add placeholder assistant message
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botId: bot.id,
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          conversationId,
        }),
      });

      if (!response.ok) {
        if (response.status === 503) {
          try {
            const errJson = await response.json();
            if (errJson.error === "not_configured") {
              setNotConfigured(true);
              setMessages([]);
              setIsStreaming(false);
              return;
            }
          } catch {
            // Fall through to generic error
          }
        }
        throw new Error(`Chat request failed: ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);

            if (parsed.error) {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: `Sorry, something went wrong: ${parsed.error}`,
                };
                return updated;
              });
              continue;
            }

            if (parsed.conversationId) {
              setConversationId(parsed.conversationId);
              continue;
            }

            if (parsed.content) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                updated[updated.length - 1] = {
                  ...last,
                  content: last.content + parsed.content,
                };
                return updated;
              });
            }
          } catch {
            // Skip malformed SSE chunks
          }
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content:
            err instanceof Error
              ? `Connection error: ${err.message}`
              : "Something went wrong. Please try again.",
        };
        return updated;
      });
    }

    setIsStreaming(false);
  }, [input, isStreaming, messages, bot.id, conversationId]);

  async function loadConversation(convId: string) {
    setConversationId(convId);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("messages")
        .select("role, content, created_at")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });

      if (data) {
        setMessages(
          data.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }))
        );
      }
    } catch {
      // Tables may not exist
    }
  }

  function startNewChat() {
    setMessages([]);
    setConversationId(null);
    setInput("");
  }

  return (
    <div className="flex-1 flex overflow-hidden bg-content-bg">
      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-bg">
        <ChatHeader bot={bot} />
        {notConfigured ? (
          <div className="flex-1 flex items-center justify-center px-8">
            <div className="text-center max-w-sm">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                <Icon name="info" size={24} className="text-amber-600" />
              </div>
              <p className="text-sm font-medium text-text-primary mb-1">
                This bot is not yet configured
              </p>
              <p className="text-xs text-text-muted">
                Please contact your administrator to set up the AI model connection.
              </p>
            </div>
          </div>
        ) : (
          <>
            <MessageList
              messages={messages}
              bot={bot}
              userName={userName}
              isStreaming={isStreaming}
            />
            <ChatInput
              value={input}
              onChange={setInput}
              onSend={sendMessage}
              isStreaming={isStreaming}
            />
          </>
        )}
      </div>

      {/* Recent conversations sidebar */}
      <RecentConversations
        conversations={conversations}
        currentConversationId={conversationId}
        onSelect={loadConversation}
        onNewChat={startNewChat}
      />
    </div>
  );
}
