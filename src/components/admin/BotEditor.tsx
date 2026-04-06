"use client";

import { useState, useEffect } from "react";
import type { BotCategory } from "@/lib/bots";
import { categoryMeta } from "@/lib/bots";
import type { AdminBot } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Icon } from "@/components/ui/icon";
import { ICON_MAP, type IconName } from "@/lib/icon-map";

interface RunPodModel {
  id: string;
  name: string;
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
  const [icon, setIcon] = useState(bot?.icon || "bot-welcome");
  const [category, setCategory] = useState<BotCategory>(bot?.category || "advisors");
  const [description, setDescription] = useState(bot?.description || "");
  const [systemPrompt, setSystemPrompt] = useState(bot?.system_prompt || "");
  const [modelId, setModelId] = useState(bot?.model_id || "");
  const [saving, setSaving] = useState(false);
  const [autoSlug, setAutoSlug] = useState(isNew);
  const [availableModels, setAvailableModels] = useState<RunPodModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [runpodConfigured, setRunpodConfigured] = useState(false);

  useEffect(() => {
    async function loadModels() {
      try {
        const res = await fetch("/api/admin/integrations/runpod/models");
        if (!res.ok) return;
        const json = await res.json();
        if (json.models && json.models.length > 0) {
          setAvailableModels(json.models);
          setRunpodConfigured(true);
        } else if (json.error === "not_configured") {
          setRunpodConfigured(false);
        }
      } catch {
        // Failed to load models
      } finally {
        setModelsLoading(false);
      }
    }
    loadModels();
  }, []);

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
      icon: icon.trim() || "bot-welcome",
      category,
      description: description.trim(),
      system_prompt: systemPrompt.trim() || null,
      model_id: modelId || null,
    });
    setSaving(false);
  }

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <Button variant="ghost" size="icon-sm" onClick={onCancel}>
          <Icon name="back" size={20} className="opacity-60" />
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
              Icon
            </label>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-accent-purple/10 flex items-center justify-center flex-shrink-0">
                {(icon in ICON_MAP) ? (
                  <Icon name={icon as IconName} size={20} />
                ) : (
                  <Icon name="info" size={20} />
                )}
              </div>
              <select
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
              >
                {Object.keys(ICON_MAP)
                  .filter((k) => k.startsWith("bot-"))
                  .map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
              </select>
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
        <Separator />

        {/* Model Selection */}
        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            AI Model
          </label>
          {modelsLoading ? (
            <div className="text-xs text-text-muted py-2">Loading available models...</div>
          ) : !runpodConfigured ? (
            <div className="px-3 py-2 text-xs text-amber-700 bg-amber-50 rounded-lg">
              Configure RunPod connection in Integrations before assigning models.
            </div>
          ) : (
            <>
              <select
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
              >
                <option value="">No model selected</option>
                {availableModels.map((m) => (
                  <option key={m.id} value={m.id}>{m.name || m.id}</option>
                ))}
              </select>
              <p className="text-[10px] text-text-muted mt-0.5">
                Select the model this bot will use for chat responses.
              </p>
            </>
          )}
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
