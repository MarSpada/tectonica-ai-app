"use client";

import { useEffect, useRef, useState } from "react";
import { type Message } from "@/lib/types";
import { type Bot, categoryMeta } from "@/lib/bots";
import { Icon } from "@/components/ui/icon";

interface MessageListProps {
  messages: Message[];
  bot: Bot;
  userName: string;
  isStreaming: boolean;
  isGeneratingImage?: boolean;
  onOpenStudio?: (imageUrl: string) => void;
}

// Parse image markdown: ![alt](url)
const IMAGE_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/g;

interface ParsedImage {
  alt: string;
  url: string;
  index: number;
}

function renderContent(content: string, onOpenStudio?: (imageUrl: string) => void) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  // Collect all images and text segments
  const images: ParsedImage[] = [];
  IMAGE_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = IMAGE_REGEX.exec(content)) !== null) {
    images.push({ alt: match[1], url: match[2], index: match.index });
  }

  if (images.length === 0) {
    return renderTextContent(content);
  }

  // Detect style gallery: 5+ images with style-like alt text appearing close together
  const isStyleGallery = images.length >= 5 && images.every(
    (img) => img.alt && !img.alt.startsWith("Generated")
  );

  if (isStyleGallery) {
    // Render text before the first image
    const textBefore = content.slice(0, images[0].index).trim();
    if (textBefore) {
      parts.push(<span key="text-before">{renderTextContent(textBefore)}</span>);
    }

    // Render images as a style gallery grid
    parts.push(
      <StyleGallery key="gallery" images={images} />
    );

    // Render text after the last image
    const lastImg = images[images.length - 1];
    const lastImgEnd = content.indexOf(")", lastImg.index) + 1;
    const textAfter = content.slice(lastImgEnd).trim();
    if (textAfter) {
      parts.push(<span key="text-after">{renderTextContent(textAfter)}</span>);
    }

    return parts;
  }

  // Normal rendering: images inline with text
  IMAGE_REGEX.lastIndex = 0;
  while ((match = IMAGE_REGEX.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index);
      parts.push(<span key={`text-${lastIndex}`}>{renderTextContent(text)}</span>);
    }

    parts.push(
      <ImageMessage
        key={`img-${match.index}`}
        url={match[2]}
        alt={match[1]}
        onOpenStudio={onOpenStudio}
      />
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    const remaining = content.slice(lastIndex);
    parts.push(<span key={`text-${lastIndex}`}>{renderTextContent(remaining)}</span>);
  }

  return parts;
}

function renderTextContent(text: string): React.ReactNode {
  if (text.includes("✓ Saved to your Media Library")) {
    const [before, after] = text.split("✓ Saved to your Media Library");
    return (
      <>
        {before}
        <span className="flex items-center gap-1.5 text-green-600 text-xs mt-2">
          <Icon name="check" size={14} />
          Saved to your Media Library
        </span>
        {after}
      </>
    );
  }
  return text;
}

function StyleGallery({ images }: { images: ParsedImage[] }) {
  return (
    <div className="my-3">
      <div className="grid grid-cols-5 gap-2">
        {images.map((img, i) => (
          <button
            key={i}
            className="group relative rounded-xl overflow-hidden aspect-square bg-black/5 hover:ring-2 hover:ring-accent-purple transition-all"
            onClick={() => {
              // No action needed — user types their choice
            }}
          >
            <img
              src={img.url}
              alt={img.alt}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6">
              <p className="text-[10px] font-bold text-white uppercase leading-tight">
                {img.alt}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ImageMessage({
  url,
  alt,
  onOpenStudio,
}: {
  url: string;
  alt: string;
  onOpenStudio?: (imageUrl: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className="my-2">
        <button
          onClick={() => setExpanded(true)}
          className="block cursor-pointer"
        >
          <img
            src={url}
            alt={alt || "Generated image"}
            className="rounded-xl max-w-full max-h-80 border border-black/10 hover:shadow-lg transition-shadow"
            loading="lazy"
          />
        </button>
        {onOpenStudio && (
          <button
            onClick={() => onOpenStudio(url)}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-accent-purple/10 text-accent-purple hover:bg-accent-purple/20 transition-colors"
          >
            <Icon name="bot-graphics" size={14} />
            Open in Studio
          </button>
        )}
      </div>
      {expanded && (
        <div
          className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center p-8"
          onClick={() => setExpanded(false)}
        >
          <button
            onClick={() => setExpanded(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
          >
            <Icon name="close" size={24} color="#ffffff" />
          </button>
          <img
            src={url}
            alt={alt || "Generated image"}
            className="max-w-full max-h-full rounded-xl"
          />
        </div>
      )}
    </>
  );
}

export default function MessageList({
  messages,
  bot,
  userName,
  isStreaming,
  isGeneratingImage,
  onOpenStudio,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGeneratingImage]);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
      {/* Welcome message */}
      {messages.length === 0 && (
        <div className="max-w-[720px]">
          <p className="text-xs font-semibold text-accent-purple mb-1">{bot.name}</p>
          <div
            className="rounded-[4px_16px_16px_16px] px-4 py-3 backdrop-blur-sm"
            style={{ backgroundColor: "var(--msg-bot-bg)" }}
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
                      ? "var(--msg-user-bg)"
                      : "var(--msg-bot-bg)",
                }}
              >
                {msg.role === "assistant"
                  ? renderContent(msg.content, onOpenStudio)
                  : msg.content}
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

      {/* Image generation loading indicator */}
      {isGeneratingImage && (
        <div className="flex justify-start">
          <div className="max-w-[720px]">
            <p className="text-xs font-semibold text-accent-purple mb-1">{bot.name}</p>
            <div
              className="rounded-[4px_16px_16px_16px] px-4 py-3 backdrop-blur-sm flex items-center gap-3"
              style={{ backgroundColor: "var(--msg-bot-bg)" }}
            >
              <div className="w-5 h-5 border-2 border-accent-purple/30 border-t-accent-purple rounded-full animate-spin" />
              <span className="text-sm text-text-secondary">Generating image...</span>
            </div>
          </div>
        </div>
      )}

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
