"use client";

import { useRef, useEffect } from "react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isStreaming: boolean;
  placeholder?: string;
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  isStreaming,
  placeholder = "Type a message...",
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  return (
    <div
      className="px-4 py-3 backdrop-blur-md"
      style={{ backgroundColor: "rgba(212, 192, 253, .85)" }}
    >
      <div className="flex items-end gap-3 max-w-3xl mx-auto">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-black/10 bg-white/70 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple/50 placeholder:text-text-muted"
        />
        {/* Mic button */}
        <button
          className="w-10 h-10 rounded-full flex items-center justify-center text-text-muted hover:bg-white/30 transition-colors"
          title="Voice input"
        >
          <span className="material-icons-two-tone text-[20px]">mic</span>
        </button>
        {/* Send button — gradient purple circle */}
        <button
          onClick={onSend}
          disabled={!value.trim() || isStreaming}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: "linear-gradient(135deg, #7C3AED 0%, #9B5CF6 100%)",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
