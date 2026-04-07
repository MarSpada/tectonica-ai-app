"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { type Message } from "@/lib/types";
import { type Bot, categoryMeta } from "@/lib/bots";
import { Icon } from "@/components/ui/icon";
import EnergyEstimate from "@/components/media/EnergyEstimate";

export interface ImageEnergyInfo {
  energyWh: number;
  width: number;
  height: number;
}

interface MessageListProps {
  messages: Message[];
  bot: Bot;
  userName: string;
  isStreaming: boolean;
  isGeneratingImage?: boolean;
  isGeneratingLandingPage?: boolean;
  onOpenStudio?: (imageUrl: string) => void;
  onStyleSelect?: (styleName: string) => void;
  onTryAgain?: (imageUrl?: string) => void;
  onRequestApproval?: (imageUrl: string) => void;
  onShareToChat?: (imageUrl: string) => void;
  approvedImageUrls?: Map<string, string>;
  imageEnergyData?: Map<string, ImageEnergyInfo>;
}

// Parse image markdown: ![alt](url)
const IMAGE_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/g;

interface ParsedImage {
  alt: string;
  url: string;
  index: number;
}

// Gallery marker pattern: __GALLERY__{...}__END_GALLERY__
const GALLERY_REGEX = /__GALLERY__([\s\S]*?)__END_GALLERY__/g;

function renderContent(
  content: string,
  onOpenStudio?: (imageUrl: string) => void,
  onStyleSelect?: (styleName: string) => void,
  onTryAgain?: () => void,
  onRequestApproval?: (imageUrl: string) => void,
  onShareToChat?: (imageUrl: string) => void,
  approvedImageUrls?: Map<string, string>,
  imageEnergyData?: Map<string, ImageEnergyInfo>,
) {
  const parts: React.ReactNode[] = [];

  // Check for gallery markers first (sent as special SSE events)
  if (content.includes("__GALLERY__")) {
    let lastIndex = 0;
    GALLERY_REGEX.lastIndex = 0;
    let galleryMatch;

    while ((galleryMatch = GALLERY_REGEX.exec(content)) !== null) {
      // Text before gallery
      if (galleryMatch.index > lastIndex) {
        const textBefore = content.slice(lastIndex, galleryMatch.index).trim();
        if (textBefore) {
          // Strip any markdown table remnants from model response
          const cleanText = stripMarkdownTableSyntax(textBefore);
          if (cleanText) {
            parts.push(<span key={`text-${lastIndex}`}>{renderTextContent(cleanText)}</span>);
          }
        }
      }

      // Parse and render gallery
      try {
        const galleryData = JSON.parse(galleryMatch[1]) as {
          images: Array<{ alt: string; url: string }>;
          title: string;
        };
        parts.push(
          <span key={`gtitle-${galleryMatch.index}`} className="block text-sm font-medium text-text-primary mb-2">
            {galleryData.title}
          </span>
        );
        parts.push(
          <StyleGallery
            key={`gallery-${galleryMatch.index}`}
            images={galleryData.images.map((img, i) => ({ ...img, index: i }))}
            onSelect={onStyleSelect}
          />
        );
      } catch {
        // Failed to parse gallery JSON — skip
      }

      lastIndex = galleryMatch.index + galleryMatch[0].length;
    }

    // Text after last gallery
    if (lastIndex < content.length) {
      const textAfter = content.slice(lastIndex).trim();
      const cleanText = stripMarkdownTableSyntax(textAfter);
      if (cleanText) {
        parts.push(<span key={`text-${lastIndex}`}>{renderTextContent(cleanText)}</span>);
      }
    }

    return parts.length > 0 ? parts : null;
  }

  // Normal rendering: images inline with text
  const images: ParsedImage[] = [];
  IMAGE_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = IMAGE_REGEX.exec(content)) !== null) {
    images.push({ alt: match[1], url: match[2], index: match.index });
  }

  if (images.length === 0) {
    return renderTextContent(content);
  }

  let lastIndex = 0;
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
        onTryAgain={onTryAgain}
        onRequestApproval={onRequestApproval}
        onShareToChat={onShareToChat}
        isApproved={approvedImageUrls?.has(match[2])}
        energyInfo={imageEnergyData?.get(match[2])}
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

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 mt-3 text-text-muted">
      <div className="w-4 h-4 border-2 border-accent-purple/30 border-t-accent-purple rounded-full animate-spin" />
      <span className="text-xs">Thinking of recommended styles for your request...</span>
    </div>
  );
}

function ImageActionButton({
  icon,
  label,
  onClick,
  variant = "default",
  confirmLabel,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  variant?: "default" | "purple";
  confirmLabel?: string;
}) {
  const [confirmed, setConfirmed] = useState(false);

  function handleClick() {
    onClick();
    if (confirmLabel) {
      setConfirmed(true);
      setTimeout(() => setConfirmed(false), 3000);
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-medium rounded-lg transition-colors whitespace-nowrap ${
        confirmed
          ? "bg-green-50 text-green-600"
          : variant === "purple"
            ? "bg-accent-purple/10 text-accent-purple hover:bg-accent-purple/20"
            : "bg-black/5 text-text-secondary hover:bg-black/10"
      }`}
    >
      <Icon name={confirmed ? "check" as import("@/lib/icon-map").IconName : icon as import("@/lib/icon-map").IconName} size={12} />
      {confirmed ? confirmLabel : label}
    </button>
  );
}

/** Render user message content — show image thumbnails for base64 uploads */
function renderUserContent(content: string): React.ReactNode {
  // Detect base64 data URI (image upload)
  if (content.startsWith("data:image/")) {
    return (
      <div className="flex items-center gap-2">
        <img
          src={content}
          alt="Uploaded image"
          className="rounded-lg max-w-[200px] max-h-[150px] object-cover border border-black/10"
        />
        <span className="text-xs text-text-muted italic">Image uploaded</span>
      </div>
    );
  }
  return content;
}

/** Strip [CREATIVE BRIEF IN PROGRESS] and [REQ:...] tags from visible text */
function stripBriefTags(text: string): string {
  return text
    .replace(/\[CREATIVE BRIEF IN PROGRESS\]/g, "")
    .replace(/\[LANDING PAGE BRIEF IN PROGRESS\]/g, "")
    .replace(/\[REQ:[^\]]*\]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Strip markdown table syntax that leaks from gallery responses */
function stripMarkdownTableSyntax(text: string): string {
  return text
    // Remove gallery headers
    .replace(/^\s*##\s+Available Styles\s*/m, "")
    .replace(/^\s*##\s+.*?—\s*Substyles\s*/m, "")
    // Remove markdown table rows: | content | content |
    .replace(/^\s*\|.*\|\s*$/gm, "")
    // Remove standalone pipes and dashes (table separators)
    .replace(/^\s*[-|]+\s*$/gm, "")
    // Remove leftover style names without context (e.g. "Flat Illustration  Cartoon / Caricature")
    .replace(/^\s*(?:Photorealistic|Flat Illustration|Hand-Drawn Illustration|Cartoon \/ Caricature|Collage \/ Mixed Media|Abstract \/ Conceptual|Political|Retro \/ Vintage|Mural \/ Street Art|Minimalist \/ Typographic)(?:\s{2,}(?:Photorealistic|Flat Illustration|Hand-Drawn Illustration|Cartoon \/ Caricature|Collage \/ Mixed Media|Abstract \/ Conceptual|Political|Retro \/ Vintage|Mural \/ Street Art|Minimalist \/ Typographic))*\s*$/gm, "")
    // Remove substyle count markers
    .replace(/\*\d+\s+substyles?\*/gi, "")
    // Remove image markdown
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    // Remove standalone dashes used as separators
    .replace(/^\s*---+\s*$/gm, "")
    // Collapse multiple blank lines
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function renderTextContent(text: string): React.ReactNode {
  if (text.includes("__THINKING_STYLES__")) {
    const [before, after] = text.split("__THINKING_STYLES__");
    return (
      <>
        {before}
        <ThinkingIndicator />
        {after}
      </>
    );
  }
  if (text.includes("__LANDING_PAGE__")) {
    const match = text.match(/__LANDING_PAGE__([^_]+(?:__[^_]*)*)__([^_]+(?:__[^_]*)*)__$/);
    if (match) {
      const [, url, headline] = match;
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm text-white no-underline transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--accent-purple, #422D8F)" }}
        >
          <Icon name="external-link" size={16} />
          See your landing page
        </a>
      );
    }
  }
  if (text.includes("✓ Saved to your Media Library")) {
    const [before, after] = text.split("✓ Saved to your Media Library");
    return (
      <>
        {before}
        <span className="flex items-center gap-1 text-text-muted text-[10px] mt-1.5">
          <Icon name="check" size={10} />
          Saved to Media Library
        </span>
        {after}
      </>
    );
  }
  return text;
}

function StyleGallery({ images, onSelect }: { images: ParsedImage[]; onSelect?: (styleName: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [loadedCount, setLoadedCount] = useState(0);
  const allLoaded = loadedCount >= images.length;

  // Preload all images
  useEffect(() => {
    setLoadedCount(0);
    images.forEach((img) => {
      const image = new Image();
      image.onload = () => setLoadedCount((c) => c + 1);
      image.onerror = () => setLoadedCount((c) => c + 1);
      image.src = img.url;
    });
  }, [images]);

  // Determine grid columns based on image count
  const cols = images.length <= 3 ? "grid-cols-3" : images.length <= 4 ? "grid-cols-4" : "grid-cols-5";

  if (!allLoaded) {
    return (
      <div className="my-3">
        <div className={`grid ${cols} gap-2.5`}>
          {images.map((_, i) => (
            <div key={i} className="rounded-xl aspect-[4/3] bg-black/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="my-3">
      <div className={`grid ${cols} gap-2.5`}>
        {images.map((img, i) => {
          const isSelected = selected === img.alt;
          return (
            <button
              key={i}
              className={`group relative rounded-xl overflow-hidden aspect-[4/3] bg-black/5 transition-all duration-200 ${
                isSelected
                  ? "ring-2 ring-accent-purple shadow-lg scale-[1.02]"
                  : selected
                    ? "opacity-40 hover:opacity-70"
                    : "hover:shadow-md hover:scale-[1.01]"
              }`}
              onClick={() => {
                setSelected(img.alt);
                if (onSelect) onSelect(img.alt);
              }}
            >
              <img
                src={img.url}
                alt={img.alt}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2.5 pb-2 pt-8">
                <p className="text-[11px] font-semibold text-white leading-tight drop-shadow-sm">
                  {img.alt}
                </p>
              </div>
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-accent-purple flex items-center justify-center shadow-md">
                  <Icon name="check" size={14} color="var(--card-bg)" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ImageMessage({
  url,
  alt,
  onOpenStudio,
  onTryAgain,
  onRequestApproval,
  onShareToChat,
  isApproved,
  energyInfo,
}: {
  url: string;
  alt: string;
  onOpenStudio?: (imageUrl: string) => void;
  onTryAgain?: (imageUrl?: string) => void;
  onRequestApproval?: (imageUrl: string) => void;
  onShareToChat?: (imageUrl: string) => void;
  isApproved?: boolean;
  energyInfo?: ImageEnergyInfo;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasActions = onOpenStudio || onTryAgain || onRequestApproval || onShareToChat;

  return (
    <>
      <div className={`my-2 ${hasActions ? "flex items-start gap-3" : ""}`}>
        <button
          onClick={() => setExpanded(true)}
          className="block cursor-pointer shrink-0"
        >
          <img
            src={url}
            alt={alt || "Generated image"}
            className="rounded-xl max-h-72 border border-black/10 hover:shadow-lg transition-shadow"
            loading="lazy"
          />
        </button>
        {hasActions && (
          <div className="flex flex-col gap-1.5 pt-1">
            {onOpenStudio && (
              <ImageActionButton
                icon="bot-graphics"
                label="Studio"
                onClick={() => onOpenStudio(url)}
                variant="purple"
              />
            )}
            {onTryAgain && (
              <ImageActionButton
                icon="refresh"
                label="Try again"
                onClick={() => onTryAgain(url)}
              />
            )}
            {onRequestApproval && (
              isApproved ? (
                <ImageActionButton
                  icon="close"
                  label="Cancel approval"
                  onClick={() => onRequestApproval(url)}
                  confirmLabel="Cancelled"
                />
              ) : (
                <ImageActionButton
                  icon="widget-approval"
                  label="Request approval"
                  onClick={() => onRequestApproval(url)}
                />
              )
            )}
            {onShareToChat && (
              <ImageActionButton
                icon="share"
                label="Share to group"
                confirmLabel="Shared!"
                onClick={() => onShareToChat(url)}
              />
            )}
          </div>
        )}
      </div>
      {energyInfo && (
        <div className="mt-1.5 max-w-[380px]">
          <EnergyEstimate
            width={energyInfo.width}
            height={energyInfo.height}
            energyWh={energyInfo.energyWh}
          />
        </div>
      )}
      {expanded && createPortal(
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setExpanded(false)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
            className="absolute top-4 right-4 z-[101] w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
          >
            <Icon name="close" size={24} color="var(--card-bg)" />
          </button>
          <img
            src={url}
            alt={alt || "Generated image"}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>,
        document.body
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
  isGeneratingLandingPage,
  onOpenStudio,
  onStyleSelect,
  onTryAgain,
  onRequestApproval,
  onShareToChat,
  approvedImageUrls,
  imageEnergyData,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGeneratingImage, isGeneratingLandingPage]);

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
                  ? renderContent(stripBriefTags(msg.content), onOpenStudio, onStyleSelect, onTryAgain, onRequestApproval, onShareToChat, approvedImageUrls, imageEnergyData)
                  : renderUserContent(msg.content)}
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

      {/* Landing page generation loading indicator */}
      {isGeneratingLandingPage && (
        <div className="flex justify-start">
          <div className="max-w-[720px]">
            <p className="text-xs font-semibold text-accent-purple mb-1">{bot.name}</p>
            <div
              className="rounded-[4px_16px_16px_16px] px-4 py-3 backdrop-blur-sm flex items-center gap-3"
              style={{ backgroundColor: "var(--msg-bot-bg)" }}
            >
              <div className="w-5 h-5 border-2 border-accent-purple/30 border-t-accent-purple rounded-full animate-spin" />
              <span className="text-sm text-text-secondary">Generating landing page...</span>
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
