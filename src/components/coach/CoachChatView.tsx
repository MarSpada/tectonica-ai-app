"use client";

import { useState, useCallback } from "react";
import { type Bot } from "@/lib/bots";
import { type Message } from "@/lib/types";
import ChatHeader from "../chat/ChatHeader";
import MessageList from "../chat/MessageList";
import ChatInput from "../chat/ChatInput";
import CampaignStats from "./CampaignStats";

interface CoachChatViewProps {
  bot: Bot;
  userName: string;
}

export default function CoachChatView({ bot, userName }: CoachChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

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
        }),
      });

      if (!response.ok) {
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
  }, [input, isStreaming, messages, bot.id]);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-bg">
        <ChatHeader bot={bot} />
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
          placeholder="Ask your campaign coach..."
        />
      </div>

      {/* Campaign stats sidebar */}
      <CampaignStats />
    </div>
  );
}
