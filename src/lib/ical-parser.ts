/**
 * Lightweight ICS/iCal parser for extracting VEVENT data.
 * No native dependencies — works in any JS runtime.
 */

export interface ParsedEvent {
  uid: string;
  summary: string;
  start: Date | null;
  end: Date | null;
  location: string | null;
  description: string | null;
}

/**
 * Parse an ICS date string into a JS Date.
 * Handles: 20260401T140000Z, 20260401T140000, 20260401, with TZID prefix stripped.
 */
function parseIcsDate(value: string): Date | null {
  if (!value) return null;

  // Strip any TZID prefix (e.g. "TZID=America/New_York:")
  const cleaned = value.includes(":") ? value.split(":").pop()! : value;

  // Full datetime: 20260401T140000Z or 20260401T140000
  const dtMatch = cleaned.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
  if (dtMatch) {
    const [, y, mo, d, h, mi, s] = dtMatch;
    if (cleaned.endsWith("Z")) {
      return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s));
    }
    return new Date(+y, +mo - 1, +d, +h, +mi, +s);
  }

  // Date only: 20260401
  const dMatch = cleaned.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (dMatch) {
    const [, y, mo, d] = dMatch;
    return new Date(+y, +mo - 1, +d);
  }

  // Fallback
  const fallback = new Date(cleaned);
  return isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * Unfold ICS lines (continuation lines start with space/tab).
 */
function unfold(text: string): string {
  return text.replace(/\r?\n[ \t]/g, "");
}

/**
 * Parse ICS text and return VEVENT entries.
 */
export function parseIcs(icsText: string): ParsedEvent[] {
  const unfolded = unfold(icsText);
  const lines = unfolded.split(/\r?\n/);
  const events: ParsedEvent[] = [];

  let inEvent = false;
  let current: Partial<ParsedEvent> = {};

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      current = {};
      continue;
    }

    if (line === "END:VEVENT") {
      inEvent = false;
      events.push({
        uid: current.uid || Math.random().toString(36).slice(2),
        summary: current.summary || "Untitled Event",
        start: current.start || null,
        end: current.end || null,
        location: current.location || null,
        description: current.description || null,
      });
      continue;
    }

    if (!inEvent) continue;

    // Extract property name and value
    // Handle properties with parameters like DTSTART;TZID=America/New_York:20260401T140000
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;

    const propPart = line.slice(0, colonIdx);
    const value = line.slice(colonIdx + 1);
    const propName = propPart.split(";")[0].toUpperCase();

    switch (propName) {
      case "UID":
        current.uid = value;
        break;
      case "SUMMARY":
        current.summary = value.replace(/\\n/g, " ").replace(/\\,/g, ",").replace(/\\\\/g, "\\");
        break;
      case "DTSTART":
        current.start = parseIcsDate(value);
        break;
      case "DTEND":
        current.end = parseIcsDate(value);
        break;
      case "LOCATION":
        current.location = value.replace(/\\n/g, " ").replace(/\\,/g, ",").replace(/\\\\/g, "\\") || null;
        break;
      case "DESCRIPTION":
        current.description = value.replace(/\\n/g, "\n").replace(/\\,/g, ",").replace(/\\\\/g, "\\").slice(0, 300) || null;
        break;
    }
  }

  return events;
}
