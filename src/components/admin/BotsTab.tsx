"use client";

import { useState, useEffect, useCallback } from "react";
import type { BotCategory } from "@/lib/bots";
import { categoryMeta } from "@/lib/bots";
import BotEditor from "./BotEditor";

interface AdminBot {
  id: string;
  slug: string;
  name: string;
  icon: string;
  category: BotCategory;
  description: string;
  system_prompt: string | null;
}

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
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
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

        <button
          onClick={() => setCreatingBot(true)}
          className="ml-auto px-4 py-2 text-sm font-semibold text-white bg-accent-purple rounded-lg hover:bg-accent-purple/90 flex items-center gap-1.5"
        >
          <span className="text-lg leading-none">+</span>
          Create Bot
        </button>
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
                  <button
                    onClick={() => setEditingBot(bot)}
                    className="p-1 rounded hover:bg-black/5 transition-colors"
                    title="Edit bot"
                  >
                    <span className="material-icons-two-tone text-[16px] text-text-muted">
                      edit
                    </span>
                  </button>
                  <button
                    onClick={() => handleDeleteBot(bot.id)}
                    className="p-1 rounded hover:bg-red-50 transition-colors"
                    title="Delete bot"
                  >
                    <span className="material-icons-two-tone text-[16px] text-red-400">
                      delete
                    </span>
                  </button>
                </div>
              </div>

              <h3 className="text-sm font-semibold text-text-primary mb-1">
                {bot.name}
              </h3>
              <p className="text-xs text-text-muted line-clamp-2 mb-2">
                {bot.description}
              </p>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/5 text-text-secondary">
                  {catMeta?.label || bot.category}
                </span>
                {bot.system_prompt && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                    Custom Prompt
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
