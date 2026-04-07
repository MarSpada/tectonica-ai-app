"use client";

import { useState, useRef, useEffect } from "react";
import { Icon } from "@/components/ui/icon";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isStreaming: boolean;
  placeholder?: string;
  isImageBot?: boolean;
  onImageUpload?: (base64: string) => void;
  onFileAttach?: (content: string, fileName: string) => void;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_TEXT_SIZE = 500 * 1024; // 500KB for text files

/** MIME types accepted for text file attachments */
const TEXT_MIME_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "text/html",
  "application/json",
  "application/xml",
  "text/xml",
]);

/** File extensions we accept as text (fallback when MIME is unreliable) */
const TEXT_EXTENSIONS = new Set([
  "txt", "md", "csv", "json", "xml", "html", "htm",
  "yml", "yaml", "toml", "ini", "cfg", "log",
  "js", "ts", "jsx", "tsx", "py", "rb", "java", "go", "rs",
  "css", "scss", "less", "sql",
]);

function isTextFile(file: File): boolean {
  if (TEXT_MIME_TYPES.has(file.type)) return true;
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  return TEXT_EXTENSIONS.has(ext);
}

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  isStreaming,
  placeholder = "Type a message...",
  isImageBot,
  onImageUpload,
  onFileAttach,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);

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
      handleSend();
    }
  }

  function handleSend() {
    if (attachedFile && onFileAttach) {
      // Send file content with any typed message as context
      const prefix = value.trim()
        ? `${value.trim()}\n\n`
        : "Please read the attached file and use it as context for creating an image:\n\n";
      onFileAttach(`${prefix}---\nFile: ${attachedFile.name}\n---\n${attachedFile.content}`, attachedFile.name);
      setAttachedFile(null);
      onChange("");
    } else {
      onSend();
    }
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
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
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Route images to the image handler
    if (isImageFile(file) && onImageUpload) {
      if (file.size > MAX_IMAGE_SIZE) {
        alert("Image must be smaller than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => onImageUpload(reader.result as string);
      reader.readAsDataURL(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Text files
    if (isTextFile(file)) {
      if (file.size > MAX_TEXT_SIZE) {
        alert("Text file must be smaller than 500KB");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedFile({ name: file.name, content: reader.result as string });
      };
      reader.readAsText(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    alert("Unsupported file type. Please attach an image or a text file (.txt, .md, .csv, .json, etc.)");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div
      className="px-4 py-3 backdrop-blur-md"
      style={{ backgroundColor: "var(--chat-input-bg)" }}
    >
      {/* Attached file preview */}
      {attachedFile && (
        <div className="max-w-3xl mx-auto mb-2 flex items-center gap-2 rounded-lg bg-white/60 border border-black/10 px-3 py-2 text-sm">
          <Icon name="file-attachment" size={16} className="opacity-50 shrink-0" />
          <span className="truncate text-text-secondary">{attachedFile.name}</span>
          <button
            onClick={() => setAttachedFile(null)}
            className="ml-auto shrink-0 w-5 h-5 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors"
            title="Remove attachment"
          >
            <span className="text-xs text-text-muted">✕</span>
          </button>
        </div>
      )}

      <div className="flex items-end gap-3 max-w-3xl mx-auto">
        {/* Image upload button — image bots only */}
        {isImageBot && onImageUpload && (
          <>
            <button
              onClick={() => imageInputRef.current?.click()}
              disabled={isStreaming}
              className="w-10 h-10 rounded-full flex items-center justify-center text-text-muted hover:bg-white/30 transition-colors disabled:opacity-40"
              title="Attach image"
            >
              <Icon name="file-image" size={20} className="opacity-60" />
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </>
        )}

        {/* File attachment button — image bots get both buttons, other bots get just this */}
        {(onFileAttach || (!isImageBot && onImageUpload)) && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming}
              className="w-10 h-10 rounded-full flex items-center justify-center text-text-muted hover:bg-white/30 transition-colors disabled:opacity-40"
              title="Attach file"
            >
              <Icon name="file-attachment" size={20} className="opacity-60" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.csv,.json,.xml,.html,.yml,.yaml,.toml,.log,.js,.ts,.jsx,.tsx,.py,.rb,.java,.go,.rs,.css,.scss,.sql"
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
          placeholder={attachedFile ? `Add instructions for "${attachedFile.name}"...` : placeholder}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-black/10 bg-white/70 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple/50 placeholder:text-text-muted"
        />
        {/* Send button — gradient purple circle */}
        <button
          onClick={handleSend}
          disabled={(!value.trim() && !attachedFile) || isStreaming}
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
