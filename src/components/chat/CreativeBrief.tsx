"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";

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

export interface BriefRequirement {
  key: string;
  value: string;
}

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
        <Icon name={collapsed ? "arrow-down" : "arrow-up"} size={10} className="opacity-40" />
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
// Saved Briefs — hardcoded example briefs for Graphics Creation bot
// ────────────────────────────────────────────────────────────

interface SavedBrief {
  id: string;
  title: string;
  date: string;
  thumbnail?: string;
  fields: BriefRequirement[];
}

const SAVED_BRIEFS: SavedBrief[] = [
  {
    id: "sitges-dog-beach",
    title: "Sitges Dog Beach Rally Poster",
    date: "2026-03-20",
    thumbnail: "https://v3b.fal.media/files/b/0a92c84e/lBYcY4zDkIqRR3JwI7l4W_jKf35Py2.jpg",
    fields: [
      { key: "PLATFORM", value: "Instagram" },
      { key: "SIZE", value: "Post (portrait)" },
      { key: "STYLE", value: "Photorealistic" },
      { key: "BRANDING", value: "Yes" },
      { key: "FOCUS", value: "Rally poster for dog beach access in Sitges" },
      { key: "AUDIENCE", value: "General public" },
      { key: "CTA", value: "Attend the rally" },
      { key: "MESSAGING", value: "Sitges Beaches for All Paws" },
      { key: "TEXT", value: "Headline in-world; event details as studio overlay" },
      { key: "CONSTRAINTS", value: "None" },
      { key: "RIGHTS", value: "Confirmed — photo of person with dog on Sitges beachfront" },
    ],
  },
  {
    id: "irezumi-tattoo",
    title: "Japanese Irezumi Tattoo Design",
    date: "2026-03-20",
    fields: [
      { key: "SIZE", value: "3×3 inches (~900×900px)" },
      { key: "PLATFORM", value: "Temporary tattoo for event distribution" },
      { key: "STYLE", value: "Mural — Japanese Irezumi" },
      { key: "SUBSTYLE", value: "Traditional Japanese tattoo (waves, clouds, patterns)" },
      { key: "FOCUS", value: "Person and dog portrait with Irezumi decorative elements" },
      { key: "MESSAGING", value: "THING! WOW! — on decorative banner/scroll" },
      { key: "TEXT", value: "In-world on decorative banner element" },
      { key: "BRANDING", value: "No" },
      { key: "CONSTRAINTS", value: "Keep natural features intact; Irezumi for framing only" },
      { key: "RIGHTS", value: "Consent confirmed — photo shows identifiable person" },
    ],
  },
  {
    id: "daily-mindset-ritual",
    title: "Daily Mindset Ritual — Founder Cards",
    date: "2026-04-01",
    fields: [
      { key: "SIZE", value: "Letter/A4 quarters (~4.25×5.5\" per card)" },
      { key: "PLATFORM", value: "Print — daily ritual cards" },
      { key: "STYLE", value: "Minimal/clean with photographic elements" },
      { key: "FOCUS", value: "7 visual cards for founder daily grounding and motivation" },
      { key: "BRANDING", value: "No" },
      { key: "TEXT", value: "Section titles in-world (≤8 words); body as studio overlay" },
      { key: "CONSTRAINTS", value: "No corporate imagery; each card distinct, not templated" },
      { key: "SUCCESS", value: "Visuals that ground and motivate daily; print-ready" },
      { key: "CONTEXT", value: "Founder building distributed organizing infrastructure with AI" },
    ],
  },
  {
    id: "founder-infrastructure",
    title: "Founder as Infrastructure",
    date: "2026-04-01",
    fields: [
      { key: "SIZE", value: "Half Letter portrait (512×1280px)" },
      { key: "PLATFORM", value: "Print — daily morning ritual" },
      { key: "STYLE", value: "ILLUS_HAND (Hand-Drawn Illustration)" },
      { key: "SUBSTYLE", value: "Ink / Blue Ballpoint Pen" },
      { key: "FOCUS", value: "Founder integrated into blueprint — part of the design, not separate" },
      { key: "BRANDING", value: "No" },
      { key: "TEXT", value: "\"I am\" header + affirmation body — studio overlay" },
      { key: "CONSTRAINTS", value: "Open composition, lines fade organically, no hard edges" },
      { key: "IMAGE_BASE", value: "Yes — IMG_1864.jpeg (facial features reference)" },
      { key: "RIGHTS", value: "Confirmed" },
      { key: "SUCCESS", value: "Recognizable likeness in sketch; blueprint integration feels natural; gives energy in the morning" },
    ],
  },
];

interface SavedBriefsProps {
  isImageBot: boolean;
  onUseBrief?: (briefContent: string) => void;
}

/** Format a brief's fields into a readable text block for injection into chat */
function formatBriefForInjection(brief: SavedBrief): string {
  const lines = [`Creative Brief: ${brief.title}\n`];
  for (const field of brief.fields) {
    const label = FIELD_LABELS[field.key] || field.key;
    lines.push(`${label}: ${field.value}`);
  }
  return lines.join("\n");
}

export function SavedBriefs({ isImageBot, onUseBrief }: SavedBriefsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!isImageBot) return null;

  return (
    <div className="border-t border-card-stroke">
      <div className="px-4 py-3">
        <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
          <Icon name="file-document" size={12} />
          Saved Briefs
        </h2>
      </div>
      <div className="pb-2">
        {SAVED_BRIEFS.map((brief) => {
          const isExpanded = expandedId === brief.id;
          const styleField = brief.fields.find((f) => f.key === "STYLE")?.value || "";
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
                  <p className="text-[10px] text-text-muted mt-0.5">
                    {styleField}
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
                  <div className="px-3 pb-2.5 pt-1 border-t border-black/5 space-y-1.5">
                    {brief.fields.map((req) => (
                      <div key={req.key} className="flex items-start gap-2">
                        <span className="text-[9px] font-semibold text-accent-purple uppercase shrink-0 w-14 pt-0.5">
                          {FIELD_LABELS[req.key] || req.key}
                        </span>
                        <span className="text-[10px] text-text-secondary leading-tight">
                          {req.value}
                        </span>
                      </div>
                    ))}
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
