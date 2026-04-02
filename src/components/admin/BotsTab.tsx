"use client";

import { useState, useEffect, useCallback } from "react";
import type { BotCategory } from "@/lib/bots";
import { categoryMeta } from "@/lib/bots";
import type { AdminBot } from "@/lib/types";
import BotEditor from "./BotEditor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface BotsTabProps {
  orgId: string | null;
}

type CategoryFilter = "all" | BotCategory;

export default function BotsTab({ orgId }: BotsTabProps) {
  const [bots, setBots] = useState<AdminBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [editingBot, setEditingBot] = useState<AdminBot | null>(null);
  const [creatingBot, setCreatingBot] = useState(false);

  const fetchBots = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/bots");
    if (res.ok) {
      const data = await res.json();
      setBots(data.bots);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBots();
  }, [fetchBots]);

  const filteredBots =
    categoryFilter === "all"
      ? bots
      : bots.filter((b) => b.category === categoryFilter);

  async function handleSaveBot(bot: Partial<AdminBot> & { slug: string }) {
    const isNew = !bot.id;
    const url = isNew ? "/api/admin/bots" : `/api/admin/bots/${bot.id}`;
    const method = isNew ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bot),
    });

    if (res.ok) {
      setEditingBot(null);
      setCreatingBot(false);
      fetchBots();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to save bot");
    }
  }

  async function handleDeleteBot(botId: string) {
    if (!confirm("Delete this bot? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/bots/${botId}`, { method: "DELETE" });
    if (res.ok) fetchBots();
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-8 w-28 ml-auto" />
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card-bg rounded-xl border border-card-stroke p-4 space-y-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const categoryFilterOptions: { key: CategoryFilter; label: string }[] = [
    { key: "all", label: "All" },
    ...Object.entries(categoryMeta).map(([key, meta]) => ({
      key: key as CategoryFilter,
      label: meta.label,
    })),
  ];

  // Show editor if creating or editing
  if (creatingBot || editingBot) {
    return (
      <BotEditor
        bot={editingBot}
        onSave={handleSaveBot}
        onCancel={() => {
          setEditingBot(null);
          setCreatingBot(false);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Category filter pills */}
        <div className="flex gap-1.5">
          {categoryFilterOptions.map((f) => (
            <button
              key={f.key}
              onClick={() => setCategoryFilter(f.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                categoryFilter === f.key
                  ? "bg-accent-purple text-white"
                  : "bg-white/60 text-text-secondary border border-black/5 hover:bg-black/5"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <Button onClick={() => setCreatingBot(true)} className="ml-auto">
          <span className="text-lg leading-none">+</span>
          Create Bot
        </Button>
      </div>

      <p className="text-xs text-text-muted">
        {filteredBots.length} bot{filteredBots.length !== 1 ? "s" : ""}
      </p>

      {/* Bot cards grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
        {filteredBots.map((bot) => {
          const catMeta = categoryMeta[bot.category];
          return (
            <div
              key={bot.id || bot.slug}
              className="bg-card-bg rounded-xl border border-card-stroke p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: catMeta?.bg }}
                >
                  <span className="material-icons-two-tone text-white text-[20px]">
                    {bot.icon}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setEditingBot(bot)}
                    title="Edit bot"
                  >
                    <span className="material-icons-two-tone text-[16px] text-text-muted">
                      edit
                    </span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDeleteBot(bot.id)}
                    className="hover:bg-red-50"
                    title="Delete bot"
                  >
                    <span className="material-icons-two-tone text-[16px] text-red-400">
                      delete
                    </span>
                  </Button>
                </div>
              </div>

              <h3 className="text-sm font-semibold text-text-primary mb-1">
                {bot.name}
              </h3>
              <p className="text-xs text-text-muted line-clamp-2 mb-2">
                {bot.description}
              </p>

              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">
                  {catMeta?.label || bot.category}
                </Badge>
                {bot.system_prompt && (
                  <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                    Custom Prompt
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
