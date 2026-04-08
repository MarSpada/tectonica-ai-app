"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import type { BriefRequirement, BotBrief } from "@/lib/types";

/** Friendly labels for REQ tag keys */
const FIELD_LABELS: Record<string, string> = {
  PLATFORM: "Platform",
  SIZE: "Format",
  AUDIENCE: "Audience",
  ACTION: "Purpose",
  BRANDING: "Branding",
  RIGHTS: "Image Rights",
  IMAGE_BASE: "Base Image",
  CONSTRAINTS: "Constraints",
  EVENT: "Event Type",
  MESSAGING: "Key Message",
  FOCUS: "Focus",
  STYLE: "Style",
  SUBSTYLE: "Substyle",
  CONTEXT: "Context",
  SUCCESS: "Success Factors",
  REFERENCE: "Reference",
  CTA: "Call to Action",
  TEXT: "Text Content",
};

/** Icons for key fields */
const FIELD_ICONS: Record<string, string> = {
  PLATFORM: "share",
  SIZE: "view-grid",
  AUDIENCE: "members",
  STYLE: "bot-graphics",
  BRANDING: "favorite",
  FOCUS: "search",
  CTA: "send",
};

export type { BriefRequirement };

interface CreativeBriefProps {
  requirements: BriefRequirement[];
}

/**
 * Parse [REQ:KEY: value] tags from message content.
 * Returns the latest value for each key across all messages.
 */
export function parseRequirements(
  messages: Array<{ role: string; content: string }>
): BriefRequirement[] {
  const reqMap = new Map<string, string>();

  for (const msg of messages) {
    if (msg.role !== "assistant") continue;

    const matches = msg.content.matchAll(/\[REQ:([A-Z_]+):\s*([^\]]+)\]/g);
    for (const match of matches) {
      reqMap.set(match[1], match[2].trim());
    }
  }

  // Convert to array, maintaining a sensible display order
  const ORDER = [
    "PLATFORM", "SIZE", "FOCUS", "AUDIENCE", "ACTION",
    "STYLE", "SUBSTYLE", "BRANDING", "CTA", "MESSAGING",
    "CONSTRAINTS", "CONTEXT", "SUCCESS", "EVENT",
    "IMAGE_BASE", "RIGHTS", "REFERENCE", "TEXT",
  ];

  const result: BriefRequirement[] = [];
  for (const key of ORDER) {
    const value = reqMap.get(key);
    if (value) result.push({ key, value });
  }
  // Add any keys not in the predefined order
  for (const [key, value] of reqMap) {
    if (!ORDER.includes(key)) {
      result.push({ key, value });
    }
  }

  return result;
}

export default function CreativeBrief({ requirements }: CreativeBriefProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (requirements.length === 0) return null;

  return (
    <div className="border-t border-card-stroke">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-black/3 transition-colors"
      >
        <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
          <Icon name="edit" size={12} />
          Creative Brief
          <span className="text-[10px] font-normal text-text-muted normal-case">
            ({requirements.length})
          </span>
        </h2>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`transition-transform opacity-40 ${collapsed ? "" : "rotate-180"}`}>
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {!collapsed && (
        <div className="px-4 pb-3 space-y-2">
          {requirements.map((req) => (
            <div key={req.key} className="flex items-start gap-2">
              <span className="text-[10px] font-semibold text-accent-purple uppercase shrink-0 w-16 pt-0.5">
                {FIELD_LABELS[req.key] || req.key}
              </span>
              <span className="text-[11px] text-text-secondary leading-tight">
                {req.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Saved Briefs — DB-driven briefs fetched per bot
// ────────────────────────────────────────────────────────────

interface SavedBriefsProps {
  botSlug: string;
  onUseBrief?: (briefContent: string) => void;
}

/** Format a brief for injection into chat — just the content prefixed with the title */
function formatBriefForInjection(brief: BotBrief): string {
  return `Creative Brief: ${brief.title}\n\n${brief.content}`;
}

export function SavedBriefs({ botSlug, onUseBrief }: SavedBriefsProps) {
  const [briefs, setBriefs] = useState<BotBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!botSlug) return;
    let cancelled = false;
    async function fetchBriefs() {
      try {
        const res = await fetch(`/api/bots/${encodeURIComponent(botSlug)}/briefs`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setBriefs(data.briefs || []);
      } catch {
        // Silently fail — briefs are non-critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchBriefs();
    return () => { cancelled = true; };
  }, [botSlug]);

  if (loading || briefs.length === 0) return null;

  return (
    <div className="border-t border-card-stroke">
      <div className="px-4 py-3">
        <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
          <Icon name="file-document" size={12} />
          Saved Briefs
        </h2>
      </div>
      <div className="pb-2">
        {briefs.map((brief) => {
          const isExpanded = expandedId === brief.id;
          return (
            <div key={brief.id} className="mx-3 mb-1.5">
              <div
                className={`rounded-lg border transition-colors ${
                  isExpanded
                    ? "border-accent-purple/20 bg-accent-purple/5"
                    : "border-black/5 bg-white/50 hover:border-black/10"
                }`}
              >
                {/* Brief header */}
                <div className="px-3 py-2">
                  <p className="text-[11px] font-semibold text-text-primary leading-tight">
                    {brief.title}
                  </p>
                  {/* Action buttons */}
                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      onClick={() => onUseBrief?.(formatBriefForInjection(brief))}
                      className="text-[10px] font-medium text-accent-purple hover:text-accent-purple/80 transition-colors"
                    >
                      Use in chat
                    </button>
                    <span className="text-text-muted text-[10px]">·</span>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : brief.id)}
                      className="text-[10px] font-medium text-text-muted hover:text-text-secondary transition-colors"
                    >
                      {isExpanded ? "Hide details" : "View details"}
                    </button>
                  </div>
                </div>
                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-3 pb-2.5 pt-1 border-t border-black/5">
                    <pre className="text-[10px] text-text-secondary leading-relaxed whitespace-pre-wrap font-sans">
                      {brief.content}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
