"use client";

import { useState, useEffect, useCallback } from "react";
import type { BotCategory } from "@/lib/bots";
import { categoryMeta } from "@/lib/bots";
import type { AdminBot, BotBrief } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { ICON_MAP, type IconName } from "@/lib/icon-map";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

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

      {/* Creative Briefs — only for existing bots */}
      {!isNew && bot && (
        <CreativeBriefsSection botId={bot.id} />
      )}

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

// ────────────────────────────────────────────────────────────
// Creative Briefs Section — admin management of per-bot briefs
// ────────────────────────────────────────────────────────────

interface BriefFormData {
  title: string;
  thumbnail_url: string;
  content: string;
  enabled: boolean;
}

const EMPTY_FORM: BriefFormData = {
  title: "",
  thumbnail_url: "",
  content: "",
  enabled: true,
};

function CreativeBriefsSection({ botId }: { botId: string }) {
  const [briefs, setBriefs] = useState<BotBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingBrief, setEditingBrief] = useState<BotBrief | null>(null);
  const [form, setForm] = useState<BriefFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchBriefs = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/bots/${botId}/briefs`);
      if (res.ok) {
        const data = await res.json();
        setBriefs(data.briefs || []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [botId]);

  useEffect(() => {
    fetchBriefs();
  }, [fetchBriefs]);

  function openAddSheet() {
    setEditingBrief(null);
    setForm(EMPTY_FORM);
    setSheetOpen(true);
  }

  function openEditSheet(brief: BotBrief) {
    setEditingBrief(brief);
    setForm({
      title: brief.title,
      thumbnail_url: brief.thumbnail_url || "",
      content: brief.content,
      enabled: brief.enabled,
    });
    setSheetOpen(true);
  }

  async function handleSaveBrief() {
    if (!form.title.trim()) return;
    setSaving(true);

    const body = {
      title: form.title.trim(),
      thumbnail_url: form.thumbnail_url.trim() || null,
      content: form.content,
      enabled: form.enabled,
    };

    if (editingBrief) {
      await fetch(`/api/admin/bots/${botId}/briefs/${editingBrief.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch(`/api/admin/bots/${botId}/briefs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    setSaving(false);
    setSheetOpen(false);
    fetchBriefs();
  }

  async function handleToggleEnabled(brief: BotBrief) {
    await fetch(`/api/admin/bots/${botId}/briefs/${brief.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !brief.enabled }),
    });
    fetchBriefs();
  }

  async function handleDelete(briefId: string) {
    if (deletingId === briefId) {
      await fetch(`/api/admin/bots/${botId}/briefs/${briefId}`, {
        method: "DELETE",
      });
      setDeletingId(null);
      fetchBriefs();
    } else {
      setDeletingId(briefId);
      setTimeout(() => setDeletingId((prev) => (prev === briefId ? null : prev)), 3000);
    }
  }

  /** First line of content as a preview */
  function contentPreview(content: string): string {
    const firstLine = content.split("\n").find((l) => l.trim())?.trim() || "";
    return firstLine.length > 60 ? firstLine.slice(0, 60) + "…" : firstLine;
  }

  return (
    <>
      <div className="bg-card-bg rounded-xl border border-card-stroke p-8 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Creative Briefs</h3>
          <Button size="sm" onClick={openAddSheet}>
            + Add Brief
          </Button>
        </div>

        {loading ? (
          <p className="text-xs text-text-muted">Loading briefs...</p>
        ) : briefs.length === 0 ? (
          <p className="text-xs text-text-muted">No briefs configured for this bot.</p>
        ) : (
          <div className="space-y-2">
            {briefs.map((brief) => (
              <div
                key={brief.id}
                className="flex items-center gap-3 rounded-lg border border-card-stroke px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {brief.title}
                  </p>
                  <p className="text-[10px] text-text-muted mt-0.5 truncate">
                    {contentPreview(brief.content)}
                  </p>
                </div>
                <button onClick={() => handleToggleEnabled(brief)}>
                  <Badge
                    variant={brief.enabled ? "default" : "secondary"}
                    className="text-[10px] cursor-pointer"
                  >
                    {brief.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => openEditSheet(brief)}
                  title="Edit brief"
                >
                  <Icon name="edit" size={14} className="opacity-60" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDelete(brief.id)}
                  className={deletingId === brief.id ? "bg-red-100 text-red-600" : "hover:bg-red-50"}
                  title={deletingId === brief.id ? "Click again to confirm" : "Delete brief"}
                >
                  <Icon name={deletingId === brief.id ? "check" : "delete"} size={14} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Brief Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>{editingBrief ? "Edit Brief" : "Add Brief"}</SheetTitle>
            <SheetDescription>
              {editingBrief
                ? "Update the brief details below."
                : "Paste or type a creative brief. This is the full text that gets injected into chat when a user clicks \"Use in chat\"."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Title
              </label>
              <Input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Japanese Irezumi Tattoo Design"
              />
            </div>

            {/* Thumbnail URL */}
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Thumbnail URL
              </label>
              <Input
                value={form.thumbnail_url}
                onChange={(e) => setForm((prev) => ({ ...prev, thumbnail_url: e.target.value }))}
                placeholder="https://example.com/thumbnail.jpg (optional)"
              />
            </div>

            {/* Enabled */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-text-primary">Enabled</label>
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm((prev) => ({ ...prev, enabled: e.target.checked }))}
                className="w-4 h-4 rounded border-black/20 accent-accent-purple"
              />
            </div>

            <Separator />

            {/* Content */}
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Brief Content
              </label>
              <p className="text-[10px] text-text-muted mb-1.5">
                The full creative brief text — markdown supported. This is what gets sent to the bot when a user clicks &quot;Use in chat&quot;.
              </p>
              <textarea
                value={form.content}
                onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                placeholder={"# Project Overview\n**Type:** Poster design\n**Platform:** Instagram\n\n## Visual Direction\n**Style:** Photorealistic\n..."}
                rows={16}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-accent-purple/50 resize-y"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-4 py-4 border-t border-card-stroke">
            <Button variant="ghost" onClick={() => setSheetOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveBrief}
              disabled={saving || !form.title.trim()}
            >
              {saving ? "Saving..." : editingBrief ? "Save Changes" : "Create Brief"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
