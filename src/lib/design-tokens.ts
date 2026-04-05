/**
 * Design Tokens — single source of truth for the Tectonica.AI design system.
 *
 * CSS custom properties in globals.css and the Tailwind @theme block
 * reference these values. Components should use CSS vars (var(--…)) or
 * Tailwind token classes (bg-card, text-accent, etc.) — never raw hex.
 */

// ─── Page & Layout — Tremor neutral defaults (Session G Phase 2 applies remaining brand colors) ──
export const BG = "#F6F4FF" as const;
export const CARD_BG = "#ffffff" as const;
export const CARD_STROKE = "rgba(0, 0, 0, 0.08)" as const;
export const SIDEBAR_BG = "#F2F0FC" as const;
export const SIDEBAR_ACTIVE = "#18181B" as const;
export const TOPBAR_BG = "#FFFFFF" as const;

// ─── Text ────────────────────────────────────────────────────────
export const TEXT_PRIMARY = "#1a1a2e" as const;
export const TEXT_SECONDARY = "#4a4a6a" as const;
export const TEXT_MUTED = "#8a8aaa" as const;

// ─── Accents ─────────────────────────────────────────────────────
export const ACCENT_PURPLE = "#18181B" as const;
export const ACCENT_PURPLE_LIGHT = "#3F3F46" as const;

// ─── Category Colors — Tremor neutral defaults (Session G Phase 2 applies brand colors) ──
export const CAT_ADVISORS = "#F2F0FC" as const;
export const CAT_ADVISORS_ACCENT = "#FFFFFF" as const;
export const CAT_CREATE = "#FBE9D8" as const;
export const CAT_CREATE_ACCENT = "#FFFFFF" as const;
export const CAT_TOOLS = "#FFDADD" as const;
export const CAT_TOOLS_ACCENT = "#FFFFFF" as const;
export const CAT_ANALYZE = "#D7F5E6" as const;
export const CAT_ANALYZE_ACCENT = "#FFFFFF" as const;

// ─── Layout Dimensions ──────────────────────────────────────────
export const SIDEBAR_WIDTH = "180px" as const;
export const RIGHT_SIDEBAR = "clamp(440px, 54vw, 1020px)" as const;

// ─── Border Radii ───────────────────────────────────────────────
export const RADIUS = "4px" as const;
export const RADIUS_SM = "2px" as const;
export const RADIUS_LG = "4px" as const;

// ─── Widget Background Colors (Right Sidebar) — Figma-defined pastels ───
export const WIDGET_BG_RECRUIT = "#E0DBF8" as const;
export const WIDGET_BG_SIGNUPS = "#FBE9D8" as const;
export const WIDGET_BG_CONVERSATIONS = "#FFFFFF" as const;
export const WIDGET_BG_ACTIONS = "#FFFFFF" as const;
export const WIDGET_BG_FUNDRAISING = "#FFDADD" as const;
export const WIDGET_BG_RECRUITMENT_GOAL = "#E0DBF8" as const;
export const WIDGET_BG_REQUEST_APPROVAL = "#D7F5E6" as const;
export const WIDGET_BG_CONNECTED_SYSTEMS = "#FFFFFF" as const;
export const WIDGET_BG_HOURS = "#D7F5E6" as const;
export const WIDGET_BG_EVENTS = "#FBE9D8" as const;
export const WIDGET_BG_DIRECTORY = "#FFFFFF" as const;

// ─── Widget Typography — Figma specs (Session G), em-based ─────
export const WIDGET_TEXT_COLOR = "#333333" as const;
export const WIDGET_TEXT_MUTED = "rgba(51, 51, 51, 0.5)" as const;
export const WIDGET_TITLE_SIZE = "1em" as const;
export const WIDGET_TITLE_WEIGHT = "700" as const;
export const WIDGET_METRIC_LG = "1.9375em" as const;
export const WIDGET_METRIC_MD = "1.5em" as const;
export const WIDGET_METRIC_SM = "0.9375em" as const;
export const WIDGET_METRIC_WEIGHT = "600" as const;
export const WIDGET_LABEL_SIZE = "0.9375em" as const;
export const WIDGET_LIST_PRIMARY_SIZE = "0.75em" as const;
export const WIDGET_LIST_PRIMARY_WEIGHT = "700" as const;
export const WIDGET_LIST_SECONDARY_SIZE = "0.625em" as const;
export const WIDGET_LIST_SECONDARY_WEIGHT = "500" as const;
export const WIDGET_BTN_LABEL_SIZE = "0.75em" as const;
export const WIDGET_BTN_LABEL_WEIGHT = "600" as const;

// ─── Widget Button Accents — Figma (Session G) ─────────────────
export const WIDGET_BTN_FUNDRAISING = "#FE6778" as const;
export const WIDGET_BTN_HOURS = "#308C4F" as const;
export const WIDGET_BTN_APPROVAL = "#308C4F" as const;

// ─── Widget Chart/Progress Accents — Figma (Session G) ─────────
export const WIDGET_CHART_FUNDRAISING = "#FE6778" as const;
export const WIDGET_CHART_FUNDRAISING_TRACK = "rgba(254, 103, 120, 0.2)" as const;
export const WIDGET_CHART_MEMBERS = "#422D8F" as const;
export const WIDGET_CHART_MEMBERS_TRACK = "rgba(66, 45, 143, 0.2)" as const;
export const WIDGET_CHART_SUPPORTERS = "#159EC1" as const;
export const WIDGET_CHART_SUPPORTERS_TRACK = "rgba(21, 158, 193, 0.2)" as const;
export const WIDGET_CHART_HOURS = "#308C4F" as const;

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
