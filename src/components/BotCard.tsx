"use client";

import { Bot, categoryMeta } from "@/lib/bots";

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
      className="group relative flex flex-col items-center justify-center rounded-xl p-3 cursor-pointer w-full"
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
          title={isFavorite ? "Remove from Your Bots" : "Add to Your Bots"}
        >
          {isFavorite ? (
            <span className="text-amber-400">★</span>
          ) : (
            <span className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">☆</span>
          )}
        </button>
      )}

      {/* Icon circle — responsive 55% width */}
      <div
        className="w-[55%] aspect-square rounded-full flex items-center justify-center mb-2"
        style={{ backgroundColor: meta.accent }}
      >
        <span className="material-icons-two-tone text-white text-[28px]">
          {bot.icon}
        </span>
      </div>

      {/* Bot name */}
      <span className="text-xs font-medium text-text-primary text-center leading-tight px-1">
        {bot.name}
      </span>

      {/* BOT pill */}
      <span className="mt-auto pt-2 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-white/40 rounded-full text-text-secondary">
        Bot
      </span>

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
