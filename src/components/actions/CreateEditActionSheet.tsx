"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Action, ActionType, AssignmentScope, ActionVisibility } from "@/lib/types";

interface CreateEditActionSheetProps {
  open: boolean;
  action: Action | null;
  onClose: () => void;
  onSaved: () => void;
}

interface BotOption {
  slug: string;
  name: string;
}

const ACTION_TYPES: { value: ActionType; label: string }[] = [
  { value: "custom", label: "Custom" },
  { value: "petition", label: "Petition" },
  { value: "donation", label: "Donation" },
  { value: "event_rsvp", label: "Event RSVP" },
  { value: "letter", label: "Letter" },
  { value: "phone_bank", label: "Phone Bank" },
  { value: "canvass", label: "Canvass" },
  { value: "social_share", label: "Social Share" },
];

const SCOPES: { value: AssignmentScope; label: string; description: string }[] = [
  { value: "all", label: "Everyone", description: "All group members see and can complete this action" },
  { value: "self_assign", label: "Self-assign", description: "Members choose to take on this action" },
  { value: "targeted", label: "Targeted", description: "Assign to specific members" },
];

const VISIBILITY: { value: ActionVisibility; label: string }[] = [
  { value: "group", label: "Visible to all members" },
  { value: "admins_only", label: "Admins only" },
];

export default function CreateEditActionSheet({
  open,
  action,
  onClose,
  onSaved,
}: CreateEditActionSheetProps) {
  const isEditing = !!action;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ActionType>("custom");
  const [callToAction, setCallToAction] = useState("");
  const [url, setUrl] = useState("");
  const [pointsValue, setPointsValue] = useState(0);
  const [assignmentScope, setAssignmentScope] = useState<AssignmentScope>("all");
  const [suggestedBotSlug, setSuggestedBotSlug] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [visibility, setVisibility] = useState<ActionVisibility>("group");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [bots, setBots] = useState<BotOption[]>([]);

  // Fetch available bots for the dropdown
  useEffect(() => {
    if (!open) return;
    fetch("/api/admin/bots")
      .then((res) => res.json())
      .then((data) => {
        if (data.bots) {
          setBots(data.bots.map((b: { slug: string; name: string }) => ({
            slug: b.slug,
            name: b.name,
          })));
        }
      })
      .catch(() => {});
  }, [open]);

  // Populate form when editing
  useEffect(() => {
    if (action) {
      setTitle(action.title);
      setDescription(action.description || "");
      setType(action.type);
      setCallToAction(action.call_to_action || "");
      setUrl(action.url || "");
      setPointsValue(action.points_value);
      setAssignmentScope(action.assignment_scope);
      setSuggestedBotSlug(action.suggested_bot_slug || "");
      setStartsAt(action.starts_at ? action.starts_at.slice(0, 16) : "");
      setEndsAt(action.ends_at ? action.ends_at.slice(0, 16) : "");
      setVisibility(action.visibility);
    } else {
      setTitle("");
      setDescription("");
      setType("custom");
      setCallToAction("");
      setUrl("");
      setPointsValue(0);
      setAssignmentScope("all");
      setSuggestedBotSlug("");
      setStartsAt("");
      setEndsAt("");
      setVisibility("group");
    }
    setError("");
  }, [action, open]);

  async function handleSave() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      type,
      call_to_action: callToAction.trim() || null,
      url: url.trim() || null,
      points_value: pointsValue,
      assignment_scope: assignmentScope,
      suggested_bot_slug: suggestedBotSlug || null,
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      visibility,
    };

    try {
      const res = await fetch(
        isEditing ? `/api/actions/${action.id}` : "/api/actions",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto p-6">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit Action" : "Create Action"}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {error && (
            <div className="px-3 py-2 text-xs text-red-700 bg-red-50 rounded-lg">{error}</div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">Title *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Sign the petition for clean water"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-black/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-purple resize-none"
              placeholder="Explain what this action involves..."
            />
          </div>

          {/* Type + Points */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ActionType)}
                className="w-full px-3 py-2 text-sm border border-black/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-purple"
              >
                {ACTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Points Value</label>
              <Input
                type="number"
                min={0}
                value={pointsValue}
                onChange={(e) => setPointsValue(Math.max(0, parseInt(e.target.value) || 0))}
              />
            </div>
          </div>

          {/* CTA Label + URL */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">CTA Button Label</label>
              <Input
                value={callToAction}
                onChange={(e) => setCallToAction(e.target.value)}
                placeholder="e.g., Take Action"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">External URL</label>
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Assignment Scope */}
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">Assignment Scope</label>
            <div className="space-y-2">
              {SCOPES.map((s) => (
                <label key={s.value} className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="scope"
                    value={s.value}
                    checked={assignmentScope === s.value}
                    onChange={() => setAssignmentScope(s.value)}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium text-text-primary">{s.label}</span>
                    <p className="text-[10px] text-text-muted">{s.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Targeted: member picker scaffold */}
          {assignmentScope === "targeted" && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-text-muted">
                Member picker for targeted assignments will be available in a future update.
                For now, targeted actions can be assigned via the admin panel.
              </p>
            </div>
          )}

          {/* Suggested Bot */}
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">Suggested Bot (optional)</label>
            <select
              value={suggestedBotSlug}
              onChange={(e) => setSuggestedBotSlug(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-black/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-purple"
            >
              <option value="">None</option>
              {bots.map((b) => (
                <option key={b.slug} value={b.slug}>{b.name}</option>
              ))}
            </select>
            <p className="text-[10px] text-text-muted mt-1">
              If set, members will see a link to this bot for help completing the action.
            </p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Starts At</label>
              <Input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Ends At</label>
              <Input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">Visibility</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as ActionVisibility)}
              className="w-full px-3 py-2 text-sm border border-black/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-purple"
            >
              {VISIBILITY.map((v) => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Action"}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
