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
- 4 tabs: Organization, People, Bots, Integrations
- **Organization tab**: Edit org name, manage groups (rename)
- **People tab**: List all org members, change roles (super_admin/group_admin/member/supporter), reassign groups, remove members, inline name editing
- **Bots tab**: DB-driven bot management (create, edit, delete), system prompt editor, category/icon picker
- **Integrations tab**: Calendar source management (add/remove iCal/Google/Mobilize feeds, toggle enable/disable, color coding), NationBuilder status, Action Network/Mobilize status

### 8. Approvals Page (`/approvals`)
- Submit items for admin/group_admin review (text + file attachments)
- Status workflow: pending → approved OR changes_requested → resubmit
- Comment thread per approval request
- Email notifications via Resend to reviewer on submit and to submitter on status change
- In-app notification bar for approval-related updates

### 9. Members Page (`/members`)
- Group member directory with search
- Shows roles and avatars
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
- **NationBuilder** — Connected (read-only signup ingestion, v2 API)
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
| `ENCRYPTION_KEY` | 32-byte hex string for AES-256-GCM encryption of RunPod bearer token (generate: `openssl rand -hex 32`) |
| `NATIONBUILDER_API_TOKEN` | NationBuilder v2 API Bearer token |
| `NATIONBUILDER_SLUG` | NationBuilder subdomain slug |
| `RESEND_API_KEY` | Resend email API key |
| `RESEND_FROM_EMAIL` | Sender email address for Resend transactional emails |

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
| `019_group_goals.sql` | `group_goals` table (one row per group): money_goal, money_budget, money_raised_offline, members_goal, supporters_goal, updated_by. UNIQUE(group_id). RLS: members read, admins (super_admin + group_admin) insert/update via `is_admin()`. Centralizes goal targets that feed Fundraising and Recruitment Goal dashboard widgets. |
| `020_actions.sql` | Full actions system: `actions` table (source, type, title, description, call_to_action, url, suggested_bot_slug, points_value, priority, assignment_scope, starts_at, ends_at, status, visibility), `action_assignments` (member + group targeting), `action_completions` (UNIQUE per member per action, snapshotted points), `member_points_ledger` (UNIQUE per completion, audit trail). `complete_action()` SECURITY DEFINER RPC for atomic completion + points. RLS on all 4 tables: group-scoped reads, admin-only writes, members see own completions/ledger only. Error code contract (P0002–P0005) documented in both migration and API route. |
| `021_create_action_with_assignments.sql` | `create_action_with_assignments()` SECURITY DEFINER RPC: atomic action creation with optional targeted assignments. If either insert fails, both roll back. Replaces the two-step insert pattern in `/api/actions` POST. |
| `022_org_integrations.sql` | `org_integrations` table (one row per org): RunPod endpoint URL, encrypted bearer token, connection status, last checked timestamp. RLS: super_admin only. Adds `model_id` column to `bots` table for per-bot model selection from RunPod endpoint. |
| `023_image_tools.sql` | Extends `org_integrations` with image API columns (endpoint, encrypted token, credits allocated/used). Adds `image_tools_enabled` boolean to `bots` table (true for graphics-creation). Updates `media_items`: adds 'generated' category, 'private' visibility, updates `media_file_or_link` constraint, updates RLS SELECT to allow users to see own private items. Adds `increment_image_credits()` SECURITY DEFINER RPC. |

---

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/chat` | POST | Streams responses from RunPod-hosted model (per-bot model_id + org RunPod credentials), persists conversations + messages to Supabase. Returns 503 `not_configured` if bot has no model or RunPod not configured. |
| `/api/favorites` | GET/POST | Fetch, add, remove user's favorite/starred bots |
| `/api/nationbuilder/signups` | GET | Fetches last 3 NB signups, auto-assigns unassigned to admin, returns with assignments |
| `/api/signups/assign` | POST | Assigns NB signup to team member (RPC + Resend email notification) |
| `/api/notifications` | GET | Unread notifications for current user (max 10) |
| `/api/notifications/read` | POST | Mark notifications as read (by IDs or "all") |
| `/api/events` | GET | Fetches enabled calendar sources for user's org, parses ICS feeds, returns next 30 days of events (max 20) |
| `/api/hours` | GET/POST | GET: list group volunteer hours with totals. POST: log hours for current user |
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
| `/api/image-tools/upload` | POST | Upload base64 image to Railway, save to media_items as private generated image |
| `/api/image-tools/execute` | POST | Execute image tool (generate/edit/fuse/brand), validates bot has image_tools_enabled, checks credits, saves result to media_items |
| `/api/image-tools/credentials-status` | GET | Image API status — super_admin sees credits, other roles see configured boolean only |
| `/api/admin/integrations/image-api` | GET/POST | GET: image API config (never token). POST: save endpoint + encrypted token (super_admin only) |
| `/auth/reset-callback` | GET | Password reset callback — exchanges PKCE code, redirects to /reset-password |

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
| `chat/ChatInput.tsx` | Message input with send button, image attachment upload (image bots only) |
| `chat/MessageList.tsx` | Message history with image markdown rendering, style gallery grid, image action buttons (Studio/Try again/Request approval/Share to group), creative brief tag stripping |
| `chat/RecentConversations.tsx` | Sidebar: saved briefs (image bots), creative brief (live REQ tags), past chats (collapsible, 10-limit, deletable) |
| `chat/CreativeBrief.tsx` | Live creative brief from [REQ:] tags + saved briefs section with 4 hardcoded example briefs |
| `chat/StudioOverlay.tsx` | Full-screen iframe overlay for Railway Studio visual editor. Opens with most recent generated image. ESC to close. One-way integration — edits don't save back. |
| `coach/CoachChatView.tsx` | Group Coach Bot with campaign stats sidebar |
| `coach/CampaignStats.tsx` | Campaign goals, strategy notes, upcoming events sidebar |
| `media/MediaGallery.tsx` | Functional media gallery: API-driven list with category filters, full-text search, pagination, grid/list views, upload modal, detail sheet |
| `media/UploadMediaModal.tsx` | Dialog with file upload and link tabs, MIME/size validation |
| `media/MediaDetailSheet.tsx` | Sheet side panel: preview, metadata, download, delete with confirmation |
| `media/StorageUsageBar.tsx` | Progress bar showing group storage usage vs quota |
| `signups/NbSignupModal.tsx` | NB signup detail modal with contact/call/assign actions |
| `signups/SignupsView.tsx` | Full signups table page: search, status badges, assignment info, click-to-modal |
| `actions/ActionsView.tsx` | Full actions page: scope/type/status filters, action card grid, create/edit/detail sheets |
| `actions/ActionCard.tsx` | Action card: type badge, source badge, points, deadline, scope, admin controls |
| `actions/CreateEditActionSheet.tsx` | Sheet form: title, description, type, CTA, URL, points, scope, bot suggestion, dates, visibility |
| `actions/ActionDetailSheet.tsx` | Sheet detail: CTA button (opens new tab if external), completion gating, notes, self-assign, admin completion list |
| `members/MemberDirectory.tsx` | Group member list with roles and search |
| `members/MemberDetailModal.tsx` | Member detail popup |
| `members/MemberProfile.tsx` | Member profile card |
| `admin/AdminView.tsx` | Main admin tab container with role guard (5 tabs for super_admin, 2 for group_admin) |
| `admin/OrgTab.tsx` | Organization settings (name, details) |
| `admin/GoalsTab.tsx` | Admin-editable group goals: fundraising (money_goal, money_budget, money_raised_offline) and recruitment (members_goal, supporters_goal). Inline edit pattern matching OrgTab. |
| `admin/PeopleTab.tsx` | Member management with role/group changes, inline name editing |
| `admin/BotsTab.tsx` | Bot CRUD management |
| `admin/BotEditor.tsx` | Bot form (slug, name, icon, category, description, system prompt) |
| `admin/IntegrationsTab.tsx` | Calendar source management + integration status |
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
| `dashboard/*.tsx` | 11 extracted widget components (SignupsWidget, RecruitWidget, ConversationsWidget, ActionsWidget, FundraisingWidget, RecruitmentGoalWidget, RequestApprovalWidget, ConnectedSystemsWidget, HoursWidget, EventsWidget, DirectoryWidget) |

---

## Key Lib Files

| File | Description |
|---|---|
| `lib/types.ts` | Type definitions: UserRole, Message, Conversation, Member, GroupMessage, NbSignup, SignupAssignment, AppNotification, ApprovalRequest, ApprovalComment, FundraisingGoal (LEGACY targets), GroupGoals, ReimbursementRequest, Action, ActionAssignment, ActionCompletion, MemberPointsLedger, etc. |
| `lib/bots.ts` | Hardcoded bot definitions: 24 bots with metadata (id, name, icon, category, description), categoryMeta colors, defaultFeaturedBotIds |
| `lib/bots-prompts.ts` | Bot system prompts mapped by bot ID, falls back to generic prompt |
| `lib/bot-resolver.ts` | getBots() (DB-first, fallback to hardcoded), getSystemPrompt() (DB-first, fallback to bots-prompts.ts) |
| `lib/encryption.ts` | AES-256-GCM encrypt/decrypt utility for RunPod bearer token. Uses `ENCRYPTION_KEY` env var (32-byte hex). Node.js `crypto` module, no dependencies. |
| `lib/image-tools.ts` | **Only file that calls the Railway image API.** Upload, generate, edit, fuse, brand images. Credential fetch + decryption, credit tracking, platform size lookup. Mirrors `lib/media-storage.ts` pattern. |
| `lib/image-tool-definitions.ts` | OpenAI-compatible tool definitions array for ChangeAgent. Passed via `tools` parameter — never injected into system prompt. 4 tools: generate_image, edit_image, fuse_images, apply_branding. |
| `lib/style-gallery-data.ts` | Style gallery data for Graphics Creation bot. Main gallery (10 styles) + 10 substyle galleries with fal.ai CDN image URLs. Used by chat route to respond to model's `style_galery` tool calls. |
| `lib/ical-parser.ts` | Lightweight ICS parser (no native deps) — handles DTSTART/DTEND with TZID, line unfolding, escaped chars |
| `lib/avatar.ts` | Avatar utilities (upload, delete, generate URL) for Supabase Storage |
| `lib/signup-utils.ts` | NationBuilder signup utilities (fetch, parse, enrich). Returns connection status (connected/error/not_configured) |
| `lib/media-storage.ts` | **Only file that imports Supabase Storage for media.** Upload, signed URLs (1hr TTL), delete, quota check/increment. Swap storage providers by changing this file only. Includes bucket setup instructions in header comment. |
| `lib/action-adapters/index.ts` | **Action source adapter scaffold.** Defines `ActionSourceAdapter` interface, `CanonicalAction` type, adapter registry. Future external sources (NB, Action Network, ActBlue, Sosha) each get a file here. No concrete adapters yet. |
| `lib/UserProfileContext.tsx` | React Context for user profile data (role, orgName, groupName, name, avatar) — consumed by TopBar, LeftSidebar, RightSidebar, etc. |
| `lib/constants/roles.ts` | Role constants (`ROLES`), validation array (`VALID_ROLES`), and helper functions (`isAdminRole`, `isSuperAdmin`). Single source of truth for role strings. |
| `lib/api-utils.ts` | Shared API route utilities: `requireAuth()` (auth + profile lookup), `fetchProfileMap()` (batch profile enrichment). New routes should use these. |
| `lib/dashboard-widgets.ts` | Widget IDs, role-based visibility permissions, labels, size constraints, system default layout, and layout utility functions (getVisibleWidgets, filterLayoutToRole, mergeLayoutWithDefaults) |
| `lib/supabase/server.ts` | Server-side Supabase client factory using cookies |
| `lib/supabase/client.ts` | Client-side Supabase client factory |

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
- Member directory with RPC-based group member fetching + member detail pages
- Profile settings (name, bio, avatar upload)
- Real-time group messaging (Supabase Realtime)
- NationBuilder integration (read-only signup ingestion with NB icon badges)
- Interactive NB signup assignments (click → modal → contact/call/assign)
- Email notifications via Resend (signups, approvals, status changes)
- In-app notification bar for signup assignments and approvals
- **Super Admin Panel** — org settings, people management (roles, groups, inline name editing), DB-driven bot management, goals management, integrations
- **Approval workflow** — submit, review, approve/request changes, resubmit, comment threads
- **Calendar integration** — system-agnostic iCal/ICS feeds (Google Calendar, Outlook, Mobilize), managed in admin Integrations tab
- **Upcoming Events widget** — pulls from connected calendar feeds, shows next 30 days
- **Volunteer hours tracking** — log hours, view detail overlay with entries by date, dashboard widget with real totals
- **Dynamic top bar** — org name and group name fetched from DB, update when admin changes them
- **Connected Systems widget** — dynamic: NB shows real status (Functional/Error/Not Connected), Calendar reflects live feed state, Action Network/Mobilize: Not Connected
- **Fundraising goals** — targets (money_goal, money_budget) stored in `group_goals` table, admin-editable via Goals tab in Admin Panel. Monthly amount_raised tracked in `fundraising_goals`. Offline fundraising offset (`money_raised_offline`) added to displayed totals. FundraisingWidget reads targets from `group_goals`, no longer has inline edit.
- **Recruitment goals** — members_goal and supporters_goal in `group_goals` table, admin-editable via Goals tab. RecruitmentGoalWidget uses dynamic DB values instead of hardcoded targets. Handles goal=0 gracefully (shows raw count, hides percentage).
- **Admin Goals tab** — visible to both super_admin and group_admin. Two sections: Fundraising Goals (monthly target, print budget, offline offset) and Recruitment Goals (member/supporter targets). Inline edit pattern matching OrgTab.
- **Reimbursement requests** — submit with amount/description/attachment, approval workflow (pending→approved/changes_requested→resubmit), notifications to super_admin
- **Activity log** — unified chronological timeline in Settings > Activity tab showing hours, approvals, signups, reimbursements with type tags
- **Notification bar** — handles multiple notification types simultaneously (signups, approvals, reimbursements), uses real signup_assignments count, clickable signup count opens lightbox
- **Group profile page** — `/group` route showing group name, description, member count, quick links. Group pill in top bar is clickable link.
- **Group descriptions** — admin can edit in Organization tab, visible on group profile page
- **Sidebar role display** — shows dynamic user role instead of hardcoded "Settings"
- **Default signup role** — new users default to 'supporter' (lowest privilege)
- **Configurable dashboard grid** — React Grid Layout (3-column snap grid with vertical compaction), edit mode toggle, role-aware save (super admin gets "Save for me" vs "Save as org default" dialog), reset to default for non-super-admin, per-widget size constraints from WIDGET_CONSTRAINTS, role-based widget visibility, sonner toasts for feedback, CSS fade-in animation
- **Actions system** — full CRUD for internal actions (petition, donation, event_rsvp, letter, phone_bank, canvass, social_share, custom). Admin creates actions with points, deadlines, assignment scope (all/targeted/self_assign), optional bot suggestions, visibility control. Members complete actions via detail sheet — external actions must be clicked before completion unlocks. Atomic completion + points ledger via `complete_action` SECURITY DEFINER RPC with group boundary validation. Source adapter scaffold in `lib/action-adapters/` ready for NB/Action Network/ActBlue/Sosha ingestion. Actions widget on dashboard shows top 3 with click-to-detail. Full page at `/actions` with scope/type/status filters.
- **Signups page** — `/signups` full table view of NationBuilder signups with search, status badges, assignment info. Entry point: "See all (##)" button in SignupsWidget. SignupsWidget now shows max 2 items with count-based CTA button (#c66a0c).
- **Integrations tab — Action Sources** — scaffold section in admin Integrations showing NationBuilder Actions, Action Network, ActBlue, Sosha with "Not Connected" status and disabled Configure buttons.
- GSAP entrance animations throughout (except right sidebar — uses CSS fade-in)
- **Graphics Creation bot — image tools**: Full image generation via Railway/fal.ai with OpenAI tool calling. Style gallery (10 styles × substyles, clickable grid with preloading). Image-to-image with uploaded reference photos. Inline image rendering with action buttons (Studio, Try again, Request approval, Share to group). Studio iframe overlay. Creative brief sidebar (live [REQ:] tag parsing + 4 saved example briefs). Image upload shows thumbnail preview. Chat sidebar: collapsible past chats (10-limit, deletable), saved briefs section.
- **Media Library thumbnails**: Image and generated items show actual image thumbnails. Select mode with bulk delete.
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
- **requireAuth() migration status** — 3 routes use `requireAuth()` (actions, goals, reimbursements GET). 40 routes still use inline auth pattern. New routes should use `requireAuth()`. Incremental migration in future sessions.
- **WelcomeHelper exhaustive-deps** — `src/components/WelcomeHelper.tsx:161` has eslint-disable for `react-hooks/exhaustive-deps`. Should be audited for stale closure bugs in a future session.
- **⚠️ Image API token rotation required** — Token `sk-j6gKait8TE8ZkV3LrNPPYDHEAvM8zqVN` was exposed during testing. Must be rotated in Railway and the new token saved in org_integrations before production or demos. See `lib/image-tools.ts` header comment.
- **Studio overlay one-way** — Members can edit images in the Railway Studio but results are not automatically saved back to the chat or Media Library. Requires a backend change on the Railway Studio side to support arbitrary callback URLs. When implemented, wire to a new POST `/api/image-tools/studio-callback` endpoint.
- **Studio overlay blocked on localhost** — The Railway Studio iframe shows "Access denied — This Studio can only be accessed from an approved host" when running locally. This is an origin restriction on the Railway Studio side. Works when deployed to Railway. To fix for local dev, the Railway Studio app would need `localhost:3000` added to its allowed origins.
- **Image tools DB-driven** — `bots.image_tools_enabled` boolean controls which bots get image tools. Currently only `graphics-creation` is enabled. To add image tools to another bot, set `image_tools_enabled = true` in the bots table.
- **Image credits manual** — `image_api_credits_allocated` is set manually by the Tectonica team in the database. No self-service credit top-up UI.
- **Private generated images** — visibility='private' items are only visible to their creator (RLS-enforced). Not visible to admins. Not counted in group storage quota. Lock icon shown in Media Library grid.

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
