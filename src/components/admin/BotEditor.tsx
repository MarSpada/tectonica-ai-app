"use client";

import { useState } from "react";
import type { BotCategory } from "@/lib/bots";
import { categoryMeta } from "@/lib/bots";
import type { AdminBot } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

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
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <Button variant="ghost" size="icon-sm" onClick={onCancel}>
          <span className="material-icons-two-tone text-[20px] text-text-muted">
            arrow_back
          </span>
        </Button>
        <h2 className="text-lg font-semibold text-text-primary">
          {isNew ? "Create Bot" : `Edit: ${bot.name}`}
        </h2>
      </div>

      <div className="bg-card-bg rounded-xl border border-card-stroke p-8 space-y-6">
        {/* Identity */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Name
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Canvassing Planner"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Slug
            </label>
            <Input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setAutoSlug(false);
              }}
              placeholder="e.g. canvassing-planner"
              disabled={!isNew}
            />
            {!isNew && (
              <p className="text-[10px] text-text-muted mt-0.5">
                Slug cannot be changed after creation.
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Appearance */}
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
              <Input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="e.g. palette"
                className="flex-1"
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

        <Separator />

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            Description
          </label>
          <p className="text-[10px] text-text-muted mb-1.5">
            Brief text shown when hovering over the bot card.
          </p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description shown on bot card hover..."
            rows={3}
            className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-accent-purple/50 resize-none"
          />
        </div>

        <Separator />

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
            rows={16}
            className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-accent-purple/50 resize-y"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || !name.trim() || !slug.trim()}
        >
          {saving ? "Saving..." : isNew ? "Create Bot" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
