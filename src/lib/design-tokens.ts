/**
 * Design Tokens — single source of truth for the Tectonica.AI design system.
 *
 * CSS custom properties in globals.css and the Tailwind @theme block
 * reference these values. Components should use CSS vars (var(--…)) or
 * Tailwind token classes (bg-card, text-accent, etc.) — never raw hex.
 */

// ─── Page & Layout — Tremor neutral defaults (Session G applies brand colors) ──
export const BG = "#F4F4F5" as const;
export const CARD_BG = "#ffffff" as const;
export const CARD_STROKE = "rgba(0, 0, 0, 0.08)" as const;
export const SIDEBAR_BG = "#FAFAFA" as const;
export const SIDEBAR_ACTIVE = "#18181B" as const;
export const TOPBAR_BG = "#FFFFFF" as const;

// ─── Text ────────────────────────────────────────────────────────
export const TEXT_PRIMARY = "#1a1a2e" as const;
export const TEXT_SECONDARY = "#4a4a6a" as const;
export const TEXT_MUTED = "#8a8aaa" as const;

// ─── Accents ─────────────────────────────────────────────────────
export const ACCENT_PURPLE = "#18181B" as const;
export const ACCENT_PURPLE_LIGHT = "#3F3F46" as const;

// ─── Category Colors — Tremor neutral defaults (Session G applies brand colors) ──
export const CAT_ADVISORS = "#F4F4F5" as const;
export const CAT_ADVISORS_ACCENT = "#E4E4E7" as const;
export const CAT_CREATE = "#F4F4F5" as const;
export const CAT_CREATE_ACCENT = "#E4E4E7" as const;
export const CAT_TOOLS = "#F4F4F5" as const;
export const CAT_TOOLS_ACCENT = "#E4E4E7" as const;
export const CAT_ANALYZE = "#F4F4F5" as const;
export const CAT_ANALYZE_ACCENT = "#E4E4E7" as const;

// ─── Layout Dimensions ──────────────────────────────────────────
export const SIDEBAR_WIDTH = "180px" as const;
export const RIGHT_SIDEBAR = "clamp(440px, 54vw, 1020px)" as const;

// ─── Border Radii ───────────────────────────────────────────────
export const RADIUS = "4px" as const;
export const RADIUS_SM = "2px" as const;
export const RADIUS_LG = "4px" as const;

// ─── Widget Background Colors (Right Sidebar) ───────────────────
// Neutral defaults — Session G applies brand colors via CSS var overrides.
// Note: "Recruit More People" uses ACCENT_PURPLE — no separate token.
export const WIDGET_BG_RECRUIT = "#ffffff" as const;
export const WIDGET_BG_SIGNUPS = "#ffffff" as const;
export const WIDGET_BG_CONVERSATIONS = "#ffffff" as const;
export const WIDGET_BG_ACTIONS = "#ffffff" as const;
export const WIDGET_BG_FUNDRAISING = "#ffffff" as const;
export const WIDGET_BG_RECRUITMENT_GOAL = "#ffffff" as const;
export const WIDGET_BG_REQUEST_APPROVAL = "#ffffff" as const;
export const WIDGET_BG_CONNECTED_SYSTEMS = "#ffffff" as const;
export const WIDGET_BG_HOURS = "#ffffff" as const;
export const WIDGET_BG_EVENTS = "#ffffff" as const;
export const WIDGET_BG_DIRECTORY = "#ffffff" as const;

// ─── Common Semantic Colors ─────────────────────────────────────
export const STATUS_ONLINE = "#22C55E" as const;
export const STATUS_AWAY = "#F59E0B" as const;
export const STATUS_OFFLINE = "#9CA3AF" as const;

// ─── Gradient ───────────────────────────────────────────────────
export const GRADIENT_PURPLE = "linear-gradient(135deg, #18181B, #3F3F46)" as const;

// ─── Chat Surfaces ──────────────────────────────────────────────
export const CHAT_INPUT_BG = "rgba(244, 244, 245, .85)" as const;
export const MSG_BOT_BG = "rgba(255, 255, 255, .7)" as const;
export const MSG_USER_BG = "rgba(24, 24, 27, .1)" as const;

// ─── Calendar Color Picker Options ──────────────────────────────
export const CALENDAR_COLORS = [
  "#7C3AED", "#3B82F6", "#10B981", "#F59E0B",
  "#EF4444", "#EC4899", "#6366F1", "#14B8A6",
] as const;
