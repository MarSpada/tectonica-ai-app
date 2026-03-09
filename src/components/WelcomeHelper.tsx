"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useUserProfile } from "@/lib/UserProfileContext";
import { type Message } from "@/lib/types";

interface WelcomeHelperProps {
  userName: string;
  onExpandChange?: (expanded: boolean) => void;
}

export default function WelcomeHelper({
  userName,
  onExpandChange,
}: WelcomeHelperProps) {
  const { profile } = useUserProfile();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesAreaRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const expandedInputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll messages area to bottom when messages change (without affecting parent scroll)
  // Also keep parent container pinned to top so the chat header never scrolls away
  useEffect(() => {
    if (isExpanded) {
      // Scroll only the inner messages area to the bottom
      if (messagesAreaRef.current) {
        messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
      }
      // Keep the parent BotGrid scroll pinned to top
      const scrollParent = containerRef.current?.closest(".overflow-y-auto");
      if (scrollParent) {
        scrollParent.scrollTop = 0;
      }
    }
  }, [messages, isExpanded]);

  // When expanding: focus the input
  useEffect(() => {
    if (isExpanded) {
      requestAnimationFrame(() => {
        expandedInputRef.current?.focus();
      });
    }
  }, [isExpanded]);

  // Notify parent of expand/collapse
  function setExpanded(val: boolean) {
    setIsExpanded(val);
    onExpandChange?.(val);
  }

  const sendMessageWithContent = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      const userMessage: Message = { role: "user", content: content.trim() };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setInput("");
      setIsStreaming(true);

      // Auto-expand on first message
      if (!isExpanded) {
        setExpanded(true);
      }

      // Add placeholder assistant message
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            botId: "welcome",
            messages: newMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            conversationId,
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
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isStreaming, messages, conversationId, isExpanded]
  );

  function handleSend() {
    sendMessageWithContent(input);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSuggestionClick() {
    const suggestion =
      "I'm not sure which helper I need. Can you help me figure out where to start?";
    sendMessageWithContent(suggestion);
  }

  function handleMinimize() {
    setExpanded(false);
  }

  function handleInputFocus() {
    if (!isExpanded) {
      setExpanded(true);
    }
  }

  // Role-based subtitle
  const role = profile?.role || "member";
  const subtitle =
    role === "super_admin"
      ? "Thank you for being a Super Admin."
      : role === "group_admin"
        ? "Thank you for being a Group Admin."
        : "Thank you for being a Member.";

  // --- COLLAPSED STATE ---
  if (!isExpanded) {
    return (
      <div className="bg-white/70 rounded-2xl p-6 mb-6 backdrop-blur-sm border border-black/5">
        <h1 className="text-xl font-bold text-text-primary">
          Welcome back, {userName}.
        </h1>
        <p className="text-sm text-accent-purple font-medium mt-0.5">
          {subtitle}
        </p>

        <p className="text-sm text-text-secondary mt-3 leading-relaxed">
          I&apos;m here to help you with anything that you need for managing a
          group. We have a variety of helpers that will help you out, so you can
          start by simply telling me what we&apos;re trying to do.
        </p>

        {/* Clickable suggestion */}
        <button
          onClick={handleSuggestionClick}
          className="w-full text-left bg-white/50 rounded-xl p-4 mt-4 cursor-pointer hover:bg-white/70 transition-colors border border-black/5"
        >
          <p className="text-sm text-text-muted italic">
            Not sure what kind of specific help you need? Just let me know what
            you need and we can figure it out together...
          </p>
        </button>

        {/* Input — expands chat on focus */}
        <div className="flex items-center gap-2 mt-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            placeholder="Start typing..."
            rows={1}
            className="flex-1 px-4 py-2.5 text-sm bg-white rounded-xl border border-black/10 placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-purple/30 resize-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="px-4 py-2.5 rounded-xl bg-accent-purple text-white text-sm font-medium hover:bg-accent-purple/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-icons-two-tone text-[18px]">send</span>
          </button>
        </div>

        <p className="text-xs text-text-muted mt-3">
          You can also start with a specific helper below....
        </p>
      </div>
    );
  }

  // --- EXPANDED STATE ---
  return (
    <div
      ref={containerRef}
      className="bg-white/70 rounded-2xl backdrop-blur-sm border border-black/5 mb-6 flex flex-col transition-all duration-300"
      style={{ height: "70vh" }}
    >
      {/* Compact header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-black/5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="material-icons-two-tone text-accent-purple text-[20px]">
            waving_hand
          </span>
          <span className="text-sm font-semibold text-text-primary">
            Welcome Helper
          </span>
          {isStreaming && (
            <span className="text-xs text-text-muted animate-pulse">
              typing...
            </span>
          )}
        </div>
        <button
          onClick={handleMinimize}
          className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
          title="Minimize"
        >
          <span className="material-icons-two-tone text-[18px] text-text-muted">
            minimize
          </span>
        </button>
      </div>

      {/* Messages area */}
      <div ref={messagesAreaRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-0">
        {/* Show welcome text when no messages yet */}
        {messages.length === 0 && (
          <div className="text-sm text-text-secondary leading-relaxed space-y-2 pb-2">
            <p className="font-semibold text-base text-text-primary">
              Welcome back, {userName}.
            </p>
            <p className="text-accent-purple font-medium">{subtitle}</p>
            <p>
              I&apos;m here to help you with anything that you need for managing a
              group. We have a variety of helpers that will help you out, so you can
              start by simply telling me what we&apos;re trying to do.
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-accent-purple/10 text-text-primary rounded-[16px_4px_16px_16px]"
                  : "bg-white/80 text-text-primary rounded-[4px_16px_16px_16px] border border-black/5"
              }`}
            >
              {msg.role === "assistant" ? (
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: msg.content
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      .replace(/\n/g, "<br/>"),
                  }}
                />
              ) : (
                msg.content
              )}
              {msg.role === "assistant" &&
                i === messages.length - 1 &&
                isStreaming &&
                !msg.content && (
                  <span className="inline-block w-2 h-4 bg-accent-purple/40 animate-pulse rounded-sm" />
                )}
            </div>
          </div>
        ))}
      </div>

      {/* Input bar */}
      <div className="flex items-center gap-2 px-5 py-3 border-t border-black/5 flex-shrink-0">
        <textarea
          ref={expandedInputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Start typing..."
          rows={1}
          className="flex-1 px-4 py-2.5 text-sm bg-white rounded-xl border border-black/10 placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-purple/30 resize-none"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
          className="px-4 py-2.5 rounded-xl bg-accent-purple text-white text-sm font-medium hover:bg-accent-purple/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="material-icons-two-tone text-[18px]">send</span>
        </button>
      </div>
    </div>
  );
}
