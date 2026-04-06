"use client";

import { useRef, useEffect } from "react";
import { Icon } from "@/components/ui/icon";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isStreaming: boolean;
  placeholder?: string;
  isImageBot?: boolean;
  onImageUpload?: (base64: string) => void;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export default function ChatInput({
  value,
  onChange,
  onSend,
  isStreaming,
  placeholder = "Type a message...",
  isImageBot,
  onImageUpload,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !onImageUpload) return;

    if (file.size > MAX_IMAGE_SIZE) {
      alert("Image must be smaller than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      onImageUpload(result);
    };
    reader.readAsDataURL(file);

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div
      className="px-4 py-3 backdrop-blur-md"
      style={{ backgroundColor: "var(--chat-input-bg)" }}
    >
      <div className="flex items-end gap-3 max-w-3xl mx-auto">
        {/* Image upload button — only for image-capable bots */}
        {isImageBot && onImageUpload && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming}
              className="w-10 h-10 rounded-full flex items-center justify-center text-text-muted hover:bg-white/30 transition-colors disabled:opacity-40"
              title="Attach image"
            >
              <Icon name="file-image" size={20} className="opacity-60" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </>
        )}

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
          <Icon name="microphone" size={20} className="opacity-60" />
        </button>
        {/* Send button — gradient purple circle */}
        <button
          onClick={onSend}
          disabled={!value.trim() || isStreaming}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: "var(--gradient-purple)",
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
