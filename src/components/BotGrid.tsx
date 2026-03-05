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

interface BotGridProps {
  userName?: string;
  initialFavorites?: string[];
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
}: BotGridProps) {
  const router = useRouter();
  const gridRef = useRef<HTMLDivElement>(null);
  const [favoriteBotIds, setFavoriteBotIds] = useState<string[]>(
    initialFavorites ?? defaultFeaturedBotIds
  );

  // GSAP entrance animations
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;

    const headers = el.querySelectorAll(".cat-header");
    const cards = el.querySelectorAll(".bot-card-anim");

    // Category headers: slide in from left
    const t1 = gsap.fromTo(headers,
      { x: -20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: "power2.out" }
    );

    // Bot cards: stagger up
    const t2 = gsap.fromTo(cards,
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
    .filter((b): b is Bot => b !== undefined);

  const categories = Object.entries(categoryMeta) as [
    BotCategory,
    (typeof categoryMeta)[BotCategory],
  ][];

  const botsByCategory = categories.map(([key, meta]) => ({
    key,
    label: meta.label,
    bots: bots.filter((b) => b.category === key),
  }));

  return (
    <div ref={gridRef} className="flex-1 overflow-y-auto px-6 py-6">
      {/* Header */}
      <h1 className="cat-header text-xl font-bold text-text-primary mb-6">
        Welcome back, {userName}. Choose a bot to get started.
      </h1>

      {/* Featured / Your Bots */}
      {featuredBots.length > 0 && (
        <section className="mb-8">
          <h2 className="cat-header flex items-center gap-2 text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
            <span className="text-amber-400 text-base">★</span>
            Your Bots
          </h2>
          <div className="featured-grid-responsive grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3.5">
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
        </section>
      )}

      {/* Bot categories */}
      {botsByCategory.map(({ key, label, bots: catBots }) => (
        <section key={key} className="mb-6">
          <h2 className="cat-header flex items-center gap-2 text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
            <span className="material-icons-two-tone text-[18px] text-text-muted">
              {categoryIcons[key]}
            </span>
            {label}
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3.5">
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
        </section>
      ))}
    </div>
  );
}
