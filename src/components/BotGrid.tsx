"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import {
  bots,
  defaultFeaturedBotIds,
  categoryMeta,
  type Bot,
  type BotCategory,
} from "@/lib/bots";
import BotCard from "./BotCard";
import WelcomeHelper from "./WelcomeHelper";

interface BotGridProps {
  userName?: string;
  initialFavorites?: string[];
  onWelcomeExpandChange?: (expanded: boolean) => void;
}

const categoryIcons: Record<BotCategory, string> = {
  advisors: "chat_bubble_outline",
  create: "palette",
  tools: "build",
  analyze: "insights",
};

export default function BotGrid({
  userName = "Ned",
  initialFavorites,
  onWelcomeExpandChange,
}: BotGridProps) {
  const router = useRouter();
  const gridRef = useRef<HTMLDivElement>(null);
  const [favoriteBotIds, setFavoriteBotIds] = useState<string[]>(
    initialFavorites ?? defaultFeaturedBotIds
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  function toggleCategory(key: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  // GSAP entrance animations (headers + featured cards only; category cards are collapsed)
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;

    const headers = el.querySelectorAll(".cat-header");
    const featuredCards = el.querySelectorAll(".featured-grid-responsive .bot-card-anim");

    // Category headers: slide in from left
    gsap.fromTo(headers,
      { x: -20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: "power2.out" }
    );

    // Featured bot cards only: stagger up
    gsap.fromTo(featuredCards,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.03, ease: "power2.out", delay: 0.1 }
    );

    // No cleanup — entrance animations complete once and elements stay visible.
    // Cleaning up causes React 19 strict mode's double-mount to freeze animations.
  }, []);

  function handleBotSelect(bot: Bot) {
    router.push(`/chat/${bot.id}`);
  }

  async function handleToggleFavorite(botId: string) {
    const isCurrentlyFavorite = favoriteBotIds.includes(botId);

    // Optimistic update
    setFavoriteBotIds((prev) =>
      isCurrentlyFavorite
        ? prev.filter((id) => id !== botId)
        : [...prev, botId]
    );

    // Persist to Supabase
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botSlug: botId,
          action: isCurrentlyFavorite ? "remove" : "add",
          currentFavorites: favoriteBotIds,
        }),
      });
      const data = await res.json();
      if (data.favorites && data.favorites.length > 0) {
        setFavoriteBotIds(data.favorites);
      }
    } catch {
      // Revert on failure
      setFavoriteBotIds((prev) =>
        isCurrentlyFavorite
          ? [...prev, botId]
          : prev.filter((id) => id !== botId)
      );
    }
  }

  const featuredBots = favoriteBotIds
    .map((id) => bots.find((b) => b.id === id))
    .filter((b): b is Bot => b !== undefined && b.id !== "welcome");

  const categories = Object.entries(categoryMeta) as [
    BotCategory,
    (typeof categoryMeta)[BotCategory],
  ][];

  const botsByCategory = categories.map(([key, meta]) => ({
    key,
    label: meta.label,
    bots: bots.filter((b) => b.category === key && b.id !== "welcome"),
  }));

  return (
    <div ref={gridRef} className="flex-1 overflow-y-auto px-6 py-6">
      {/* Welcome Helper */}
      <WelcomeHelper
        userName={userName}
        onExpandChange={onWelcomeExpandChange}
      />

      {/* Featured / Your Favorite Helpers (collapsible) */}
      {featuredBots.length > 0 && (() => {
        const isFavOpen = expandedCategories.has("favorites");
        return (
          <section className="mb-3">
            <button
              onClick={() => toggleCategory("favorites")}
              className="cat-header w-full flex items-center gap-2 text-sm font-semibold text-text-secondary uppercase tracking-wider py-2.5 px-3 rounded-lg border-b border-black/5 hover:brightness-95 transition-all cursor-pointer"
              style={{ backgroundColor: "color-mix(in srgb, var(--bg) 50%, transparent)" }}
            >
              <span className="text-amber-400 text-base">★</span>
              <span className="flex-1 text-left">Your Favorite Helpers</span>
              <span className={`material-icons-two-tone text-[20px] text-text-muted transition-transform duration-200 ${isFavOpen ? "rotate-180" : ""}`}>
                expand_more
              </span>
            </button>
            {isFavOpen && (
              <div className="featured-grid-responsive grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3.5 mt-2 mb-3">
                {featuredBots.map((bot) => (
                  <div key={bot.id} className="bot-card-anim">
                    <BotCard
                      bot={bot}
                      featured
                      onSelect={handleBotSelect}
                      onToggleFavorite={handleToggleFavorite}
                      isFavorite={true}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })()}

      {/* Bot categories (collapsible) */}
      {botsByCategory.map(({ key, label, bots: catBots }) => {
        const isOpen = expandedCategories.has(key);
        const catBg = categoryMeta[key].bg;
        return (
          <section key={key} className="mb-3">
            <button
              onClick={() => toggleCategory(key)}
              className="cat-header w-full flex items-center gap-2 text-sm font-semibold text-text-secondary uppercase tracking-wider py-2.5 px-3 rounded-lg border-b border-black/5 hover:brightness-95 transition-all cursor-pointer"
              style={{ backgroundColor: `color-mix(in srgb, ${catBg} 25%, transparent)` }}
            >
              <span className="material-icons-two-tone text-[18px] text-text-muted">
                {categoryIcons[key]}
              </span>
              <span className="flex-1 text-left">{label}</span>
              <span className={`material-icons-two-tone text-[20px] text-text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                expand_more
              </span>
            </button>
            {isOpen && (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3.5 mt-2 mb-3">
                {catBots.map((bot) => (
                  <div key={bot.id} className="bot-card-anim">
                    <BotCard
                      bot={bot}
                      onSelect={handleBotSelect}
                      onToggleFavorite={handleToggleFavorite}
                      isFavorite={favoriteBotIds.includes(bot.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
