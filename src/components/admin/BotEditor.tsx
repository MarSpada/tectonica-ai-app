"use client";

import { useState } from "react";
import type { BotCategory } from "@/lib/bots";
import { categoryMeta } from "@/lib/bots";

interface AdminBot {
  id: string;
  slug: string;
  name: string;
  icon: string;
  category: BotCategory;
  description: string;
  system_prompt: string | null;
}

interface BotEditorProps {
  bot: AdminBot | null; // null = creating new
  onSave: (bot: Partial<AdminBot> & { slug: string }) => void;
  onCancel: () => void;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function BotEditor({ bot, onSave, onCancel }: BotEditorProps) {
  const isNew = !bot;
  const [name, setName] = useState(bot?.name || "");
  const [slug, setSlug] = useState(bot?.slug || "");
  const [icon, setIcon] = useState(bot?.icon || "smart_toy");
  const [category, setCategory] = useState<BotCategory>(bot?.category || "advisors");
  const [description, setDescription] = useState(bot?.description || "");
  const [systemPrompt, setSystemPrompt] = useState(bot?.system_prompt || "");
  const [saving, setSaving] = useState(false);
  const [autoSlug, setAutoSlug] = useState(isNew);

  function handleNameChange(val: string) {
    setName(val);
    if (autoSlug) setSlug(slugify(val));
  }

  async function handleSave() {
    if (!name.trim() || !slug.trim()) return;
    setSaving(true);
    await onSave({
      ...(bot?.id ? { id: bot.id } : {}),
      slug: slug.trim(),
      name: name.trim(),
      icon: icon.trim() || "smart_toy",
      category,
      description: description.trim(),
      system_prompt: systemPrompt.trim() || null,
    });
    setSaving(false);
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={onCancel}
          className="p-1 rounded hover:bg-black/5 transition-colors"
        >
          <span className="material-icons-two-tone text-[20px] text-text-muted">
            arrow_back
          </span>
        </button>
        <h2 className="text-lg font-semibold text-text-primary">
          {isNew ? "Create Bot" : `Edit: ${bot.name}`}
        </h2>
      </div>

      <div className="bg-card-bg rounded-xl border border-card-stroke p-5 space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Canvassing Planner"
            className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            Slug
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setAutoSlug(false);
            }}
            placeholder="e.g. canvassing-planner"
            disabled={!isNew}
            className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-accent-purple/50 disabled:bg-black/[0.03] disabled:text-text-muted"
          />
          {!isNew && (
            <p className="text-[10px] text-text-muted mt-0.5">
              Slug cannot be changed after creation.
            </p>
          )}
        </div>

        {/* Icon + Category row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Icon (Material Icons)
            </label>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-accent-purple/10 flex items-center justify-center flex-shrink-0">
                <span className="material-icons-two-tone text-accent-purple text-[20px]">
                  {icon || "smart_toy"}
                </span>
              </div>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="e.g. palette"
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as BotCategory)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
            >
              {Object.entries(categoryMeta).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description shown on bot card hover..."
            rows={2}
            className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-accent-purple/50 resize-none"
          />
        </div>

        {/* System Prompt */}
        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            System Prompt
          </label>
          <p className="text-[10px] text-text-muted mb-1.5">
            Leave empty to use the default prompt. Custom prompts override the
            built-in prompt entirely.
          </p>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="You are an AI assistant..."
            rows={12}
            className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-accent-purple/50 resize-y"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !name.trim() || !slug.trim()}
          className="px-5 py-2 text-sm font-semibold text-white bg-accent-purple rounded-lg hover:bg-accent-purple/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : isNew ? "Create Bot" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
