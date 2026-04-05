"use client";

import { Bot, categoryMeta } from "@/lib/bots";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/lib/icon-map";

interface BotCardProps {
  bot: Bot;
  featured?: boolean;
  onSelect?: (bot: Bot) => void;
  onToggleFavorite?: (botId: string) => void;
  isFavorite?: boolean;
}

export default function BotCard({
  bot,
  featured,
  onSelect,
  onToggleFavorite,
  isFavorite,
}: BotCardProps) {
  const meta = categoryMeta[bot.category];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(bot)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect?.(bot); } }}
      className="group relative flex flex-col items-center justify-center rounded-xl p-3 pb-0 cursor-pointer w-full overflow-hidden"
      style={{
        backgroundColor: meta.bg,
        aspectRatio: "3 / 4",
        boxShadow: "0 2px 12px rgba(0,0,0,.06)",
        transition: "all .35s cubic-bezier(.4, 0, .2, 1)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,.06)";
      }}
    >
      {/* Star button for favorites */}
      {onToggleFavorite && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(bot.id);
          }}
          className="absolute top-2 right-2 z-10 w-6 h-6 flex items-center justify-center rounded-full bg-white/50 hover:bg-white/80 transition-colors text-[14px]"
          title={isFavorite ? "Remove from Your Helpers" : "Add to Your Helpers"}
        >
          {isFavorite ? (
            <span className="text-foreground">★</span>
          ) : (
            <span className="text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity">☆</span>
          )}
        </button>
      )}

      {/* Icon circle — responsive 55% width */}
      <div
        className="w-[55%] aspect-square rounded-full flex items-center justify-center mb-2"
        style={{ backgroundColor: meta.accent }}
      >
        <Icon name={bot.icon as IconName} size={28} />
      </div>

      {/* Bot name */}
      <span className="font-semibold text-center leading-tight overflow-hidden" style={{ fontSize: "13px", color: "var(--widget-text-color)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
        {bot.name}
      </span>

      {/* Helper pill — flush to bottom, category-colored, 2px top radius / 0 bottom */}
      <div
        className="mt-auto w-full flex justify-center py-1"
        style={{ backgroundColor: meta.badgeBg, borderRadius: "2px 2px 0 0", fontSize: "10px", color: "var(--widget-text-color)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" as const }}
      >
        Helper
      </div>

      {/* Hover overlay — pastel bg at full opacity with black text */}
      <div
        className="absolute inset-0 rounded-xl flex items-center justify-center p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ backgroundColor: meta.bg }}
      >
        <p className="text-xs text-text-primary text-center font-medium leading-relaxed">
          {bot.description}
        </p>
      </div>
    </div>
  );
}
