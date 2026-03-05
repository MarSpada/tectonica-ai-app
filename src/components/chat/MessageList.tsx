"use client";

import { useEffect, useRef } from "react";
import { type Message } from "@/lib/types";
import { type Bot, categoryMeta } from "@/lib/bots";

interface MessageListProps {
  messages: Message[];
  bot: Bot;
  userName: string;
  isStreaming: boolean;
}

export default function MessageList({
  messages,
  bot,
  userName,
  isStreaming,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
      {/* Welcome message */}
      {messages.length === 0 && (
        <div className="max-w-[720px]">
          <p className="text-xs font-semibold text-accent-purple mb-1">{bot.name}</p>
          <div
            className="rounded-[4px_16px_16px_16px] px-4 py-3 backdrop-blur-sm"
            style={{ backgroundColor: "rgba(255,255,255,.7)" }}
          >
            <p className="text-sm text-text-primary">
              Hi {userName}! I&apos;m the <strong>{bot.name}</strong>.{" "}
              {bot.description} How can I help you today?
            </p>
            <p className="text-[10px] text-text-muted mt-1.5">
              {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div className="max-w-[720px]">
            {/* Bot name label */}
            {msg.role === "assistant" && (
              <p className="text-xs font-semibold text-accent-purple mb-1">{bot.name}</p>
            )}

            <div className={`flex items-end gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              {msg.role === "user" && <UserAvatar name={userName} />}
              <div
                className={`px-4 py-3 text-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "rounded-[16px_4px_16px_16px]"
                    : "rounded-[4px_16px_16px_16px] backdrop-blur-sm"
                }`}
                style={{
                  backgroundColor:
                    msg.role === "user"
                      ? "rgba(124,58,237,.1)"
                      : "rgba(255,255,255,.7)",
                }}
              >
                {msg.content}
                {msg.role === "assistant" &&
                  isStreaming &&
                  i === messages.length - 1 &&
                  !msg.content && (
                    <span className="inline-block w-2 h-4 bg-text-muted animate-pulse rounded-sm" />
                  )}
              </div>
            </div>

            {/* Timestamp */}
            <p className={`text-[10px] text-text-muted mt-1 ${msg.role === "user" ? "text-right" : ""}`}>
              Just now
            </p>
          </div>
        </div>
      ))}

      <div ref={bottomRef} />
    </div>
  );
}

function UserAvatar({ name }: { name: string }) {
  return (
    <div className="w-8 h-8 rounded-full flex-shrink-0 bg-accent-purple/20 flex items-center justify-center text-[10px] font-semibold text-accent-purple">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
