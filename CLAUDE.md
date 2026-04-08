# Tectonica.AI — Movement Intelligence App

## What This Is

The functional version of Tectonica.AI's **Movement Intelligence** platform — an AI-powered suite of bots for political and social movement organizing. This app is being built based on a static prototype located at [github.com/MarSpada/tectonica.ai-future](https://github.com/MarSpada/tectonica.ai-future).

**The prototype is the design reference.** When in doubt about how something should look or behave, consult the prototype's `index.html`, `styles.css`, and `main.js`.

## Prototype Overview

The prototype is a desktop-only, non-functional mockup (vanilla HTML/CSS/JS, no build step) deployed on Railway. It demonstrates the full UI: bot grid, bot chat with AI responses, Group Coach Bot page, Group Media gallery, right sidebar dashboard widgets, and a visual image editor embedded via iframe for the Graphics Creation bot.

---

## Session Protocol

### Every session — opening ritual
1. Read this entire CLAUDE.md before writing any code
2. State which files you will touch this session and why
3. Run the hygiene audit on those files (see audit prompt below)
4. Wait for approval before making any changes

### Hygiene audit prompt
Before touching any file, scan it for:

TYPES
- Any use of `any` type (explicit or implicit)
- Types defined inline instead of in lib/types.ts
- Duplicate type definitions already in lib/types.ts

DATA FETCHING
- Components that both fetch data and render UI
- Supabase server client imported in a client component
- Supabase client imported in a server component or API route
- User role/org/group data fetched directly instead of via UserProfileContext

API ROUTES
- Routes missing an auth check
- Routes returning errors without { error: string } shape
- NationBuilder API called directly instead of through lib/signup-utils.ts

STATE + EFFECTS
- Supabase Realtime subscriptions without useEffect cleanup
- useEffect with missing or incorrect dependency arrays

DEAD CODE
- Unused imports
- Commented-out code blocks
- TODO/FIXME comments
- Components or functions defined but never called

HARDCODED VALUES
- Hardcoded user IDs, org IDs, or group IDs
- Hardcoded strings that should come from DB or config
- Hardcoded color values that should use design tokens

Report findings grouped by category. Do not fix anything until instructed.

### Every session — closing ritual
Ask yourself before ending:
- What did I build or change?
- What did I intentionally skip or defer?
- Are there any new TODOs or known fragile points?
- What should the next session read or know before starting?

Output a short handover note covering these four points.

### Multi-session continuity
This is an ongoing project. Previous sessions have already built
significant functionality. Do not re-implement, rename, or refactor
anything that is already working unless explicitly asked to.
When in doubt about an existing pattern, find an example in the
codebase and follow it — don't invent a new approach.

---

## Conventions (read before writing any code)

### Data fetching
- Server components and API routes use `createClient()` from `lib/supabase/server.ts`
- Client components use `createClient()` from `lib/supabase/client.ts`
- Never import the server client into a client component or vice versa

### API routes
- All routes return `{ error: string }` on failure with an appropriate HTTP status
- All routes use `NextResponse.json()` consistently (never bare `Response.json()`)
- New routes should use `requireAuth()` from `lib/api-utils.ts` for auth + profile lookup. Existing routes are being migrated incrementally.
- Use `fetchProfileMap()` from `lib/api-utils.ts` for batch profile enrichment (replaces inline collect-IDs → fetch → build-map pattern)
- Role checks use the `profiles` table, not JWT claims directly
- Role string comparisons use constants from `lib/constants/roles.ts` — never hardcode `"super_admin"` etc.
- All `/api/admin/` routes have server-side role checks (`isSuperAdmin` or `isAdminRole`) — client-side guards in AdminView.tsx are not sufficient alone

### Types
- All shared types live in `lib/types.ts` — never define types inline in components
- Never use `any` — if the shape is unknown, define a type for it

### Roles
- All role string comparisons use constants from `lib/constants/roles.ts` — `ROLES.SUPER_ADMIN`, `ROLES.GROUP_ADMIN`, `ROLES.MEMBER`, `ROLES.SUPPORTER`
- Use `isAdminRole(role)` for super_admin OR group_admin checks, `isSuperAdmin(role)` for super_admin-only checks
- Use `VALID_ROLES` array for validation instead of inline arrays
- Never hardcode role strings — import from `lib/constants/roles.ts`

### Components
- User role/org/group data comes from `UserProfileContext` (includes orgName, groupName) — never re-fetch it inside a component
- New components go in the most specific folder that makes sense (`admin/`, `chat/`, etc.)
- No component should fetch data AND render UI — split into a data-fetching parent and a presentational child if needed

### State
- No global state library — use React Context for cross-tree state, local useState for component state
- Supabase Realtime subscriptions must be cleaned up in useEffect return functions

### NationBuilder
- All NationBuilder API calls go through `lib/signup-utils.ts` — never call the NB API directly from a component or route
- NB credentials (API token + slug) are stored encrypted in `org_integrations` table, managed by super admins via admin Integrations tab
- `fetchRecentSignups()` accepts a `NbCredentials` param — credentials resolved in the signups API route (DB first, env var fallback with warning)
- NB has an enable/disable toggle in admin Integrations tab. When disabled, NB is hidden from the Connected Systems widget and SignupsWidget shows an empty state
- `NATIONBUILDER_API_TOKEN` and `NATIONBUILDER_SLUG` env vars are kept as fallback during transition — can be removed once admin configures credentials via UI

### Dashboard widgets
- All dashboard widget visibility uses WIDGET_PERMISSIONS from `lib/dashboard-widgets.ts` — never hardcode role checks for widgets inline
- All widget size constraints use WIDGET_CONSTRAINTS — never hardcode minW/maxW/minH/maxH in components
- To add a new widget: add its ID to WIDGETS, define its LABEL, PERMISSIONS, CONSTRAINTS, and default position in SYSTEM_DEFAULT_LAYOUT — nowhere else

### Overlays
- Use Shadcn Sheet (side="right") for detail views, multi-field forms, and anything where the user might want to reference background content while interacting
- Use Shadcn Dialog for confirmations, destructive actions, and small single-purpose forms (1-3 fields)
- Never use custom lightbox implementations — always Sheet or Dialog
- Existing modals converted in Session B used Dialog — review against these rules in future sessions and convert to Sheet where appropriate

### Border radius
- Shadcn --radius base is set to 4px — deliberately lower than default to match our design language
- Badges use rounded-full intentionally — do not change
- Do not override border radius per-component unless there is a specific design reason

### RLS vs API role checks (calendar_sources)
- Calendar source RLS policies use `is_admin()` (allows both super_admin and group_admin) for future flexibility
- Calendar source API routes (`/api/admin/calendars/*`) currently restrict to `isSuperAdmin()` only
- This mismatch is intentional and by design — RLS is permissive so that when group_admin calendar management is added, only the API route check needs to change (no migration required)
- Do not "fix" this by aligning RLS down to super_admin-only or API up to is_admin — both are correct as-is

---

## Design System

### Theme: Light Pastel ("Google Labs" style)

### Design Tokens

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#d4c0fd` | Page background (light lavender) |
| `--card-bg` | `#ffffff` | Card backgrounds |
| `--card-stroke` | `rgba(0,0,0,.08)` | Card border |
| `--sidebar-bg` | `#d4c0fd` | Matches page bg, seamless |
| `--sidebar-active` | `#6B3FA0` | Dark purple accent |
| `--text-primary` | `#1a1a2e` | Primary text |
| `--text-secondary` | `#4a4a6a` | Secondary text |
| `--text-muted` | `#8a8aaa` | Muted text |
| `--accent-purple` | `#7C3AED` | Purple accent (buttons, highlights) |
| `--sidebar-width` | `180px` | Left sidebar width |
| `--right-sidebar` | `clamp(340px, 42vw, 780px)` | Right sidebar (responsive) |
| `--radius` | `4px` | Default border radius |
| `--radius-sm` | `2px` | Small radius |
| `--radius-lg` | `4px` | Large radius |

### Category Pastel Colors (bot cards)

| Category | CSS var | Card bg | Circle accent |
|---|---|---|---|
| Advisors | `--cat-organizer` | `#FFB5A7` (coral) | `#E89485` |
| Create Things | `--cat-content` | `#A8D8EA` (sky blue) | `#7FC4DB` |
| Use Organizing Tools | `--cat-fundraising` | `#B5EAD7` (mint) | `#8DD4BC` |
| Understand + Analyze | `--cat-admin` | `#FFDAC1` (yellow/peach) | `#F0B88A` |

### Typography

- **Font family**: Google Sans (variable, self-hosted TTF)
- Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold), 800 (extra bold)

### Icons

- **Material Icons Two-Tone** (Google Fonts CDN) for bot card circles
- Inline SVGs for UI elements (nav, buttons, actions)
- Icon `color` prop uses CSS `mask-image` technique — do not switch to `fill` or `className` color utilities
- Tremor `ProgressCircle` stroke colors are overridden via CSS custom properties (`--progress-color`, `--track-color`) — this is intentional, do not revert to Tremor defaults

---

## Layout (3 columns)

### Top Bar
- Background: `#B3BBEE`
- Left: sidebar collapse button, org icon (orange rounded square with first letter of org name), org name (dynamic from DB, clickable — returns to dashboard), group name pill (dynamic from DB)
- Right: Tectonica.AI logo (`images/logo-color.png`)

### Left Sidebar (180px)
- Nav items: **Group Coach Bot**, **Group Media**, **Members**
- **Leaders & Organizers** chat button (opens slide-in panel)
- **Helper Chats** section: search input + list of recent bot chats (Graphics Creation, Canvassing Planner, Events Planning)
- User info at bottom: avatar, name, role, settings gear
- Collapses to 64px icon-only at 899px, becomes overlay drawer at 699px

### Main Content
- Header: "Welcome back, Ned. Choose a bot to get started."
- **Your Bots** (featured): horizontal scrollable carousel, 5 per row, ~15% larger than grid cards, SortableJS drag-and-drop reordering
- **Bot categories**: 6-column grid of bot cards grouped under category headers

### Right Sidebar ("Group Dashboard")
- 12-column CSS grid with explicit row/column placement
- Widgets: New Sign-Ups, Recruit More People, Group Conversations, Group Actions, Fundraising, Recruitment Goal, Request Approval, Connected Systems, Hours Volunteered, Group Directory, Upcoming Events

---

## Right Sidebar Widget Grid (12-column layout)

| Widget | Columns | Rows | Background |
|---|---|---|---|
| New Sign-Ups | 1–9 | 1–2 | `#fef3c7` |
| Recruit More People | 10–12 | 1–2 | `var(--accent-purple)` |
| Group Conversations | 1–6 | 3–7 | `#f5f3ff` |
| Group Actions | 7–12 | 3–7 | `#f0e6ff` |
| Fundraising | 1–4 | 8–14 | `#fff3e0` |
| Recruitment Goal | 5–8 | 8–11 | `#e0f2fe` |
| Request Approval | 9–12 | 8–11 | `#fdf2f8` |
| Connected Systems | 9–12 | 11–15 | `#f8fafc` |
| Hours Volunteered | 5–8 | 12–14 | `#ecfdf5` |
| Upcoming Events | 9–12 | 15–20 | `#f0f9ff` |
| Group Directory | 1–8 | 15–20 | `#fff` |

---

## Bot Cards

### Grid Layout
- 6-column grid (`repeat(auto-fill, minmax(120px, 1fr))`) with 14px gap
- `aspect-ratio: 3 / 4` (tall portrait)
- Solid pastel bg per category, `border-radius: 20px`
- Circle placeholder (56px) with Material Icons Two-Tone icon inside
- "BOT" pill badge at bottom
- Hover: `translateY(-4px)` lift + deeper shadow, overlay appears with same bg color at 100% opacity and black text description

### Featured ("Your Bots")
- Cards inherit source-category colors via `data-category` attribute
- ~15% larger, 5 per row
- Default: Graphics Creation, Canvassing Planner, Group Leadership Coach, Events Planning + Management, Creating People Power

---

## Bot Categories & Names

### Advisors (coral `#FFB5A7`)
- Getting Started + Help (`help_outline`)
- Local Strategy Planning (`map`)
- Recruitment Planning (`person_add`)
- Action Planning (`flag`)
- Events Planning + Management (`event`)
- Relationship/Contact Mng (`contacts`)
- Group Leadership Coach (`groups`)
- Group Fundraising (`paid`)
- Canvassing Planner (`directions_walk`)

### Create Things (sky blue `#A8D8EA`)
- Graphics Creation (`palette`)
- Written Content (`description`)
- Distributed Email (`email`)
- Set-Up/Manage Group Webpage (`web`)
- Video Creation (`videocam`)

### Use Organizing Tools (mint `#B5EAD7`)
- Ad Placement (`ads_click`)
- Social Media (`share`)
- Tech Tools How-To (`build`)
- Targeted Advocacy (`campaign`)

### Understand + Analyze (peach `#FFDAC1`)
- Creating People Power (`volunteer_activism`)
- Recruitment Progress (`trending_up`)
- Email Performance (`mark_email_read`)
- Networks/Resources/Orgs (`hub`)
- Group Decision Making (`how_to_vote`)

---

## Views / Pages

### 1. Dashboard (default)
Main bot grid + right sidebar dashboard. Body has no special class.

### 2. Bot Chat (`body.chat-mode`)
- Triggered by clicking any bot card
- Full chat interface: header (bot name, status, back button), messages area, input with mic + send
- Right panel: "Recent Conversations" history sidebar (260px)
- **Graphics Creation bot only**: "Open in Studio" button in header → toggles `body.editor-open` which shows embedded visual editor iframe (62% width) and shrinks chat to 38%
- Editor iframe URL: `https://qwen-image-editor-production-49d4.up.railway.app/standalone/studio?imageUrl=...&user_id=Tectonica`

### 3. Group Coach Bot (`body.coach-mode`)
- Triggered by sidebar nav "Group Coach Bot"
- Two-column layout: chat (left) + campaign stats sidebar (right)
- Campaign stats: goals (voter contacts, volunteer recruitment, fundraising target), strategy notes, upcoming events
- Chat has pre-populated conversation showing stats cards (doors knocked, calls made, texts sent, events held)

### 4. Group Media (`body.media-mode`)
- Triggered by sidebar nav "Group Media"
- CMS-style media gallery: header with item count + "Upload Media" button
- Toolbar: search, filter pills (All/Images/Videos/Documents), grid/list view toggle
- Card grid with colored placeholder thumbnails, type badges (IMG blue, VID red, DOC green, PDF amber)
- Pagination at bottom

### 5. Group Conversation Overlay
- Triggered by "Open Conversation" button in the chat-preview widget
- Full overlay inside right sidebar with message thread + input

### 6. Leaders & Organizers Chat Panel
- Triggered by sidebar chat button
- Slide-in panel from left with contact list + message thread

### 7. Super Admin Panel (`/admin`)
- Role-guarded (super_admin only, group_admin gets limited access)
- Sidebar navigation (220px) with 3 groups: Manage, Tools, Settings
- 9 sections (super admin): People, Hours, Goals, Organization, Bots, Branding, Landing Pages, Integrations, Billing
- 5 sections (group admin): People, Hours, Goals, Branding, Landing Pages
- **Hours tab**: Team volunteer hours summary (KPI cards: total hours, this month, active volunteers), member table sorted by activity, detail sheet per member with full log entries
- **Organization tab**: Edit org name, manage groups (rename)
- **People tab**: List all org members, change roles (super_admin/group_admin/member/supporter), reassign groups, remove members, inline name editing
- **Bots tab**: DB-driven bot management (create, edit, delete), system prompt editor, category/icon picker
- **Integrations tab**: Calendar source management (add/remove iCal/Google/Mobilize feeds, toggle enable/disable, color coding), NationBuilder status, Action Network/Mobilize status
- **Billing tab** (super_admin only): Credit balance + this month's spend, add credits form, top-up history (20 most recent), generation rates (cost_per_mp_base, cost_per_mp_extra) with inline edit, platform fee percentage with inline edit. All data from group_billing table via billing API routes.

### 8. Approvals Page (`/approvals`)
- Submit items for admin/group_admin review (text + file attachments)
- Status workflow: pending → approved OR changes_requested → resubmit
- Comment thread per approval request
- Email notifications via Resend to reviewer on submit and to submitter on status change
- In-app notification bar for approval-related updates

### 9. Members Page (`/members`)
- Two tabs: **Directory** (list view with search + role filters) and **Org Chart** (D3 radial/snowflake visualization)
- Directory tab: search by name/email, role filter pills (All/Leaders/Members/Supporters), member count badge
- Org Chart tab: interactive D3 radial tree showing role hierarchy (center=group → admins → members → supporters). Pill labels on center/admin nodes always visible, member/supporter pills on hover. Click node → MemberDetailModal. Zoom/pan supported.
- Member detail view (`/members/[id]`)

### 10. Actions Page (`/actions`)
- Full actions list with filters: scope (All Actions / Assigned to Me), type, status (Active / Completed / Archived — last admin-only)
- Action cards: title, type badge, source badge, points, deadline, assignment scope, completion status, admin controls (edit/archive)
- Create Action button (admin only) → Sheet with full form (type, points, scope, bot suggestion, dates, visibility)
- Click action card → Detail Sheet with CTA button, completion notes, "Mark as Complete" (disabled until CTA clicked for external actions), self-assign, admin completion list
- Entry point: "All Actions" button in Group Actions dashboard widget (not in left sidebar nav)

### 11. Signups Page (`/signups`)
- Full NationBuilder signups table with search by name/email/phone
- Columns: Name, Email/Phone, Signed Up (with urgency), Status, Assigned To
- Click row → NbSignupModal for contact/call/assign
- Entry point: "See all the (##) new signups" button in SignupsWidget

### 12. Settings Page (`/settings`)
- Profile tab: edit name, bio, avatar upload (Supabase Storage)
- Account tab: account settings

---

## Navigation Pattern

All views use the same pattern:
1. `closeAllViews()` — removes all body mode classes (`chat-mode`, `coach-mode`, `media-mode`, `editor-open`), hides all view sections
2. Add the target body class
3. Show the target section via `style.display`
4. Animate in with GSAP

Clicking org name "People's Movement" in top bar → `returnToDashboard()`

---

## User & Organization

- **Organization**: People's Movement (dynamic from DB)
- **Group**: Sample group (dynamic from DB, editable by super_admin)
- **Role hierarchy**: super_admin > group_admin > member > supporter

---

## Connected Systems (integrations)

- **Open WebUI / RunPod** — AI model provider. Open WebUI proxies to RunPod-hosted models. Configured per-org in Integrations tab (endpoint URL + encrypted bearer token). Model "ChangeAgent" available.
- **NationBuilder** — Enable/disable toggle in admin Integrations tab. Credentials (API token + slug) stored encrypted in DB via `org_integrations`. Read-only signup ingestion, v2 API. Env var fallback during transition.
- **Calendar Sources** — System-agnostic iCal/ICS feeds (Google Calendar, Outlook, Mobilize, etc.), managed by super_admin in Integrations tab
- **Action Network** — Not Connected (coming soon)
- **Mobilize** — Not Connected (coming soon)

---

## Responsive Breakpoints (prototype)

| Breakpoint | Behavior |
|---|---|
| 1399px | Compact widget fonts/padding |
| 1199px | Restack widget grid to pairs, featured carousel 4-per-row |
| 999px | Hide right sidebar |
| 899px | Collapse left sidebar to 64px icon-only |
| 699px | Sidebar becomes overlay drawer |

Desktop-first design. Mobile is out of scope for now.

---

## Key UX Patterns

- **Star/add to favorites**: Bot cards have star button to add/remove from "Your Bots" featured section
- **Drag-and-drop**: SortableJS for reordering featured bots
- **D3.js org chart**: Radial/snowflake tree in Members page — zoom, pan, pill labels, avatar rendering
- **GSAP animations**: Entrance animations on load, view transitions, card stagger animations
- **BEM-inspired CSS**: `.rs-widget`, `.rs-widget__title`, `.rs-widget--money`, `.bot-card`, `.bot-card__circle`
- **John Doe urgent styling**: New sign-up with pulsing red text animation on time indicator

---

## Tech Stack (Implemented)

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS 4 with design token CSS variables
- **Database**: Supabase PostgreSQL with RLS, Realtime subscriptions
- **Auth**: Supabase Auth (email/password, email confirmation)
- **AI**: Open WebUI + RunPod (OpenAI-compatible API via Open WebUI proxy, streaming SSE via API routes)
- **Email**: Resend (transactional emails for signups, approvals, notifications)
- **Animations**: GSAP entrance transitions + stagger animations
- **Integrations**: NationBuilder v2 API (read-only signup ingestion), iCal/ICS calendar feeds
- **Deployment**: Railway (two services, same repo, same Supabase DB)
  - `tectonica-ai-app` — original app, auto-deploys from `main` branch
  - `tectonica-ai-v2` — redesigned app, auto-deploys from `v2` branch
  - **All development happens on the `v2` branch** unless explicitly told otherwise
  - Never push redesign changes to `main` — it would break the original service

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key |
| `ENCRYPTION_KEY` | 32-byte hex string for AES-256-GCM encryption of RunPod + NB bearer tokens (generate: `openssl rand -hex 32`) |
| `NATIONBUILDER_API_TOKEN` | **DEPRECATED — transition fallback only.** NB v2 API Bearer token. Superseded by DB-stored encrypted credentials in `org_integrations`. Remove once admin configures via UI. |
| `NATIONBUILDER_SLUG` | **DEPRECATED — transition fallback only.** NB subdomain slug. Superseded by DB-stored value in `org_integrations`. Remove once admin configures via UI. |
| `RESEND_API_KEY` | Resend email API key |
| `RESEND_FROM_EMAIL` | Sender email address for Resend transactional emails |
| `SUPABASE_SERVICE_ROLE_KEY` | Required for migration scripts and `lib/supabase/service.ts` (external API endpoints with no user session). Bypasses RLS — use only where documented. |
| `CHANGE_AGENT_API_KEY` | Static Bearer token for the `/api/tools/generate-landing-page` external endpoint. Currently dormant — landing pages are generated natively via the chat route. Only needed if enabling external API access. |

---

## Database Migrations (Supabase)

| Migration | What It Does |
|---|---|
| `001_initial_schema.sql` | Organizations, groups, profiles (extends auth.users), bots, conversations, messages, media tables. Auto-profile trigger on signup. |
| `002_fix_conversations_bot_id.sql` | Changes conversations.bot_id from UUID FK to text slug |
| `003_user_favorites.sql` | user_favorite_bots table with position ordering |
| `004_member_directory.sql` | Expands roles (admin/organizer/leader/member/supporter), get_my_group_id() helper, get_group_members() RPC |
| `005_profile_settings.sql` | Bio column, public avatars storage bucket (2MB, JPEG/PNG/WebP) |
| `006_group_messages.sql` | group_messages table with Realtime, get_group_messages() RPC with pagination |
| `007_signup_assignments.sql` | signup_assignments + notifications tables, RLS, create_signup_assignment() atomic RPC |
| `008_auto_assign_group.sql` | Auto-assigns new users to default group on signup, backfills existing users |
| `009_admin_roles.sql` | Role hierarchy (super_admin/group_admin/member/supporter), admin helper functions (is_admin, is_super_admin, get_my_org_id), org-wide RLS, update_member_role() and reassign_member_group() RPCs, seeds 24 bots into DB |
| `010_approval_requests.sql` | Approval workflow: approval_requests + approval_comments tables, status workflow (pending→approved/changes_requested), 5MB approvals storage bucket, create/update/resubmit RPCs |
| `011_calendar_sources.sql` | Calendar sources per org: iCal/Google/Mobilize feed URLs, enabled toggle, color per source, RLS (members view, super_admin manage) |
| `012_volunteer_hours.sql` | volunteer_hours table with user/group/date tracking, hours validation (>0), RLS for group member viewing and self-logging |
| `013_fix_default_role.sql` | Changes default signup role from 'member' to 'supporter' in handle_new_user() trigger |
| `014_fundraising_goals.sql` | fundraising_goals table (per group/month): goal, amount_raised, print_budget. RLS: members view, admins manage |
| `015_reimbursement_requests.sql` | reimbursement_requests table + RPCs (create, update_status, resubmit). Storage bucket for attachments. Adds 'reimbursement_request' to notification types |
| `016_group_description.sql` | Adds description column to groups table |
| `017_dashboard_layouts.sql` | dashboard_layouts_default (org-level) + dashboard_layouts_user (per-user) tables for React Grid Layout persistence. RLS: members read org default, super_admin writes; users manage own layout |
| `018_media_items.sql` | Replaces old `media` stub with full `media_items` table (category, storage_path, url, title, description, mime_type, file_size, tags, status, visibility, soft delete, download_count, tsvector search). Adds `storage_used_bytes` to groups. RLS: group-scoped read (non-deleted only), role-gated insert (not supporters), owner+admin update. `soft_delete_media_item()` and `increment_storage_used()` SECURITY DEFINER RPCs for atomic operations that cross RLS boundaries. |
| `019_group_goals.sql` | `group_goals` table (one row per group): money_goal, money_budget, money_raised_offline, members_goal, supporters_goal, hours_goal, updated_by. UNIQUE(group_id). RLS: members read, admins (super_admin + group_admin) insert/update via `is_admin()`. Centralizes goal targets that feed Fundraising, Recruitment Goal, and Hours Volunteered dashboard widgets. `hours_goal` added via manual ALTER TABLE (no migration file). |
| `020_actions.sql` | Full actions system: `actions` table (source, type, title, description, call_to_action, url, suggested_bot_slug, points_value, priority, assignment_scope, starts_at, ends_at, status, visibility), `action_assignments` (member + group targeting), `action_completions` (UNIQUE per member per action, snapshotted points), `member_points_ledger` (UNIQUE per completion, audit trail). `complete_action()` SECURITY DEFINER RPC for atomic completion + points. RLS on all 4 tables: group-scoped reads, admin-only writes, members see own completions/ledger only. Error code contract (P0002–P0005) documented in both migration and API route. |
| `021_create_action_with_assignments.sql` | `create_action_with_assignments()` SECURITY DEFINER RPC: atomic action creation with optional targeted assignments. If either insert fails, both roll back. Replaces the two-step insert pattern in `/api/actions` POST. |
| `022_org_integrations.sql` | `org_integrations` table (one row per org): RunPod endpoint URL, encrypted bearer token, connection status, last checked timestamp. RLS: super_admin only. Adds `model_id` column to `bots` table for per-bot model selection from RunPod endpoint. |
| `023_image_tools.sql` | Extends `org_integrations` with image API columns (endpoint, encrypted token, credits allocated/used). Adds `image_tools_enabled` boolean to `bots` table (true for graphics-creation). Updates `media_items`: adds 'generated' category, 'private' visibility, updates `media_file_or_link` constraint, updates RLS SELECT to allow users to see own private items. Adds `increment_image_credits()` SECURITY DEFINER RPC. |
| `024_energy_consumption.sql` | Adds `image_width` (integer), `image_height` (integer), `energy_wh` (double precision) nullable columns to `media_items`. Partial index on `(group_id) WHERE category='generated' AND energy_wh IS NOT NULL` for efficient aggregation. Energy is pre-computed at generation time using Stanford/AXA 2025 reference data. |
| `025_calendar_sources_group_scope.sql` | Moves `calendar_sources` from org-level to group-level scope. Adds `group_id` (uuid FK, NOT NULL after backfill), index on `group_id`. Drops org-scoped RLS, creates group-scoped RLS using `get_my_group_id()` and `is_admin()`. Keeps `org_id` column for future use. |
| `026_generated_storage_path.sql` | Relaxes `media_file_or_link` constraint so generated images can have `storage_path` (Supabase Storage) in addition to or instead of `url` (external FAL URL). Supports the FAL → Supabase Storage migration. |
| `029_group_billing.sql` | `group_billing` table (one row per group): credit_balance_usd, platform_fee_percentage, cost_per_mp_base, cost_per_mp_extra. UNIQUE(group_id). RLS: super_admin full access via `is_super_admin()` + `get_my_org_id()`, group members read-only via `get_my_group_id()`. |
| `030_group_billing_topups.sql` | `group_billing_topups` table: append-only audit trail for credit top-ups. Records amount_usd, note, added_by_user_id. RLS: super_admin SELECT + INSERT only (no UPDATE/DELETE). |
| `031_image_generation_log.sql` | `image_generation_log` table: per-generation cost tracking with output dimensions, input image count, MP total, cost_usd. Index on (group_id, created_at) for monthly aggregation. RLS: super_admin SELECT + INSERT. |
| `032_debit_image_credit_rpc.sql` | `debit_image_credit()` SECURITY DEFINER RPC: atomic insert into image_generation_log + upsert group_billing (decrement credit_balance_usd). Creates row with negative balance if none exists. Returns updated balance. Callable by any authenticated user. |
| `033_group_branding.sql` | `group_branding` table (one row per group): logo_url, hero_image_url, primary_color, secondary_color, default_cta_url, social_facebook/instagram/twitter/bluesky, font_family, form_embed_html. UNIQUE(group_id). RLS: super_admin full CRUD via `is_super_admin()` + `get_my_org_id()`, all group members read-only via `get_my_group_id()`. |
| `034_group_landing_pages.sql` | `group_landing_pages` table: tracks generated landing pages with headline, type (signup/donate), public_url, status (live/archived), nullable created_by (FK to profiles, ON DELETE SET NULL — nullable for external service generation). RLS: super_admin full CRUD, group members SELECT, authenticated INSERT. Public anon SELECT for live pages (added separately). |
| `035_landing_page_tools_enabled.sql` | Adds `landing_page_tools_enabled` boolean column to `bots` table (default false). Enables native landing page generation via text pattern detection in the chat route. Set to true for `landing-page-creator` bot only. |
| `036_group_branding_font_and_form.sql` | Adds `font_family` (text) and `form_embed_html` (text) columns to `group_branding`. Font is applied via Google Fonts CDN on generated landing pages. Form embed replaces CTA button when set. |
| `037_group_branding_hero_images.sql` | Adds `hero_images` (jsonb, default `[]`) to `group_branding`. Stores up to 5 hero images as `{url, label}` objects for the landing page bot gallery. Existing `hero_image_url` kept as default/fallback. |
| `038_landing_pages_public_rls.sql` | Public anon SELECT policy on `group_landing_pages` for live pages. Allows generated landing page URLs to be viewable without authentication. |
| `039_storage_rls_policies.sql` | Creates `branding` and `landing-pages` storage buckets as public (upsert, safe to re-run). Storage object policies (INSERT for authenticated, SELECT for public) must still be configured in Supabase dashboard. |
| `040_nb_integration.sql` | Adds NB integration columns to `org_integrations`: `nb_enabled` (boolean, default false), `nb_api_token` (encrypted text), `nb_slug` (text), `nb_status` (CHECK connected/error/not_configured), `nb_last_checked_at` (timestamptz). Creates `get_nb_config(p_org_id)` SECURITY DEFINER RPC for non-admin credential access in signups route. |

---

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/chat` | POST | Streams responses from RunPod-hosted model (per-bot model_id + org RunPod credentials), persists conversations + messages to Supabase. Returns 503 `not_configured` if bot has no model or RunPod not configured. |
| `/api/favorites` | GET/POST | Fetch, add, remove user's favorite/starred bots |
| `/api/nationbuilder/signups` | GET | Fetches NB signups (50 limit) using DB-stored encrypted credentials (env var fallback). Returns signups, assignments, status, and `enabled` boolean. Skips entirely if `nb_enabled === false`. Uses `requireAuth()` + `get_nb_config` RPC. |
| `/api/admin/integrations/nationbuilder` | GET/POST | GET: NB config (enabled, slug, hasToken, status — never the token). POST: toggle-only `{ enabled }` or settings save `{ slug, apiToken }` with connection test. Super admin only. Token encrypted with AES-256-GCM. |
| `/api/signups/assign` | POST | Assigns NB signup to team member (RPC + Resend email notification) |
| `/api/notifications` | GET | Unread notifications for current user (max 10) |
| `/api/notifications/read` | POST | Mark notifications as read (by IDs or "all") |
| `/api/events` | GET | Fetches enabled calendar sources for user's org, parses ICS feeds, returns next 30 days of events (max 20) |
| `/api/hours` | GET/POST | GET: list group volunteer hours with totals. POST: log hours for current user |
| `/api/admin/hours` | GET | Team volunteer hours summary: per-member aggregation (total, this month, last logged), KPI totals. Admin only. |
| `/api/admin/hours/[userId]` | GET | Individual member's volunteer hour entries with totals. Validates user belongs to admin's group. Admin only. |
| `/api/admin/org` | GET/PATCH | View/edit organization settings (super_admin) |
| `/api/admin/groups` | GET/PATCH | List/manage groups (super_admin) |
| `/api/admin/members` | GET | List all org members (super_admin) or group members (group_admin) |
| `/api/admin/members/[memberId]` | GET/PATCH/DELETE | View, edit name, remove member |
| `/api/admin/members/[memberId]/role` | POST | Change member role with hierarchy enforcement |
| `/api/admin/members/[memberId]/group` | POST | Reassign member to different group (super_admin) |
| `/api/admin/bots` | GET/POST | List org bots (DB-first + global fallback), create new bot |
| `/api/admin/bots/[botId]` | GET/PATCH/DELETE | View, edit, delete individual bot |
| `/api/admin/calendars` | GET/POST | List calendar sources, add new feed (super_admin) |
| `/api/admin/calendars/[id]` | PATCH/DELETE | Update/remove calendar source (super_admin) |
| `/api/approvals` | GET/POST | List approval requests (filterable), create new request with Resend email to reviewer |
| `/api/approvals/[id]` | GET | Get single approval with full details |
| `/api/approvals/[id]/comments` | GET/POST | Fetch/create approval comments |
| `/api/approvals/[id]/status` | POST | Approve or request changes (sends Resend email) |
| `/api/approvals/[id]/resubmit` | POST | Resubmit after changes requested |
| `/api/approvals/reviewers` | GET | List available reviewers (admins) |
| `/auth/callback` | GET | OAuth/email confirmation callback — signs out after confirmation, redirects to login |
| `/api/fundraising` | GET/PATCH | GET: current month's fundraising data for user's group (LEGACY — targets now in group_goals). PATCH: update amount_raised (admin only, upserts) |
| `/api/goals` | GET/PATCH | GET: fetch group goals for user's group. PATCH: upsert one or more goal fields (group_admin + super_admin only) |
| `/api/reimbursements` | GET/POST | GET: list reimbursement requests for group. POST: create request (RPC + notification to super_admin) |
| `/api/reimbursements/[id]/status` | POST | Approve or request changes on reimbursement (reviewer only) |
| `/api/reimbursements/[id]/resubmit` | POST | Resubmit after changes requested (submitter only) |
| `/api/reimbursements/[id]/attachments` | POST | Upload file attachments (multipart form data) for a reimbursement request. Auth + ownership check + MIME/size validation. |
| `/api/media` | GET/POST | GET: list media items for user's group (category filter, full-text search, pagination). POST: upload file (quota check, MIME validation, 5MB limit, supporters blocked) |
| `/api/media/[id]` | GET/DELETE | GET: single media item with signed URL (1hr TTL). DELETE: soft delete via RPC + storage file removal |
| `/api/media/[id]/download` | GET | Increment download count + return signed URL (or external URL for links) |
| `/api/media/links` | POST | Create link-type media item (url + title required, no file upload) |
| `/api/dashboard/layout` | GET/POST/DELETE | GET: load user layout (user→org→system fallback). POST: save user layout. DELETE: reset user layout |
| `/api/admin/dashboard/layout` | GET/POST/DELETE | GET: org default layout. POST: save org default (super_admin). DELETE: reset to system default (super_admin) |
| `/api/actions` | GET/POST | GET: list active actions for user's group (filters: scope, status, type, pagination). POST: create internal action (admin only, validates bot slug). |
| `/api/actions/[id]` | GET/PATCH/DELETE | GET: single action detail with completions (admin sees all). PATCH: update action (admin only). DELETE: soft archive via status='archived' (preserves history). |
| `/api/actions/[id]/complete` | POST | Mark action complete via `complete_action` RPC. Atomic completion + points ledger. Maps RPC errcodes to HTTP (404/400/403/409). |
| `/api/actions/[id]/self-assign` | POST | Self-assign to action (validates assignment_scope='self_assign', 403 otherwise). |
| `/auth/callback` | GET | OAuth/email confirmation callback — signs out after confirmation, redirects to login |
| `/api/admin/integrations/runpod` | GET/POST | GET: RunPod config (URL, status, lastChecked — never token). POST: save URL + encrypted token, test connection, return status + models. Super admin only. |
| `/api/admin/integrations/runpod/models` | GET | Fetch available models from RunPod endpoint using stored encrypted credentials. Super admin only. |
| `/api/image-tools/upload` | POST | Upload base64 image to Supabase Storage, return signed URL (1hr TTL). No media_items insert — used for chat reference images only. |
| `/api/image-tools/execute` | POST | Execute image tool (generate/edit/fuse/brand), validates bot has image_tools_enabled, checks credits, saves result to media_items |
| `/api/image-tools/credentials-status` | GET | Image API status — super_admin sees credits, other roles see configured boolean only |
| `/api/admin/integrations/image-api` | GET/POST | GET: image API config (never token). POST: save endpoint + encrypted token (super_admin only) |
| `/api/billing/balance` | GET | Credit balance + month spend for authenticated user's group. All roles. Returns credit_balance_usd (can be negative), rates, platform_fee_percentage, month_spend_usd. |
| `/api/admin/billing/topup` | POST | Add credits to group balance (super_admin). Body: { amount_usd, note? }. Inserts audit row + increments balance. Returns updated group_billing row. |
| `/api/admin/billing/topups` | GET | Top-up history for group (super_admin). 20 most recent, enriched with added_by_name. |
| `/api/admin/billing/rates` | PATCH | Update generation rates or platform fee (super_admin). Body: { cost_per_mp_base?, cost_per_mp_extra?, platform_fee_percentage? }. Upserts group_billing. |
| `/auth/reset-callback` | GET | Password reset callback — exchanges PKCE code, redirects to /reset-password |
| `/api/admin/branding` | GET/PATCH | GET: group branding (logo, hero, colors, CTA URL, social links, font, form embed). Returns all-null fields if no row. PATCH: super admin upsert of text fields. |
| `/api/admin/branding/logo` | POST | Super admin. Multipart upload (JPEG/PNG/WebP, 2MB max). Stores in `branding` Storage bucket at `{group_id}/logo.{ext}`. |
| `/api/admin/branding/hero` | POST | Super admin. Same as logo but for hero image at `{group_id}/hero.{ext}`. |
| `/api/admin/landing-pages` | GET | List all landing pages for user's group. Admin only (super_admin + group_admin). Enriched with created_by_name. |
| `/api/admin/landing-pages/[id]` | PATCH | Archive a landing page (super admin only). Body: `{ status: "archived" }`. |
| `/api/landing-pages/[id]/view` | GET | Public — no auth. Proxy route that downloads HTML from Storage and serves with `Content-Type: text/html`. Returns 404/410 for missing/archived pages. |
| `/api/tools/generate-landing-page` | POST | External endpoint for ChangeAgent. Bearer token auth via `CHANGE_AGENT_API_KEY`. Fetches branding, renders HTML, uploads to Storage, inserts DB row. Currently dormant — landing pages generated natively via chat route instead. |

---

## Key Components

| Component | Description |
|---|---|
| `AppShell.tsx` | Main layout: TopBar + NotificationBar + LeftSidebar + content |
| `TopBar.tsx` | Header with dynamic org/group names from DB + Tectonica.AI logo |
| `LeftSidebar.tsx` | Navigation, bot chats list, user info footer |
| `RightSidebar.tsx` | Dashboard sidebar: layout state, data fetching, edit/save/reset flows, modal management. Delegates widget rendering to WidgetGrid. |
| `dashboard/WidgetGrid.tsx` | Widget rendering orchestration: ResponsiveGridLayout, renderWidget switch, visibility filtering, constraint application. Receives data as props from RightSidebar. |
| `NotificationBar.tsx` | Amber bar for unread signup/approval notifications |
| `BotGrid.tsx` | Featured carousel + categorized bot card grid with GSAP |
| `BotCard.tsx` | Individual bot card with star/favorite, hover description |
| `WelcomeHelper.tsx` | Welcome bot chat on dashboard |
| `DashboardShell.tsx` | Dashboard layout container |
| `chat/ChatView.tsx` | Bot chat with streaming, conversation persistence, image tool SSE handling (gallery/image/status events), Studio overlay state, approval + share workflows |
| `chat/ChatHeader.tsx` | Bot name, status, back button, "Open in Studio" button (image bots only) |
| `chat/ChatInput.tsx` | Message input with send button. Image bots: separate image + file attachment buttons. Text files read client-side as context. Mic hidden. |
| `chat/MessageList.tsx` | Message history with image markdown rendering, style gallery grid, image action buttons (Studio/Try again/Request approval/Share to group), creative brief tag stripping, per-image energy estimate display |
| `chat/RecentConversations.tsx` | Sidebar: saved briefs (image bots), creative brief (live REQ tags), past chats (collapsible, 10-limit, deletable) |
| `chat/CreativeBrief.tsx` | Live creative brief from [REQ:] tags + saved briefs section with 4 hardcoded example briefs |
| `chat/StudioOverlay.tsx` | Full-screen iframe overlay for Railway Studio visual editor. Opens with most recent generated image. ESC to close. One-way integration — edits don't save back. |
| `coach/CoachChatView.tsx` | Group Coach Bot with campaign stats sidebar |
| `coach/CampaignStats.tsx` | Campaign goals, strategy notes, upcoming events sidebar |
| `media/MediaGallery.tsx` | Functional media gallery: API-driven list with category filters, full-text search, pagination, grid/list views, upload modal, detail sheet |
| `media/UploadMediaModal.tsx` | Dialog with file upload and link tabs, MIME/size validation |
| `media/MediaDetailSheet.tsx` | Sheet side panel: preview, metadata, energy estimate (generated images), download, delete with confirmation |
| `media/EnergyEstimate.tsx` | Collapsible per-image energy consumption display with human-readable comparisons and disclaimer |
| `media/StorageUsageBar.tsx` | Progress bar showing group storage usage vs quota |
| `signups/NbSignupModal.tsx` | NB signup detail modal with contact/call/assign actions |
| `signups/SignupsView.tsx` | Full signups table page: search, status badges, assignment info, click-to-modal |
| `actions/ActionsView.tsx` | Full actions page: scope/type/status filters, action card grid, create/edit/detail sheets |
| `actions/ActionCard.tsx` | Action card: type badge, source badge, points, deadline, scope, admin controls |
| `actions/CreateEditActionSheet.tsx` | Sheet form: title, description, type, CTA, URL, points, scope, bot suggestion, dates, visibility |
| `actions/ActionDetailSheet.tsx` | Sheet detail: CTA button (opens new tab if external), completion gating, notes, self-assign, admin completion list |
| `members/MemberDirectory.tsx` | Two-tab member page: Directory (list + search + role filters) and Org Chart (D3 radial tree). Shadcn Tabs with `variant="line"`. |
| `members/OrgChartView.tsx` | D3 radial/snowflake org chart. Role-based hierarchy, pill labels, avatar rendering, zoom/pan, click → MemberDetailModal. |
| `members/MemberDetailModal.tsx` | Member detail popup (used by both list click navigation and org chart node click) |
| `members/MemberProfile.tsx` | Member profile card |
| `admin/AdminView.tsx` | Admin panel with sidebar navigation (3 groups: Manage, Tools, Settings). Controlled tab state with `?tab=` deep linking. Role guard (9 sections for super_admin, 5 for group_admin). |
| `admin/HoursTab.tsx` | Team volunteer hours: KPI summary cards, member table sorted by activity, detail sheet per member. Fetches from `/api/admin/hours`. |
| `admin/OrgTab.tsx` | Organization settings (name, details) |
| `admin/GoalsTab.tsx` | Admin-editable group goals: fundraising (money_goal, money_budget, money_raised_offline) and recruitment (members_goal, supporters_goal). Inline edit pattern matching OrgTab. |
| `admin/PeopleTab.tsx` | Member management with role/group changes, inline name editing |
| `admin/BotsTab.tsx` | Bot CRUD management |
| `admin/BotEditor.tsx` | Bot form (slug, name, icon, category, description, system prompt) |
| `admin/IntegrationsTab.tsx` | Calendar source management + integration status |
| `admin/BillingTab.tsx` | Credit balance + month spend, add credits form, top-up history, generation rates inline edit, platform fee inline edit. Super admin only. |
| `admin/BrandingTab.tsx` | Group branding management: logo upload, hero image upload, color pickers, default CTA URL, social media links, font selection (Google Fonts), form embed HTML. Super admin can edit, group admin read-only. |
| `admin/LandingPagesTab.tsx` | Landing pages list: headline, type badge, status badge, created by, date, View button (external link), Archive button (super admin). Both super admin and group admin can view. |
| `admin/RoleChangeModal.tsx` | Modal to change member role |
| `admin/GroupReassignModal.tsx` | Modal to reassign member to different group |
| `approvals/ApprovalsView.tsx` | Approval requests list |
| `approvals/ApprovalCard.tsx` | Individual approval card |
| `approvals/ApprovalDetailView.tsx` | Full approval detail with comments |
| `approvals/CommentThread.tsx` | Comment thread display + input |
| `approvals/CreateApprovalModal.tsx` | Modal to create approval request |
| `approvals/StatusBadge.tsx` | Status badge (pending/approved/changes_requested) |
| `hours/LogHoursModal.tsx` | Modal to log volunteer hours |
| `hours/HoursDetailOverlay.tsx` | Detailed volunteer hours view with entries grouped by date |
| `settings/SettingsView.tsx` | Main settings container |
| `settings/ProfileTab.tsx` | Profile edit (name, bio, avatar upload) |
| `settings/AccountTab.tsx` | Account settings |
| `settings/ActivityTab.tsx` | Unified chronological activity log (hours, approvals, signups, reimbursements) |
| `ReimbursementModal.tsx` | Reimbursement request form: amount, description, file upload (jpg/png/pdf) |
| `GroupProfile.tsx` | Group profile page: name, description, member count, quick links |
| `GroupConversationOverlay.tsx` | Real-time group messaging overlay |
| `LeadersChat.tsx` | Slide-in leaders & organizers chat panel |
| `dashboard/*.tsx` | 11 extracted widget components (SignupsWidget, RecruitWidget, ConversationsWidget, ActionsWidget, FundraisingWidget, RecruitmentGoalWidget, RequestApprovalWidget, ConnectedSystemsWidget, HoursWidget, EventsWidget, DirectoryWidget) + EventDetailSheet |

---

## Key Lib Files

| File | Description |
|---|---|
| `lib/types.ts` | Type definitions: UserRole, Message, Conversation, Member, GroupMessage, NbSignup, SignupAssignment, AppNotification, ApprovalRequest, ApprovalComment, FundraisingGoal (LEGACY targets), GroupGoals, ReimbursementRequest, Action, ActionAssignment, ActionCompletion, MemberPointsLedger, etc. |
| `lib/bots.ts` | Hardcoded bot definitions: 24 bots with metadata (id, name, icon, category, description), categoryMeta colors, defaultFeaturedBotIds |
| `lib/bots-prompts.ts` | Bot system prompts mapped by bot ID, falls back to generic prompt |
| `lib/bot-resolver.ts` | getBots() (DB-first, fallback to hardcoded), getSystemPrompt() (DB-first, fallback to bots-prompts.ts) |
| `lib/encryption.ts` | AES-256-GCM encrypt/decrypt utility for RunPod bearer token. Uses `ENCRYPTION_KEY` env var (32-byte hex). Node.js `crypto` module, no dependencies. |
| `lib/image-tools.ts` | **Only file that calls the Railway image API.** Generate, edit, fuse, brand images via Black Forest Labs (BFL) endpoints. Credential fetch + decryption, credit tracking, platform size lookup, dimension capture. Also contains `downloadAndStoreImage()` (external URL → Supabase Storage) and `uploadBase64ToStorage()` (base64 → Supabase Storage). Railway endpoints use `/api/external/bfl/` path prefix. |
| `lib/energy.ts` | Energy consumption estimation for AI-generated images. Pure calculation library based on Stanford/AXA 2025 research. Named constants, linear interpolation formula, 3 human-readable comparison formatters (Google searches, phone charge, LED bulb), disclaimer text. |
| `lib/image-tool-definitions.ts` | OpenAI-compatible tool definitions array for ChangeAgent. Passed via `tools` parameter — never injected into system prompt. 4 tools: generate_image, edit_image, fuse_images, apply_branding. |
| `lib/style-gallery-data.ts` | Style gallery data for Graphics Creation bot. Main gallery (10 styles) + 10 substyle galleries with fal.ai CDN image URLs. Used by chat route to respond to model's `style_galery` tool calls. |
| `lib/ical-parser.ts` | Lightweight ICS parser (no native deps) — handles DTSTART/DTEND with TZID, line unfolding, escaped chars |
| `lib/avatar.ts` | Avatar utilities (getAvatarColor, getInitials, getRoleBadgeStyle, getRoleLabel) + `AVATAR_HEX_COLORS` export for SVG rendering. Hex values must stay in sync with `--avatar-color-*` CSS vars in globals.css. |
| `lib/org-chart-utils.ts` | `buildOrgChartData()` — **only file that knows hierarchy logic.** Role-based (Option A). When `recruited_by` FK is added, only this file changes. |
| `lib/signup-utils.ts` | NationBuilder signup utilities (fetch, parse, enrich). `fetchRecentSignups()` accepts `NbCredentials` param (API token + slug) — credentials resolved by caller (DB first, env var fallback). Exports `NbCredentials` interface and `NbConnectionStatus` type. |
| `lib/media-storage.ts` | **Only file that imports Supabase Storage for media.** Upload, signed URLs (1hr TTL), delete, quota check/increment. Swap storage providers by changing this file only. Includes bucket setup instructions in header comment. |
| `lib/action-adapters/index.ts` | **Action source adapter scaffold.** Defines `ActionSourceAdapter` interface, `CanonicalAction` type, adapter registry. Future external sources (NB, Action Network, ActBlue, Sosha) each get a file here. No concrete adapters yet. |
| `lib/UserProfileContext.tsx` | React Context for user profile data (role, orgName, groupName, name, avatar) — consumed by TopBar, LeftSidebar, RightSidebar, etc. |
| `lib/constants/roles.ts` | Role constants (`ROLES`), validation array (`VALID_ROLES`), and helper functions (`isAdminRole`, `isSuperAdmin`). Single source of truth for role strings. |
| `lib/api-utils.ts` | Shared API route utilities: `requireAuth()` (auth + profile lookup), `fetchProfileMap()` (batch profile enrichment). New routes should use these. |
| `lib/billing-utils.ts` | **Single source of truth for image generation cost calculation.** `calculateImageCost()` (MP-based cost with dimension fallback to 1024), `countInputImages()` (derives input count from tool args), `formatCredits()` (USD display). No other file should reimplement cost logic. |
| `lib/dashboard-widgets.ts` | Widget IDs, role-based visibility permissions, labels, size constraints, system default layout, and layout utility functions (getVisibleWidgets, filterLayoutToRole, mergeLayoutWithDefaults) |
| `lib/chat-utils.ts` | Chat route utilities: `preprocessMessages()` (base64 image upload, URL extraction) and `persistConversation()` (save messages to Supabase). Extracted from `app/api/chat/route.ts`. |
| `lib/stream-utils.ts` | OpenAI-compatible SSE streaming: `streamModelResponse()` (stream to client, accumulate tool call deltas, strip reasoning field) and `collectModelResponse()` (collect without streaming, used for gallery follow-ups). |
| `lib/landing-page-utils.ts` | Landing page HTML renderer. `LandingPageBrief` interface + `renderLandingPage()` function. Self-contained HTML with Google Fonts (when font selected), conditional logo/hero/urgency/social, form embed replaces CTA button when configured. |
| `lib/supabase/server.ts` | Server-side Supabase client factory using cookies |
| `lib/supabase/client.ts` | Client-side Supabase client factory |
| `lib/supabase/service.ts` | Service role Supabase client (bypasses RLS). Uses `SUPABASE_SERVICE_ROLE_KEY`. Only for external API endpoints with no user session (e.g., `/api/tools/generate-landing-page`). Currently dormant — landing pages use the regular server client via the chat route. |

---

## What's Working (Functional)

- Auth (email/password signup, login, email confirmation, forgot/reset password, session management)
- Role-based profiles (super_admin, group_admin, member, supporter) with group assignment
- Auto-assignment of new users to default group on signup
- Dashboard with 24 bot cards in 4 categories, star/favorite system
- Welcome helper bot chat on dashboard
- Bot chat with RunPod-hosted model streaming responses + conversation persistence
- Group Coach Bot page with campaign stats sidebar
- **Media Library** — functional file upload (5MB limit, MIME validation), link bookmarks, category filters, full-text search, grid/list views, signed URL downloads (1hr TTL), soft delete, download counter, group storage quota (250MB) with progress bar. Storage abstracted behind `lib/media-storage.ts` for provider portability. Soft delete and storage counter use SECURITY DEFINER RPCs for atomicity.
- **Member directory** with two tabs: Directory (list view, search, role filters) and Org Chart (D3 radial/snowflake visualization with role hierarchy, pill labels, avatar rendering, zoom/pan, click-to-detail modal). RPC-based group member fetching + member detail pages.
- Profile settings (name, bio, avatar upload)
- Real-time group messaging (Supabase Realtime)
- NationBuilder integration (read-only signup ingestion with NB icon badges)
- Interactive NB signup assignments (click → modal → contact/call/assign)
- Email notifications via Resend (signups, approvals, status changes)
- In-app notification bar for signup assignments and approvals
- **Super Admin Panel** — sidebar navigation (3 groups: Manage, Tools, Settings), org settings, people management (roles, groups, inline name editing), team hours overview, DB-driven bot management, goals management, integrations, billing, branding, landing pages
- **Approval workflow** — submit, review, approve/request changes, resubmit, comment threads
- **Calendar integration** — group-scoped iCal/ICS feeds (Google Calendar, Outlook, Apple Calendar, Mobilize, any iCal source), managed in admin Integrations tab. Migration 025 moved from org-level to group-level scope.
- **Upcoming Events widget** — pulls from connected calendar feeds, shows next 30 days. "Manage Calendars" button (super_admin only). Click event opens EventDetailSheet with title, date/time, location, source, description.
- **Volunteer hours tracking** — log hours, view detail overlay with entries by date, dashboard widget with real totals. Widget shows unique member count, progress bar when hours_goal > 0, spark line chart. Detail overlay role-gated: admins see all member entries, non-admins see only their own.
- **Dynamic top bar** — org name and group name fetched from DB, update when admin changes them
- **Connected Systems widget** — only shows enabled/connected integrations. NB row visible only when `nb_enabled === true` (with real status). Calendar reflects live feed state. Action Network/Mobilize hidden until they get enable/disable toggles. AI Models and Image API rows visible to super_admin only. "Manage Integrations" button (super_admin only) links to admin Integrations tab.
- **Fundraising goals** — targets (money_goal, money_budget) stored in `group_goals` table, admin-editable via Goals tab in Admin Panel. Monthly amount_raised tracked in `fundraising_goals`. Offline fundraising offset (`money_raised_offline`) added to displayed totals. FundraisingWidget reads targets from `group_goals`, no longer has inline edit.
- **Recruitment goals** — members_goal and supporters_goal in `group_goals` table, admin-editable via Goals tab. RecruitmentGoalWidget uses dynamic DB values instead of hardcoded targets. Handles goal=0 gracefully (shows raw count, hides percentage).
- **Admin Goals tab** — visible to both super_admin and group_admin. Three sections: Fundraising Goals (monthly target, print budget, offline offset), Recruitment Goals (member/supporter targets), and Volunteer Hours Goals (group hours target). Inline edit pattern matching OrgTab.
- **Reimbursement requests** — submit with amount/description/attachment, approval workflow (pending→approved/changes_requested→resubmit), notifications to super_admin
- **Activity log** — unified chronological timeline in Settings > Activity tab showing hours, approvals, signups, reimbursements with type tags
- **Notification bar** — handles multiple notification types simultaneously (signups, approvals, reimbursements), uses real signup_assignments count, clickable signup count opens lightbox. Session-based dismiss via sessionStorage (scoped to groupId, clears when browser tab closes).
- **Group profile page** — `/group` route showing group name, description, member count, quick links. Group pill in top bar is clickable link.
- **Group descriptions** — admin can edit in Organization tab, visible on group profile page
- **Sidebar role display** — shows dynamic user role instead of hardcoded "Settings"
- **Default signup role** — new users default to 'supporter' (lowest privilege)
- **Configurable dashboard grid** — React Grid Layout (3-column snap grid with vertical compaction), edit mode toggle, role-aware save (super admin gets "Save for me" vs "Save as org default" dialog), reset to default for non-super-admin, per-widget size constraints from WIDGET_CONSTRAINTS, role-based widget visibility, sonner toasts for feedback, CSS fade-in animation
- **Actions system** — full CRUD for internal actions (petition, donation, event_rsvp, letter, phone_bank, canvass, social_share, custom). Admin creates actions with points, deadlines, assignment scope (all/targeted/self_assign), optional bot suggestions, visibility control. Members complete actions via detail sheet — external actions must be clicked before completion unlocks. Atomic completion + points ledger via `complete_action` SECURITY DEFINER RPC with group boundary validation. Source adapter scaffold in `lib/action-adapters/` ready for NB/Action Network/ActBlue/Sosha ingestion. Actions widget on dashboard shows top 3 with click-to-detail. Full page at `/actions` with scope/type/status filters.
- **Signups page** — `/signups` full table view of NationBuilder signups with search, status badges, assignment info. Entry point: "See all (##)" button in SignupsWidget. SignupsWidget now shows max 2 items with count-based CTA button (#c66a0c).
- **Integrations tab — Action Sources** — scaffold section in admin Integrations showing NationBuilder Actions, Action Network, ActBlue, Sosha with "Not Connected" status and disabled Configure buttons.
- GSAP entrance animations throughout (except right sidebar — uses CSS fade-in)
- **Graphics Creation bot — image tools**: Full image generation via Railway/Black Forest Labs (BFL) with OpenAI tool calling. Style gallery (10 styles × substyles, clickable grid with preloading). Image-to-image with uploaded reference photos. Inline image rendering with action buttons (Studio, Try again, Request approval, Share to group). Studio iframe overlay. Creative brief sidebar (live [REQ:] tag parsing + 4 saved example briefs). Image upload shows thumbnail preview. Chat sidebar: collapsible past chats (10-limit, deletable), saved briefs section.
- **Media Library thumbnails**: Image and generated items show actual image thumbnails. Select mode with bulk delete.
- **Energy consumption indicator** — estimated energy cost per AI-generated image based on Stanford/AXA "Energy Scaling Laws for Diffusion Models" (2025). Captures image dimensions from Railway API response (with fallback to request params). Displays collapsible "Energy estimate" below each generated image in bot chat and Media Library detail view. Shows Wh value, toggleable human-readable comparisons (Google searches, smartphone charging, LED bulb time), and research disclaimer. Pre-computed `energy_wh` stored in `media_items` for efficient aggregation. Migration 024.
- **Notification bar follow-up guidance** — signup notification now reads "Follow up with them or reassign to another member in the next 48 hours" instead of just listing the count.
- **Calendar sources group-scoped** — Migration 025 moved calendar_sources from org_id to group_id. All calendar API routes use `requireAuth()` + `group_id` filtering. `CalendarSource` type in `lib/types.ts`.
- **Event detail sheet** — Clicking events in Upcoming Events widget opens EventDetailSheet (Shadcn Sheet) showing title, date/time, location, source, description. Fields hidden gracefully when empty.
- **Generated images stored in Supabase Storage** — all generated images now downloaded from FAL and stored in Supabase Storage (`media` bucket). Chat reference uploads also go to Supabase Storage. Railway storage dependency eliminated. Migration script (`scripts/migrate-generated-images.ts`) moved 10 existing FAL images. FAL URLs kept as fallback in `url` column. Migration 026 relaxed `media_file_or_link` constraint.
- **Image regeneration (Try Again)** — "Try again" button now re-executes the same image tool call directly via `/api/image-tools/execute` instead of sending a chat message. Chat route includes `toolName` and `toolArgs` in SSE image events. ChatView stores these per image URL for instant retry.
- **Text file attachments in chat** — ChatInput accepts text files (.txt, .md, .csv, .json, .xml, .html, .yml, .py, .js, .ts, etc.) alongside images. Text content read client-side and sent as message context. Image bots show separate image (🖼) and file (📎) buttons. Mic button hidden until voice input is implemented.
- **Past Chats real count** — sidebar shows actual total conversation count from DB (via `select count: exact`) instead of capping at the 20-item fetch limit.
- **Dashboard layout save reliability** — unmount auto-save uses `keepalive: true` so requests survive page navigation/logout. Save buttons await completion before exiting edit mode.
- **Group Branding** — admin tab for managing group brand assets: logo upload, hero image upload, primary/secondary colors with color pickers, default CTA URL, social media links (Facebook, Instagram, Twitter/X, Bluesky), font selection (8 Google Fonts + system default), form embed HTML (replaces CTA button on landing pages). Super admin can edit all fields, group admin sees read-only. Stored in `group_branding` table (one row per group). Storage bucket `branding` (public) for logo/hero images.
- **Landing Page Creator bot** — native tool in the chat route using text pattern detection (not OpenAI function calling). The model outputs `GENERATE_LANDING_PAGE` followed by a JSON block, which the chat route detects, renders as HTML via `renderLandingPage()`, uploads to Supabase Storage, and returns via SSE event. The generated page uses the group's branding (colors, logo, hero, social links, font, form embed) automatically. Pages served via proxy route (`/api/landing-pages/[id]/view`) since Supabase Storage forces `text/plain` on HTML files. Admin Landing Pages tab shows all generated pages with archive capability.
- Deployed on Railway with auto-deploy from `v2` branch

## What Still Needs Work (Prioritized)

### Priority — Next Features
- Media Library: per-file visibility UI, thumbnail generation, virus scanning (hook placeholder exists in media-storage.ts)
- Group Coach Bot with real campaign data (currently mock stats)
- Graphics Creation bot: visual editor integration, style gallery, image upload — DONE (see below)
- Leaders & Organizers real-time chat (UI exists, needs real-time backend)
- Group Admin features (invitations, recruiter IDs, /join flow)

### Priority — Actions System (built, needs extension)
- External source adapters: NationBuilder actions, Action Network, ActBlue, Sosha (scaffold in `lib/action-adapters/`, no implementations yet)
- Targeted assignment member picker (UI scaffold exists in CreateEditActionSheet, needs wiring)
- API-verified completion method (enum value exists in schema, unused)
- Leaderboards / points display (ledger exists, needs UI)
- Points total materialized view or denormalized column (noted in migration)

### Priority — Integrations
- Action Network API connection (action source adapter + signup ingestion)
- Mobilize API connection
- Image generation for Graphics Creation bot
- Custom SMTP for Supabase Auth — Resend SMTP is configured in Supabase but `tectonica.co` domain is unverified in Resend. Partner needs to add DNS records in GoDaddy.

### Priority — Platform
- Multi-tenancy (multiple orgs/groups — schema supports it, UI is single-group)
- Configurable bot system prompts per org (admin can already edit via Bots tab)
- Mobile responsive layout (desktop-first, mobile out of scope for now)

## Known Issues / Next Session

- **Branch strategy**: `v2` branch = redesigned app, `main` = original. Local
  checkout should always be on `v2`. Push to `v2` only.
- **Middleware active**: `src/middleware.ts` handles session refresh on every navigation
  and redirects unauthenticated users to `/login`. PKCE code safety net catches auth
  codes landing on wrong routes. Authenticated users are redirected away from `/login`
  and `/forgot-password`. The old `src/proxy.ts` was deleted (it was never wired up).
- Client components that call GET routes (RightSidebar, NotificationBar)
  receive 401s when unauthenticated. Middleware now handles redirects,
  but verify error handling if modifying these components.
- **Resend domain verification BLOCKER** — `tectonica.co` is "Not Started" in Resend.
  Partner must add DNS records in GoDaddy. Blocks: signup confirmation emails,
  password reset emails, and all transactional emails to non-owner addresses.
  Supabase SMTP is configured correctly, just needs the verified domain.
- LeadersChat contacts/messages and CampaignStats goals/notes/events are
  now empty arrays — these components need real data sources (DB or API)
  before they are functional again.
- Reimbursement email notifications are coded but won't send until Resend
  domain is verified. In-app notifications work.
- QA tested and passed: US-03 (Login), US-04 (Logout), US-06 (Edit Profile),
  US-07 (Member Permissions), US-08 (Group Admin), US-09 (Super Admin),
  US-10 (Role Change), US-11 (Supporter Visibility). Remaining stories
  US-12 through US-30 still need testing.
- Test accounts: mar@tectonica.co (super_admin), ned@tectonica.co (group_admin),
  production@tectonica.co (group_admin), mar.isabel.spada@gmail.com (member),
  tectonica-ai-test1@maildrop.cc (supporter, manually created in Supabase).
- Database bot records still store old Material Icons
  strings in the icon field. `getBots()` in `bot-resolver.ts`
  now merges DB names/descriptions with hardcoded Streamline icons
  as fallback (DB icon used only if it starts with "bot-").
  Admin-edited bot names propagate to all users via server fetch
  in `page.tsx` → `DashboardShell` → `BotGrid`.
- `--accent-purple` is still neutral `#18181B` — needs brand color when decided.
- `SparkAreaChart` still uses Tremor `"emerald"` default — needs custom color pass.
- Container query button breakpoint at `350px` may need tuning if grid column widths change.
- Widget typography uses em-based sizing for responsiveness. All values in `--widget-*` CSS variables.
- Bot card category colors applied: advisors `#F2F0FC`, create `#FBE9D8`, tools `#FFDADD`, analyze `#D7F5E6`. Helper pill uses per-category badge color.
- Sidebar uses `#F2F0FC` bg with purple nav icons/text via `var(--sidebar-icon-color)` / `var(--sidebar-icon-color-muted)`. "Leaders & Organizers" renamed to "Leaders Chat".
- TopBar: org name 20px semibold, group pill with `var(--topbar-pill-bg)` bg, bell icon next to group pill, all icons via `var(--widget-chart-members)`. TopBar uses UserProfileContext for org/group names (no direct Supabase queries).
- **Media Library storage abstraction**: All Supabase Storage calls go through `lib/media-storage.ts` — never import storage elsewhere. Supabase Storage bucket "media" must be created manually (instructions in file header). Storage RLS policies are separate from table RLS.
- **Media Library soft delete pattern**: Uses `soft_delete_media_item()` SECURITY DEFINER RPC because PostgreSQL evaluates ALL policies (including SELECT's `deleted_at is null`) against the new row state during UPDATE. Same pattern applies to any future soft-delete on RLS-protected tables.
- **Media Library storage counter**: `increment_storage_used()` SECURITY DEFINER RPC for atomic increments. Decrement is handled inside `soft_delete_media_item()`. Storage usage bar reads from `groups.storage_used_bytes` server-side in `media/page.tsx`.
- **Group goals first-run**: If no `group_goals` row exists for a group, widgets show zeros/raw counts. Admin must visit Goals tab and save once to create the row via upsert.
- **LEGACY fundraising_goals columns**: `fundraising_goals.fundraising_goal` and `fundraising_goals.print_budget` are superseded by `group_goals.money_goal` and `group_goals.money_budget`. Not dropped — just no longer the display source. LEGACY comments mark all read sites. The `/api/fundraising` route still tracks `amount_raised` per month.
- **Page titles**: Members and Group Media pages now have icon + h1 page titles matching Admin Panel pattern (`Icon` size={28} + `text-2xl font-bold`).
- **Actions system error code contract**: `complete_action` RPC uses custom errcodes P0002–P0005 mapped to HTTP statuses in `/api/actions/[id]/complete/route.ts`. Both files have matching documentation blocks. If error messages change in one, they must change in the other.
- **Actions adapter scaffold**: `src/lib/action-adapters/index.ts` defines the interface but has zero implementations. External source ingestion (NB, Action Network, ActBlue, Sosha) is deferred to future sessions. Integrations tab shows static "Not Connected" entries for these.
- **Actions — no left sidebar nav**: The Actions page (`/actions`) is only reachable via the "All Actions" button in the Group Actions dashboard widget. This is intentional per spec.
- **Signups API limit**: Changed from 3 to 50 to support the full signups page. Widget slices to 2 internally.
- **Sheet default width**: `sheet.tsx` base component updated to `data-[side=right]:sm:max-w-3xl` (768px) from the Shadcn default of `sm:max-w-sm`. All right-side sheets inherit this.
- **Inner page layout standard**: All pages must follow: root `flex-1 flex flex-col overflow-hidden bg-content-bg`, title in `px-6 pt-5 pb-0`, toolbar in `px-6 py-5 space-y-4`, content in `flex-1 overflow-y-auto px-6 pb-6`. Use design system tokens (`text-foreground`, `bg-card`, `border-border`) not hardcoded colors.
- **Base UI hydration id mismatch** — pre-existing warning in browser console (`base-ui-_R_...` id differs between server and client render). Affects Input components in LeftSidebar and MediaGallery. Cosmetic only — page renders correctly. Flag for investigation in a future session.
- **ReimbursementModal** — no longer accesses Supabase client directly. Uses `/api/approvals/reviewers` for reviewer lookup, `/api/reimbursements` for creation, and `/api/reimbursements/[id]/attachments` for file uploads. All storage operations now server-side.
- **Migration 021 applied** — `create_action_with_assignments` RPC is live. The actions POST endpoint uses this for atomic action + assignment creation.
- **Migration 022 applied** — `org_integrations` table for RunPod credentials + `bots.model_id` column.
- **AI model integration** — OpenAI SDK removed entirely. Chat route uses OpenAI-compatible API (via Open WebUI proxy to RunPod) with org-level credentials. Bearer token encrypted with AES-256-GCM via `lib/encryption.ts`. Token never returned to client. `ENCRYPTION_KEY` env var required in Railway.
- **Open WebUI as proxy** — The app connects to Open WebUI's API (`https://tectonica.thechange.ai/api`), not directly to RunPod. Open WebUI proxies to RunPod pods. Bearer token is a JWT from Open WebUI user account settings. Endpoint URL must end with `/api` (not `/v1` — our code appends `/v1/...`).
- **Unconfigured bots** — Bots without a `model_id` return 503 `not_configured`. ChatView hides input and shows "This bot is not yet configured" message. No fallback.
- **Connected Systems widget — AI Models** — Row added at top using Streamline `server-star-1` icon. Shows "Connected" / "Error" / "Not connected" based on `runpod_status` from `org_integrations`. Non-admin users see "Not connected" (403 from API handled gracefully).
- **RightSidebar decomposition** — split into `RightSidebar.tsx` (529 lines: state, data fetching, layout management, modals) and `dashboard/WidgetGrid.tsx` (286 lines: grid rendering). All behavior preserved.
- **requireAuth() migration complete** — All API routes now use `requireAuth()` except 1 deferred route: `chat/route.ts` (auth tightly coupled to bot resolution + credential decryption, high blast radius). `nationbuilder/signups/route.ts` was converted to `requireAuth()` in the NB integration toggle session. The custom `getSuperAdminProfile()` and `getAdminProfile()` helpers that duplicated requireAuth logic have been removed — they no longer exist anywhere in the codebase.
- **WelcomeHelper exhaustive-deps** — `src/components/WelcomeHelper.tsx:161` has eslint-disable for `react-hooks/exhaustive-deps`. Should be audited for stale closure bugs in a future session.
- **⚠️ Image API token rotation required** — Token `sk-j6gKait8TE8ZkV3LrNPPYDHEAvM8zqVN` was exposed during testing. Must be rotated in Railway and the new token saved in org_integrations before production or demos. See `lib/image-tools.ts` header comment.
- **Studio overlay one-way** — Members can edit images in the Railway Studio but results are not automatically saved back to the chat or Media Library. Requires a backend change on the Railway Studio side to support arbitrary callback URLs. When implemented, wire to a new POST `/api/image-tools/studio-callback` endpoint.
- **Studio overlay blocked on localhost** — The Railway Studio iframe shows "Access denied — This Studio can only be accessed from an approved host" when running locally. This is an origin restriction on the Railway Studio side. Works when deployed to Railway. To fix for local dev, the Railway Studio app would need `localhost:3000` added to its allowed origins.
- **Image tools DB-driven** — `bots.image_tools_enabled` boolean controls which bots get image tools. Currently only `graphics-creation` is enabled. To add image tools to another bot, set `image_tools_enabled = true` in the bots table.
- **Image credits manual** — `image_api_credits_allocated` is set manually by the Tectonica team in the database. No self-service credit top-up UI.
- **Private generated images** — visibility='private' items are only visible to their creator (RLS-enforced). Not visible to admins. Not counted in group storage quota. Lock icon shown in Media Library grid.
- **Migration 024 required** — Adds `image_width`, `image_height`, `energy_wh` columns to `media_items`. Must be run in Supabase SQL Editor for energy estimates to work. Without it, columns don't exist and inserts silently omit energy data.
- **Energy estimates — existing images** — Generated images created before migration 024 won't have energy data (columns are nullable). Energy estimate only appears for newly generated images.
- **Energy calculation formula** — Linear interpolation between 512x512 (0.051 Wh) and 1024x1024 (3.58 Wh) by pixel count. Constants stored in `src/lib/energy.ts` as named values. Update there if better research data becomes available.
- **Both chat route and execute route store energy** — `/api/chat/route.ts` and `/api/image-tools/execute/route.ts` are two separate code paths that both call `executeImageTool()` and save to `media_items`. Both now capture dimensions + energy. If the save logic changes, update both.
- **Bot model_id select bug fixed** — GET `/api/admin/bots` was missing `model_id` in its Supabase select. Bot Editor always showed "No model selected" even when a model was saved. Fixed — now includes `model_id` in both GET (list) and POST (create).
- **All non-graphics bots set to ChangeAgent** — Done via direct SQL in Supabase: `UPDATE bots SET model_id = 'ChangeAgent' WHERE slug != 'graphics-creation'`.
- **Image uploads not saved to Media Library** — User-uploaded reference images in chat (`/api/image-tools/upload` and chat route `preprocessMessages`) are no longer saved to `media_items`. Only AI-generated outputs (from `/api/image-tools/execute` and chat route tool execution) are saved. This prevents cluttering the Media Library with reference photos.
- **Volunteer hours goal** — `hours_goal` integer column added to `group_goals` (via manual ALTER TABLE, no migration file). Admin-editable in Goals tab. Hours Volunteered widget shows progress bar when goal > 0, hidden when goal = 0. Progress bar uses `--widget-chart-hours` (#308C4F) with 20% opacity track.
- **UserProfileContext includes groupId** — `groupId` now available in UserProfileContext, populated from `layout.tsx`. Used by NotificationBar for session-scoped dismiss. Other components can use it if needed.
- **Hours detail overlay role-gated** — Non-admin users only see their own hour entries in the detail overlay. Admins (super_admin + group_admin) see all group member entries. Group totals visible to everyone.
- **Directory widget "View All Members" button** — Links to `/members`, visible to all roles.
- **temp-repo/** — Deleted in code health session (2026-04-07). No longer present.
- **Calendar sources group-scoped (migration 025)** — `calendar_sources` now has `group_id` column. `org_id` column kept but no longer used as primary scope. All calendar API routes filter by `group_id`.
- **Calendar RLS vs API role mismatch (intentional)** — RLS policies use `is_admin()` (super_admin + group_admin). API routes use `isSuperAdmin()` only. This is by design for future flexibility — documented in Conventions section. Do not "fix" by aligning them.
- **Connected Systems widget "Google Calendar" label** — Hardcodes "Google Calendar" even though multiple calendar sources are supported. Should be renamed to "Calendar". One-line fix deferred to next session.
- **EventDetailSheet has no "Open Event" button** — iCal parser (`lib/ical-parser.ts`) does not extract event URLs. If URL support is needed, the parser would need to handle the `URL` VEVENT property.
- **`uploadImageToRailway()` dead code removed** — Deleted in code health session (2026-04-07) along with `RAILWAY_ENDPOINTS.upload`.
- **`preprocessMessages` URL regex tightened** — Scoped to Supabase Storage signed URLs and FAL CDN URLs only (2026-04-07 code health session). Previously matched any image URL which risked injecting conversationally-mentioned URLs as image references for tool calls.
- **`tsx` and `dotenv` dev dependencies removed** — Removed in code health session (2026-04-07). Only `scripts/migrate-generated-images.ts` used them. Re-add if running the migration script again.
- **FAL URLs kept as fallback** — Migrated generated images have both `url` (FAL) and `storage_path` (Supabase) set. A future cleanup pass can null out `url` on rows with confirmed `storage_path`.
- **Generated images not counted in group storage quota** — `incrementStorageUsed()` is not called during generation (private images by design). The migration backfilled `storage_used_bytes` manually. Future: decide if private generated images should count against quota.
- **Chat file attachments text-only** — PDF and Word (.docx) files require server-side text extraction and are not currently supported. Only plain text formats accepted.
- **Dashboard layout auto-save uses keepalive** — `keepalive: true` on unmount fetch. Has a 64KB body size limit per browser spec. Dashboard layouts are well under this. If layouts grow very large, consider switching to `navigator.sendBeacon`.
- **Past Chats shows max 20 items** — The fetch limit is 20 (`.limit(20)` in page.tsx). The count is real via `count: "exact"`. "Show all" text shows real count but can only display the 20 fetched items. Future: paginated loading.
- **`hours_goal` column has no migration file** — Was added via manual `ALTER TABLE group_goals ADD COLUMN hours_goal integer NOT NULL DEFAULT 0`. A new developer running migrations 001–027 would not get this column. It is documented in README manual setup section but easy to miss. Create migration 028 to formally add this column in a future session.
- **`chat/route.ts` refactor complete** — Streaming utilities extracted to `lib/stream-utils.ts`, message preprocessing and conversation persistence to `lib/chat-utils.ts`, image tool execution to `executeToolAndContinue()` within the route. Main handler reads as a clean sequence of named steps.
- **Migration 027 (atomic credit check)** — `check_and_increment_image_credits` SECURITY DEFINER RPC. Must be run in Supabase SQL Editor. Replaces the separate check-then-increment pattern in image generation routes.
- **Shared image save utility** — `lib/image-save-utils.ts` consolidates the download-store-dimension-energy-save pipeline used by both `chat/route.ts` and `image-tools/execute/route.ts`. Any changes to the image save flow should be made in this single file.
- **Bot queries now org-scoped** — `getBots()` and `getSystemPrompt()` in `lib/bot-resolver.ts` accept optional `orgId` parameter. Chat route, dashboard page, and admin bot CRUD all pass org_id for cross-org isolation. Bot list uses `.or(org_id.eq.X,org_id.is.null)` to include global bots.
- **Approval requests now group-scoped** — GET `/api/approvals` filters by `group_id` from authenticated user's profile. Previously returned all approval requests across all orgs/groups.
- **D3.js added as dependency** — `d3` v7.9.0 + `@types/d3` v7.4.3. Installs cleanly with `--legacy-peer-deps`. Used only by `OrgChartView.tsx`.
- **Org chart hierarchy is role-based (Option A)** — `buildOrgChartData()` in `lib/org-chart-utils.ts` is the only file that knows hierarchy logic. When `recruited_by` FK is added to profiles, only this function changes. Comment marks the insertion point.
- **Avatar hex colors shared source of truth** — `--avatar-color-*` CSS vars in `globals.css`, `AVATAR_HEX_COLORS` in `lib/avatar.ts`, and Tailwind classes in `AVATAR_COLORS` must stay in sync. If the palette changes, update all three.
- **Org chart MemberDetailModal** — Node clicks open `MemberDetailModal` (Dialog). If a richer slide-in detail panel is wanted, consider converting to a Sheet in a future session.
- **Org chart pill overlap detection not implemented** — The spec mentions hiding pills on overlap. Current implementation relies on D3 tree layout separation + dynamic ring radius to prevent overlap. If overlap occurs at scale (100+ members), add SVG bounding box collision checks.
- **`fal_request_id` now captured** — `ImageResult` in `lib/image-tools.ts` includes `requestId?: string`, extracted from `result.request_id` in the raw Railway/fal.ai response. Both `debit_image_credit` call sites pass `imageResult.requestId ?? null`. The field will be null if the upstream API doesn't include `request_id` in its response.
- **Old credit system dormant** — `check_and_increment_image_credits` RPC and `org_integrations.image_api_credits_allocated` / `image_api_credits_used` columns are retained but no longer called. The new billing system uses `group_billing` table + `debit_image_credit` RPC. Old columns/RPCs marked for deprecation — safe to drop in a future cleanup session.
- **`platform_fee_percentage` stored but not applied** — The field is stored in `group_billing` and editable in the admin Billing tab, but `calculateImageCost()` in `lib/billing-utils.ts` does not factor it into the cost. Wire it when Stripe integration begins.
- **SSE `creditBalance` event timing** — The `debit_image_credit` RPC runs fire-and-forget after generation. If the RPC is slow, the `{ creditBalance: number }` SSE event may arrive after the stream closes. The topbar would show stale balance until the next generation. In practice the RPC is a single SQL transaction and is fast.
- **Migrations 029–032 required** — Must be run in Supabase SQL Editor in order (029 → 030 → 031 → 032) before the billing system is functional. Without them, billing API routes return defaults and debit calls fail silently.
- **Migrations 033–039 required** — Must be run in Supabase SQL Editor in order (033 → 039) for branding and landing page features. 033: group_branding table. 034: group_landing_pages table. 035: landing_page_tools_enabled flag. 036: font + form embed columns. 037: hero_images array. 038: public anon RLS for live landing pages. 039: storage bucket creation (branding + landing-pages).
- **Storage buckets `branding` and `landing-pages`** — Bucket creation covered by migration 039 (upsert, safe to re-run). Storage RLS policies (INSERT for authenticated, SELECT for public) must still be configured manually in Supabase dashboard under Storage > Policies.
- **Landing page text pattern detection** — The Landing Page Creator bot uses text pattern detection, not OpenAI function calling. The model outputs `GENERATE_LANDING_PAGE` followed by a JSON block. The chat route detects this in the accumulated streamed content (gated by `landingPageToolsEnabled`). The trigger keyword must match exactly between the system prompt and `route.ts`. Image tool flow is completely separate and unaffected.
- **Landing page trigger text stripped client-side** — `stripLandingPageTrigger()` in ChatView.tsx uses brace counting to strip the trigger block from rendered content. The `parsed.landingPage` SSE event replaces all message content with a styled "See your landing page" button link.
- **Landing page proxy route** — Supabase Storage forces `text/plain` + `sandbox` CSP on HTML files. Landing pages are served via `/api/landing-pages/[id]/view` which downloads from Storage and returns with `Content-Type: text/html`. This is a public route — no auth required.
- **`form_embed_html` injected raw** — The form embed HTML from group_branding is not escaped — it's trusted admin-provided content. The amber warning in the Branding tab is the only safeguard. Can contain `<script>` tags (e.g., HubSpot embeds).
- **Google Fonts requires internet** — Generated landing pages load custom fonts via Google Fonts CDN. Offline viewing falls back to system fonts.
- **`docs/changeagent/` reference files** — Contains `landing_page_system_prompt.md` (system prompt for Open WebUI) and `landing_page_bot_insert.sql` (bot DB insert). The Python tool file (`landing_page_tools.py`) was deleted — it was for the ChangeAgent approach that was replaced by native text pattern detection.
- **Admin Panel uses sidebar navigation** — replaced horizontal tabs with a 220px sidebar organized into 3 groups (Manage, Tools, Settings). 9 sections for super admin (People, Hours, Goals, Organization, Bots, Branding, Landing Pages, Integrations, Billing), 5 for group admin (People, Hours, Goals, Branding, Landing Pages). Uses controlled `useState` with conditional rendering instead of Shadcn Tabs. `?tab=` URL param deep linking preserved. `TAB_PARAM_MAP` includes `hours: "Hours"`.
- **Hours tab in Admin Panel** — Team volunteer hours view. KPI summary cards (total hours, this month, active volunteers), member table sorted by this_month_hours DESC, detail sheet per member with full log entries. Uses existing `volunteer_hours` table — no new migrations. Null guard: if `groupId` is null, renders "No group assigned" and skips API call.
- **Recruitment Goals widget "Set Goals" button** — visible to admins only (`isAdminRole`), navigates to `/admin?tab=goals`. Uses `--widget-btn-recruitment` CSS variable (#422D8F). `RecruitmentGoalWidget` now requires `role` prop, passed from `WidgetGrid`.
- **`requireApiKey()` in `lib/api-utils.ts`** — Validates Bearer token against `CHANGE_AGENT_API_KEY` for external endpoints. Currently only used by the dormant `/api/tools/generate-landing-page` route.
- **Image generation switched to Black Forest Labs (BFL)** — Railway image editor service (`qwen-image-editor`) now proxies to BFL instead of fal.ai. Endpoint paths changed from `/api/external/flux-2-pro-edit-*` to `/api/external/bfl/flux-2-pro-edit-*`. `RAILWAY_ENDPOINTS` in `lib/image-tools.ts` updated. Generated image URLs may still come from fal CDN (`fal-cdn.fal.ai`) as the BFL endpoints may cache through fal infrastructure. The Open WebUI Python tool (Fernando's "Unified Image Tools Suite" v4.0.0) has the same endpoint paths configured in its Valves.
- **NB integration toggle system** — Migration 040 adds `nb_enabled`, `nb_api_token` (encrypted), `nb_slug`, `nb_status`, `nb_last_checked_at` to `org_integrations`. Admin Integrations tab has enable/disable toggle + Settings dialog (Shadcn Dialog) for NB slug + API token. `get_nb_config` SECURITY DEFINER RPC allows the signups route (non-admin) to read encrypted credentials. Signups route resolves credentials: DB first → env var fallback (with `console.warn`) → not_configured. Dashboard widgets respect `nbEnabled`: SignupsWidget shows "No signup source enabled" + "Manage signup sources" link when off; ConnectedSystemsWidget hides NB row when off. Action Network and Mobilize rows also hidden from widget until they get their own toggles.
- **Integration toggle pattern established** — To add the same enable/disable pattern for Mobilize or Action Network: (1) add columns to `org_integrations`, (2) create admin API route mirroring `/api/admin/integrations/nationbuilder`, (3) add toggle + dialog to IntegrationsTab, (4) update widget visibility. Follow the NB pattern exactly.
- **"Google Calendar" → "Calendar"** — Fixed in ConnectedSystemsWidget. Was a known issue from prior sessions.
- **Migrations 040 required** — Must be run in Supabase SQL Editor for the NB integration toggle to work. Without it, the `nb_enabled` column doesn't exist and the NB admin route will fail.

---

## UI Improvement Sessions

### Guiding principle
Adopt Tremor as the foundational design language for the entire app. Build everything in Tremor neutral defaults first — no custom colors anywhere. Color is applied as a final step in UI Session G.

All color values go through CSS variables in globals.css and lib/design-tokens.ts. During Sessions C through F, every color reference must use a CSS variable — never a hardcoded hex value. Variables start as Tremor neutrals and get overridden in Session G.

Color variables to maintain as neutral during build:
- --cat-advisors, --cat-create, --cat-tools, --cat-analyze (bot category colors)
- --widget-bg-* (one per widget)
- --bg (page background)
- --card-bg (card surfaces)
- --accent-purple (primary accent)

### UI Session A — Design token consolidation
Status: Complete

### UI Session B — Shadcn/ui introduction
Status: Complete

### UI Session B.5 — Complete Shadcn rollout
Status: Complete

### UI Session C — Tremor foundation
Status: Complete — continued as C.2
Goal: Establish Tremor as the design language baseline. Fix the background/surface hierarchy first, then rebuild the right sidebar widgets using Tremor KPI and Status blocks. Use Tremor neutral defaults throughout — no custom colors.

Priority order:
1. Fix surface hierarchy — main content area background should be white/near-white, not lavender. Lavender (or whatever --bg resolves to) stays only on the page chrome, left sidebar, and topbar. This single change grounds every screen.
2. Right sidebar widgets — rebuild using Tremor KPI Cards and Status Monitoring blocks:
   - Fundraising → Tremor KPI card + ProgressBar
   - Recruitment Goal → Tremor KPI + dual ProgressBar
   - Hours Volunteered → Tremor KPI + SparkChart (BadgeDelta component was unused and deleted in code health session)
   - Connected Systems → Tremor Status block or Shadcn Badge (whichever is cleaner)
   - Upcoming Events → Tremor Card list
   - New Sign-Ups → keep custom, spacing cleanup only
   - Group Conversations → keep custom, spacing cleanup
   - Group Actions → keep custom, spacing cleanup
3. Bot Editor form — rebuild using Tremor/Shadcn Form Layout block. Should feel like it fills the space intentionally, not a narrow card floating on a void.
4. Profile Settings form — same treatment as Bot Editor. Use Account and User Management block as reference.

WHAT TO PRESERVE: all functionality, handlers, role logic, data fetching, CSS variable structure.
WHAT TO BUILD: Tremor neutral defaults only. No hardcoded hex values. No custom colors.

Install: npm install @tremor/react --legacy-peer-deps
(React 19 peer dep conflict — this flag is required)

Commit: "UI Session C: Tremor foundation and surface hierarchy fix"

### UI Session D — Remaining screens
Status: Complete
Goal: Apply Tremor design language to remaining screens. Use Tremor neutral defaults throughout.

Screens to rebuild:
- Member Directory → Tremor Grid Lists (person card variants)
- Group Media → Tremor Grid Lists (file/asset card variants, replace colored placeholders with file type icons on neutral backgrounds)
- Activity Feed (Settings) → Tremor Feed/Onboarding blocks
- Approvals list → Tremor Table + Filterbar blocks
- Login / Signup / Reset Password → Tremor Login blocks (centered card, logo above, neutral card on --bg background)
- Bot chat Recent Conversations sidebar → Tremor Grid Lists for conversation list items (chat itself stays custom)

Commit: "UI Session D: Tremor design language across remaining screens"

### UI Session D.5 — Icon consolidation
Status: Complete
Goal: Replace all Material Icons and Lucide icons with Streamline icons from public/streamline-vectors-main/ultimate/regular/

Icon mapping defined and approved. Claude Code should use judgment for any icons not in the explicit mapping — choose based on semantic meaning, document all additions in handover note.

Key files:
- src/components/ui/icon.tsx (new)
- src/lib/icon-map.ts (new)
- src/lib/bots.ts (update icon field)
- src/components/BotCard.tsx
- src/components/LeftSidebar.tsx
- src/app/layout.tsx (remove Material Icons CDN)

Commit: "UI Session D.5: icon consolidation with Streamline vectors"

### UI Session E — Dashboard grid
Status: Complete
Goal: Introduce React Grid Layout for the right sidebar. Wire to database. Use lib/dashboard-widgets.ts.

Key behaviour:
- 3-column snap grid with vertical compaction (no gaps)
- Edit mode toggle — widgets locked by default, "Edit layout" button to enter edit mode
- Edit mode shows dashed borders + drag handles, "Save" button replaces "Edit layout"
- Super admin save: dialog with "Save for me only" vs "Save as org default"
- Non-super-admin: saves directly to user layout, no dialog
- Reset to default: only visible to non-super-admin when personal layout exists
- Role-invisible widgets removed from layout, remaining widgets reflow
- Per-widget size constraints from WIDGET_CONSTRAINTS (signups/directory minW:2)
- Auto-save on unmount if edit mode active (user layout only, never org default)
- CSS fade-in animation (GSAP removed from sidebar)
- 11 extracted widget components in src/components/dashboard/
- Layout persistence: user → org default → system default fallback chain
- Migration 017: dashboard_layouts_default + dashboard_layouts_user tables

Commit: "UI Session E: configurable dashboard grid"

### UI Session F — Icon consolidation
Status: Depends on UI Session E
Goal: Replace all icon systems with the custom icon set in the public folder.

- Keep Material Icons Two-Tone for bot card circles only if they remain intentionally distinctive
- Replace all inline SVGs in nav, buttons, actions with icons from public folder
- Lucide icons introduced by Shadcn stay where they already are unless the custom set has a better match
- Establish convention: all new icons use custom set

Commit: "UI Session F: icon consolidation"

### UI Session G — Color theming
Status: Complete (in progress — `--accent-purple` still neutral)
Goal: Apply brand color decisions from Figma designs. Widget colors, typography, buttons, charts, topbar, sidebar, bot cards.

Completed:
- Dashboard bg `#F6F4FF`, widget backgrounds from Figma (pastels + white)
- Widget typography: em-based sizing, 18px bold titles, 31/24/15px metrics, per-widget button accents
- Widget buttons: per-widget colors (coral, green, purple, orange), container query sizing (fills 1-col, capped 2+ col)
- Donut chart colors via CSS custom property overrides on ProgressCircle (members `#422D8F`, supporters `#159EC1`, fundraising `#FE6778`)
- Connected Systems: brand logo icons
- Events/Actions: dynamic item count via ResizeObserver
- TopBar: org name 20px, group pill `#F8F7FF`, bell next to group, all icons `#422D8F`
- Sidebar: `#F2F0FC` bg, `#422D8F` nav icons/text with 50% inactive, "Leaders Chat" rename
- Bot cards: category colors (advisors `#F2F0FC`, create `#FBE9D8`, tools `#FFDADD`, analyze `#D7F5E6`), per-category Helper pill colors, name 13px semibold, Helper 10px
- Bot names from DB: `getBots()` merges DB names with hardcoded Streamline icons
- Icon component: `color` prop via CSS mask-image

Remaining:
- `--accent-purple` still neutral `#18181B`

Commits: "UI Session G: widget color theming, topbar + sidebar redesign", "UI Session G continued: bot cards, font sizing, DB bot names, tweaks"
