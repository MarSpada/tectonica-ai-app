"use client";

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
  if (requirements.length === 0) return null;

  return (
    <div className="border-t border-card-stroke">
      <div className="px-4 py-3 border-b border-card-stroke">
        <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
          <Icon name="edit" size={12} />
          Creative Brief
        </h2>
      </div>
      <div className="px-4 py-3 space-y-2">
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
    </div>
  );
}
