# Tectonica.AI — Movement Intelligence Platform

## 1. Executive Summary

A platform designed for political and social movement organizations. It gives organizers, group leaders, and volunteers a single workspace where they can plan campaigns, create content, track recruitment, manage media, coordinate events, and communicate — all supported by a suite of specialized AI bots that understand the context of movement organizing.

We work in a spec-driven development model — every feature is fully specified before implementation begins, with explicit scope boundaries, schema design, and architectural constraints. The living spec document (CLAUDE.md) is updated every session and serves as the single source of truth for the entire codebase.

The platform serves four tiers of users within an organization: super admins who manage the entire organization's settings, bots, and integrations; group admins who oversee their local group's people and goals; members who actively participate in organizing work; and supporters who have limited access as newcomers. Each role sees a tailored experience — from a full admin panel with people management and integration controls, down to a streamlined dashboard focused on getting started.

Today, the core platform is live and functional. Users can sign up, log in, chat with 24 AI bots across four categories (Advisors, Create Things, Use Organizing Tools, Understand + Analyze), upload and manage group media, track volunteer hours and fundraising goals, submit items for approval, manage reimbursement requests, create and complete actions with points tracking, and view a configurable dashboard with live data from NationBuilder signups, calendar feeds, group conversations, and actions. The admin panel supports full organization, people, bot, goal, action, and integration management.

The path to full launch involves connecting external action source adapters (NationBuilder actions, Action Network, ActBlue, Sosha), completing remaining integration connections (Mobilize), wiring the Group Coach Bot to real campaign data, enabling the Graphics Creation bot's visual editor, resolving a DNS verification blocker for transactional emails, and expanding the platform to support multiple organizations and groups simultaneously — a capability the database schema already supports but the UI does not yet surface.

---

## 2. Product Status

### Fully live and working

- Authentication (email/password signup, login, email confirmation, forgot/reset password, session management)
- Role-based access control (super_admin, group_admin, member, supporter) with automatic group assignment on signup
- Dashboard with 24 AI bot cards in 4 categories, star/favorite system, drag-and-drop reordering
- Bot chat with GPT-4o streaming responses and conversation persistence
- Group Coach Bot page (UI complete, campaign stats sidebar uses mock data)
- Media Library with file upload, link bookmarks, category filters, full-text search, grid/list views, signed URL downloads, soft delete, storage quota tracking
- Member directory with search and member detail pages
- Real-time group messaging via Supabase Realtime
- NationBuilder integration (read-only signup ingestion, interactive assignment workflow)
- Approval workflow (submit, review, approve/request changes, resubmit, comment threads)
- Volunteer hours tracking with dashboard widget and detail overlay
- Fundraising and recruitment goals (admin-editable, DB-driven, displayed in dashboard widgets)
- Reimbursement requests with approval workflow and in-app notifications
- Super Admin Panel (Organization, People, Goals, Bots, Integrations tabs)
- Configurable dashboard grid (React Grid Layout, role-aware save, per-widget size constraints)
- Calendar integration (iCal/ICS feeds from Google Calendar, Outlook, Mobilize)
- Actions system (internal actions with types, points, deadlines, assignment scoping, self-reported completion tracking, points ledger)
- Signups page (full NationBuilder signup table with search, status, assignment info)
- Notification bar (signups, approvals, reimbursements)
- Profile and account settings with avatar upload
- Activity log (unified timeline of hours, approvals, signups, reimbursements)
- Group profile page with description, member count, quick links
- GSAP entrance animations throughout
- Deployed on Railway with auto-deploy from `v2` branch

### In progress

- Leaders & Organizers chat panel UI exists but lacks real-time backend
- Group Coach Bot campaign stats sidebar uses mock data

### Blocked

- **Resend domain verification** — `tectonica.co` is "Not Started" in Resend. The partner organization needs to add DNS records in GoDaddy. This blocks: signup confirmation emails, password reset emails, and all transactional emails sent to non-owner addresses. Supabase SMTP is configured correctly and just needs the verified domain.
- **Reimbursement email notifications** — coded and ready but will not send until Resend domain is verified. In-app notifications work in the meantime.
- **Action Network and Mobilize integrations** — not yet connected. UI shows "Not Connected" status in the Connected Systems widget.
- **External action source adapters** — scaffold exists in `lib/action-adapters/` but no concrete implementations. NationBuilder Actions, Action Network, ActBlue, and Sosha show "Not Connected" in the Integrations tab Action Sources section.

---

## 3. Developer Onboarding

### Prerequisites

- Node.js (version compatible with Next.js 16)
- npm (used throughout — no yarn/pnpm/bun)
- Access to the project's Supabase instance (URL + anon key)
- Access to the project's OpenAI API key
- Git

### Environment variables

Create a `.env.local` file at the project root with:

```
NEXT_PUBLIC_SUPABASE_URL=<Supabase project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabase public anon key>
OPENAI_API_KEY=<OpenAI API key for GPT-4o>
NATIONBUILDER_API_TOKEN=<NationBuilder v2 API Bearer token>
NATIONBUILDER_SLUG=<NationBuilder subdomain slug>
RESEND_API_KEY=<Resend email API key>
RESEND_FROM_EMAIL=<Sender email address for Resend>
```

### Local setup

```bash
# Clone and switch to the correct branch
git clone <repo-url>
cd tectonica-ai-app
git checkout v2

# Install dependencies (--legacy-peer-deps is REQUIRED due to React 19 peer dep conflicts)
npm install --legacy-peer-deps

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Critical gotchas

- **Always work on the `v2` branch.** The `main` branch deploys the original (pre-redesign) app on Railway. Pushing redesign changes to `main` will break the original service.
- **Always use `--legacy-peer-deps`** when installing packages. React 19 causes peer dependency conflicts with Tremor and other libraries.
- **Railway deployment**: Two services exist on Railway sharing the same repo and Supabase DB:
  - `tectonica-ai-app` — auto-deploys from `main` (original app)
  - `tectonica-ai-v2` — auto-deploys from `v2` (redesigned app)
- **No Supabase CLI access.** All migrations are run manually in the Supabase SQL Editor. There is no `supabase db push` workflow.

### Manual Supabase setup (not covered by migrations)

The following must be configured manually in the Supabase dashboard:

1. **Storage buckets** — Create these buckets manually:
   - `avatars` — public bucket, 2MB limit, JPEG/PNG/WebP only
   - `approvals` — 5MB limit for approval request attachments
   - `media` — for Media Library files. Setup instructions are in the header comment of `src/lib/media-storage.ts`
   - `reimbursements` — for reimbursement request attachments
2. **Storage RLS policies** — Storage bucket policies are separate from table-level RLS and must be configured in the Supabase dashboard
3. **All SQL migrations** (in `supabase/migrations/`, numbered 001–020) must be run in order in the Supabase SQL Editor

### Test accounts

| Email | Role | Useful for |
|---|---|---|
| `mar@tectonica.co` | super_admin | Full admin panel access, org-wide operations |
| `ned@tectonica.co` | group_admin | Group-scoped admin (People + Goals tabs only) |
| `production@tectonica.co` | group_admin | Second group admin for testing multi-admin scenarios |
| `mar.isabel.spada@gmail.com` | member | Standard member experience, no admin access |
| `tectonica-ai-test1@maildrop.cc` | supporter | Lowest privilege, created manually in Supabase (auto-confirmed) |

### Known fragile points

- **Middleware active**: `src/middleware.ts` handles session refresh on every navigation and redirects unauthenticated users to `/login`. Auth race conditions are mitigated but client components (RightSidebar, NotificationBar) should still handle 401s gracefully.
- **Migration 021 applied**: `create_action_with_assignments` RPC is live. Used by actions POST for atomic action + assignment creation.
- **Supabase auth rate limiting**: Heavy HMR reloads during development can trigger rate limits. Wait it out if login starts failing.
- **Group goals first-run**: If no `group_goals` row exists for a group, dashboard widgets show zeros. An admin must visit the Goals tab and save once to create the row.
- **Base UI hydration mismatch**: A pre-existing console warning (`base-ui-_R_...` id mismatch) affects Input components in LeftSidebar and MediaGallery. Cosmetic only — rendering is correct.
- **Bot icon field in DB**: Database bot records still store old Material Icons strings. `getBots()` in `bot-resolver.ts` merges DB names/descriptions with hardcoded Streamline icons as fallback (DB icon used only if it starts with "bot-").

---

## 4. Architecture Overview

### Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS 4 with design token CSS variables |
| Database | Supabase PostgreSQL with Row Level Security, Realtime subscriptions |
| Auth | Supabase Auth (email/password, email confirmation) |
| AI | OpenAI GPT-4o (streaming SSE via API routes) |
| Email | Resend (transactional emails) |
| Animations | GSAP (entrance transitions, stagger animations) |
| Dashboard grid | React Grid Layout |
| Drag-and-drop | SortableJS (featured bot reordering) |
| Integrations | NationBuilder v2 API, iCal/ICS calendar feeds |
| Deployment | Railway (two services, same repo, same Supabase DB) |

### Folder structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/                # API routes (chat, favorites, signups, admin/*, etc.)
│   ├── admin/              # Super Admin Panel page
│   ├── approvals/          # Approval workflow page
│   ├── auth/               # Auth callbacks (confirmation, password reset)
│   ├── chat/               # Bot chat page
│   ├── coach/              # Group Coach Bot page
│   ├── forgot-password/    # Forgot password page
│   ├── group/              # Group profile page
│   ├── login/              # Login page
│   ├── actions/            # Actions page (full list with filters)
│   ├── media/              # Media Library page
│   ├── members/            # Member directory + detail pages
│   ├── reset-password/     # Reset password page
│   ├── settings/           # Profile and account settings page
│   ├── signups/            # NationBuilder signups page (full table)
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Dashboard (home) page
│   └── globals.css         # Global styles and CSS variables
├── components/             # React components
│   ├── admin/              # Admin panel components (OrgTab, PeopleTab, BotsTab, etc.)
│   ├── approvals/          # Approval workflow components
│   ├── chat/               # Bot chat components (ChatView, MessageList, etc.)
│   ├── coach/              # Group Coach Bot components
│   ├── dashboard/          # 11 extracted dashboard widget components
│   ├── hours/              # Volunteer hours components
│   ├── media/              # Media Library components (gallery, upload, detail)
│   ├── members/            # Member directory components
│   ├── settings/           # Settings page components
│   ├── actions/            # Actions system components (cards, sheets, view)
│   ├── signups/            # NationBuilder signup components (modal, full view)
│   ├── tremor/             # Tremor component wrappers
│   ├── ui/                 # Shadcn/ui primitives + custom Icon component
│   ├── AppShell.tsx        # Main layout shell
│   ├── TopBar.tsx          # Header bar
│   ├── LeftSidebar.tsx     # Navigation sidebar
│   ├── RightSidebar.tsx    # Dashboard widget grid
│   ├── BotGrid.tsx         # Bot card grid + featured carousel
│   ├── BotCard.tsx         # Individual bot card
│   └── ...                 # Other top-level components
├── hooks/                  # Custom React hooks
└── lib/                    # Shared utilities and configuration
    ├── supabase/
    │   ├── server.ts       # Server-side Supabase client factory
    │   └── client.ts       # Client-side Supabase client factory
    ├── types.ts            # All shared TypeScript types
    ├── bots.ts             # Bot definitions (24 bots, categories, metadata)
    ├── bots-prompts.ts     # Bot system prompts by ID
    ├── bot-resolver.ts     # DB-first bot resolution with hardcoded fallback
    ├── constants/
    │   └── roles.ts        # Role constants (ROLES, VALID_ROLES), helpers (isAdminRole, isSuperAdmin)
    ├── action-adapters/    # Action source adapter scaffold (future: NB, Action Network, ActBlue, Sosha)
    ├── api-utils.ts        # Shared API route utilities: requireAuth(), fetchProfileMap()
    ├── media-storage.ts    # Storage abstraction (only file that imports Supabase Storage for media)
    ├── signup-utils.ts     # NationBuilder API utilities
    ├── dashboard-widgets.ts # Widget IDs, permissions, constraints, layouts
    ├── avatar.ts           # Avatar upload/delete/URL utilities
    ├── ical-parser.ts      # Lightweight ICS feed parser
    ├── icon-map.ts         # Streamline icon path mapping
    ├── design-tokens.ts    # Design token definitions
    ├── UserProfileContext.tsx # React Context for user profile data (role, orgName, groupName, name, avatar)
    └── utils.ts            # General utilities
supabase/
└── migrations/             # 21 SQL migration files (001–021), run manually in Supabase SQL Editor
```

### Key architectural patterns

**Data fetching separation**
- Server components and API routes use `createClient()` from `lib/supabase/server.ts`
- Client components use `createClient()` from `lib/supabase/client.ts`
- These are never mixed — server client never imported in a client component, and vice versa

**Middleware**
- `src/middleware.ts` refreshes Supabase auth sessions on every navigation, redirects unauthenticated users to `/login`, and redirects authenticated users away from login pages

**API route structure**
- All routes require auth (`supabase.auth.getUser()`) and return 401 if no session
- New routes should use `requireAuth()` from `lib/api-utils.ts` (3 routes migrated, 40 still on inline pattern — incremental migration)
- All error responses use `NextResponse.json({ error: string })` with appropriate HTTP status
- Role checks use `lib/constants/roles.ts` constants — never hardcode role strings
- All `/api/admin/` routes have server-side role checks (`isSuperAdmin` or `isAdminRole`)

**Storage abstraction**
- All Supabase Storage calls for media go through `lib/media-storage.ts` — nowhere else
- To swap storage providers, only this file needs to change
- Storage bucket RLS policies are separate from table RLS

**SECURITY DEFINER RPC pattern**
- Used when operations need to cross RLS boundaries atomically
- `soft_delete_media_item()` — PostgreSQL evaluates ALL RLS policies (including SELECT) against the new row state during UPDATE, so soft delete must bypass this
- `increment_storage_used()` — atomic counter increment
- `create_signup_assignment()` — atomic assignment with notification creation
- `complete_action()` — atomic action completion + points ledger entry with group boundary validation. Uses custom errcodes (P0002–P0005) mapped to HTTP statuses in the API route.

**Context providers**
- `UserProfileContext` provides user role, org, group, name, and avatar data across the component tree
- Components never re-fetch this data — they consume it from context

**RLS approach**
- Group-scoped access via `get_my_group_id()` helper function used across policies
- Admin helper functions: `is_admin()`, `is_super_admin()`, `get_my_org_id()`
- Role hierarchy: super_admin > group_admin > member > supporter

### Branch strategy and deployment

| Branch | Railway Service | Purpose |
|---|---|---|
| `main` | `tectonica-ai-app` | Original app (do not push redesign changes here) |
| `v2` | `tectonica-ai-v2` | Redesigned app (all active development) |

Both services share the same Supabase database. Auto-deploy is configured on Railway.

---

## 5. Design System

### Design tokens and CSS variables

All color values flow through CSS variables defined in `globals.css` and `lib/design-tokens.ts`. No hardcoded hex values in components.

**Core tokens:**

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#d4c0fd` | Page chrome background (lavender) |
| `--card-bg` | `#ffffff` | Card surfaces |
| `--card-stroke` | `rgba(0,0,0,.08)` | Card borders |
| `--text-primary` | `#1a1a2e` | Primary text |
| `--text-secondary` | `#4a4a6a` | Secondary text |
| `--text-muted` | `#8a8aaa` | Muted text |
| `--accent-purple` | `#18181B` (neutral, pending brand decision) | Primary accent |
| `--radius` | `4px` | Default border radius |

**Dashboard background:** `#F6F4FF`

**Bot card category colors:**

| Category | Card bg | Usage |
|---|---|---|
| Advisors | `#F2F0FC` | Coral-family cards |
| Create Things | `#FBE9D8` | Warm peach cards |
| Use Organizing Tools | `#FFDADD` | Pink cards |
| Understand + Analyze | `#D7F5E6` | Mint cards |

**Widget backgrounds:** Each dashboard widget has its own `--widget-bg-*` CSS variable with pastel values from Figma designs.

**Widget typography:** Em-based sizing for responsiveness. All values in `--widget-*` CSS variables. Titles 18px bold, metrics at 31/24/15px depending on widget.

### Component library layering

The UI is built in three layers:

1. **Tremor** (`@tremor/react`) — foundational design language. KPI cards, progress bars, status blocks, charts, form layouts. Installed with `--legacy-peer-deps` due to React 19.
2. **Shadcn/ui** (`components/ui/`) — primitives: Dialog, Sheet, Button, Input, Badge, etc. Sheet for detail views and multi-field forms; Dialog for confirmations and small forms.
3. **Custom components** — app-specific components built on top of Tremor and Shadcn primitives.

### Icon system

Icons use Streamline vectors from `public/streamline-vectors-main/ultimate/regular/`. The system works as follows:

- `src/lib/icon-map.ts` — maps semantic icon names to SVG file paths
- `src/components/ui/icon.tsx` — `Icon` component with `color` prop using CSS `mask-image` technique (not `fill` or className color utilities)
- Bot card icons reference Streamline paths defined in `lib/bots.ts`
- Tremor `ProgressCircle` stroke colors are overridden via CSS custom properties (`--progress-color`, `--track-color`)

To add a new icon: add its path to `icon-map.ts`, then use `<Icon name="your-icon" />`.

### Border radius and typography

- Shadcn `--radius` base: `4px` (deliberately lower than Shadcn default)
- Badges use `rounded-full` intentionally
- Font family: Google Sans (variable, self-hosted TTF in `src/app/fonts/`)
- Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold), 800 (extra bold)

---

## 6. Features and User Stories

### Authentication and session management

Email/password signup, login, email confirmation flow, forgot/reset password. Auth callback signs out after email confirmation and redirects to login. New users automatically default to the `supporter` role and are assigned to the default group on signup.

- **All users** can sign up, log in, log out, and reset their password
- **Limitation**: Email confirmation and password reset emails are blocked until the Resend domain (`tectonica.co`) is verified via DNS

### Role-based access control

Four-tier role hierarchy: super_admin > group_admin > member > supporter. Role checks use the `profiles` table via RLS helper functions.

- **super_admin** — full access to all admin tabs (Organization, People, Goals, Bots, Integrations), can manage all org members, set org defaults
- **group_admin** — access to People and Goals tabs scoped to their group
- **member** — standard access to bots, media, messaging, hours, approvals
- **supporter** — most restricted: cannot upload media, limited dashboard widget visibility
- Role changes enforce hierarchy (cannot promote to a role equal to or above your own)

### Bot grid and featured bots

Dashboard displays 24 AI bots organized in 4 categories (Advisors, Create Things, Use Organizing Tools, Understand + Analyze) in a 6-column grid. Featured "Your Bots" carousel shows starred bots with drag-and-drop reordering via SortableJS.

- **All authenticated users** can browse bots, star/unstar favorites, reorder featured bots
- Bot names are DB-driven (admin-editable), icons use hardcoded Streamline vectors as fallback
- **Limitation**: Bot definitions are seeded via migration 009. Admin can edit names, descriptions, and system prompts via the Bots tab.

### Bot chat with streaming responses

Full chat interface with GPT-4o streaming responses via SSE. Conversations and messages persist to Supabase. Recent conversations sidebar shows chat history per bot.

- **All authenticated users** can chat with any bot
- Conversations are persisted and resumable
- Each bot has a configurable system prompt (DB-first with fallback to `lib/bots-prompts.ts`)

### Group Coach Bot

Dedicated page with two-column layout: chat (left) and campaign stats sidebar (right).

- **All authenticated users** can access via sidebar navigation
- **Limitation**: Campaign stats sidebar currently uses mock data. Needs real data sources before it is fully functional.

### Media Library

Functional file management: upload files (5MB limit, MIME validation), bookmark external links, category filters (All/Images/Videos/Documents), full-text search, grid and list views, signed URL downloads (1-hour TTL), soft delete, download counter, group storage quota (250MB) with progress bar.

- **member, group_admin, super_admin** can upload files and create link bookmarks
- **supporter** cannot upload (blocked at API level)
- **All group members** can view, search, filter, and download media
- **File owner + admins** can delete media (soft delete)
- Storage abstracted behind `lib/media-storage.ts` for provider portability
- **Limitation**: Per-file visibility UI, thumbnail generation, and virus scanning are not yet implemented (hook placeholder exists in `media-storage.ts`)

### Member directory

Group member list with search, role display, and avatars. Member detail pages at `/members/[id]`.

- **All group members** can view the directory and member profiles
- Uses `get_group_members()` RPC for group-scoped fetching

### Real-time group messaging

Group conversation overlay with live messaging powered by Supabase Realtime subscriptions.

- **All group members** can send and receive messages in real time
- Realtime subscriptions are cleaned up on component unmount

### NationBuilder integration

Read-only signup ingestion from NationBuilder v2 API. New signups appear in the dashboard Sign-Ups widget (max 2 visible) with NB icon badges. Interactive assignment workflow: click a signup to open a modal with contact, call, and assign actions. Full signups page at `/signups` with table view, search, and status badges.

- **All group members** can view recent signups in the widget and the full signups page
- **Admins** can assign signups to team members (triggers Resend email notification)
- NB data is read-only — the app never writes to NationBuilder or contacts NB people directly
- Connection status is dynamic: widget shows Functional, Error, or Not Connected based on real API state
- Widget shows "See all the (##) new signups" button linking to the full signups page
- **Limitation**: Assignment email notifications depend on Resend domain verification

### Actions system

Full CRUD for internal group actions with points tracking, assignment scoping, and self-reported completion. Actions support 8 types (petition, donation, event_rsvp, letter, phone_bank, canvass, social_share, custom) with configurable deadlines, point values, visibility, and assignment scope (all, targeted, self_assign).

- **group_admin and super_admin** can create, edit, and archive actions via the full actions page or dashboard widget
- **All group members** can view actions, complete them (self-reported), and earn points
- External actions (with URL) require clicking the CTA before "Mark as Complete" unlocks
- Self-assign actions allow members to opt in
- Points ledger tracks every completion atomically via `complete_action` SECURITY DEFINER RPC with group boundary validation
- Dashboard Group Actions widget shows top 3 actions with click-to-detail sheets
- Full page at `/actions` with scope filter (All Actions / Assigned to Me), type filter, status filter (Active / Completed / Archived — last admin-only)
- Source adapter architecture scaffolded in `lib/action-adapters/` for future external source ingestion (NationBuilder, Action Network, ActBlue, Sosha)
- **Limitation**: External source adapters not yet implemented. Targeted assignment member picker is scaffolded but not wired. API-verified completion method exists in schema but is unused. Leaderboards/points display not yet built (ledger data exists).

### Approval workflow

Submit items for admin/group_admin review with text and file attachments. Status workflow: pending, approved, or changes_requested with resubmit capability. Comment threads per approval request.

- **member and above** can submit approval requests
- **group_admin and super_admin** can review, approve, or request changes
- **Submitter** can resubmit after changes are requested
- Email notifications to reviewer on submit and to submitter on status change (via Resend)
- In-app notification bar for approval-related updates

### Volunteer hours tracking

Log volunteer hours with date, dashboard widget showing real totals, detail overlay with entries grouped by date.

- **All group members** can log their own hours and view group totals
- Hours widget on dashboard shows aggregate data
- Detail overlay accessible from the widget

### Fundraising goals

Targets (money_goal, money_budget) stored in `group_goals` table. Monthly amount_raised tracked in `fundraising_goals` table. Offline fundraising offset (`money_raised_offline`) added to displayed totals.

- **group_admin and super_admin** can edit fundraising targets via the Goals tab in the Admin Panel
- **All group members** can view fundraising progress in the dashboard widget
- **Limitation**: If no `group_goals` row exists for a group, the widget shows zeros. An admin must visit the Goals tab and save once to initialize.

### Recruitment goals

Members goal and supporters goal stored in `group_goals` table. RecruitmentGoalWidget displays dynamic DB values with donut chart visualization.

- **group_admin and super_admin** can edit recruitment targets via the Goals tab
- **All group members** can view recruitment progress
- Handles goal=0 gracefully (shows raw count, hides percentage)
- **Same first-run limitation** as fundraising goals

### Admin panel

Role-guarded panel at `/admin` with 5 tabs for super_admin, 2 tabs (People, Goals) for group_admin.

- **Organization tab** (super_admin): edit org name, manage groups (rename), edit group descriptions
- **People tab**: list members, change roles (with hierarchy enforcement), reassign groups (super_admin only), remove members, inline name editing
- **Goals tab** (group_admin + super_admin): fundraising goals (monthly target, print budget, offline offset) and recruitment goals (member/supporter targets). Inline edit pattern.
- **Bots tab** (super_admin): DB-driven bot CRUD — create, edit name/description/system prompt/category/icon, delete
- **Integrations tab** (super_admin): calendar source management (add/remove iCal feeds, toggle enable/disable, color coding), Action Sources section (NationBuilder Actions, Action Network, ActBlue, Sosha — all scaffolded as "Not Connected"), NationBuilder connection status, Action Network/Mobilize status

### Configurable dashboard grid

React Grid Layout with 3-column snap grid, vertical compaction, edit mode toggle, role-aware save, per-widget size constraints.

- **super_admin** gets "Save for me" vs "Save as org default" dialog when saving layout
- **Other roles** save directly to personal layout, can reset to org/system default
- 11 widget components, each with role-based visibility from `WIDGET_PERMISSIONS`
- Layout persistence: user layout > org default > system default (fallback chain)
- Per-widget size constraints from `WIDGET_CONSTRAINTS`

### Notification bar

Amber bar showing unread notifications for signups, approvals, and reimbursements.

- Uses real `signup_assignments` count (not stale notification records)
- Clickable signup count opens assignment lightbox
- Handles multiple notification types simultaneously

### Calendar integration and Upcoming Events widget

System-agnostic iCal/ICS feed support (Google Calendar, Outlook, Mobilize). Feeds managed by super_admin in the Integrations tab. Upcoming Events widget shows next 30 days of events (max 20).

- **super_admin** can add, remove, enable/disable, and color-code calendar feeds
- **All group members** can view upcoming events in the dashboard widget
- Uses a lightweight ICS parser (`lib/ical-parser.ts`) with no native dependencies

### Reimbursement requests

Submit reimbursement requests with amount, description, and file attachment (JPG/PNG/PDF). Approval workflow: pending, approved, or changes_requested with resubmit.

- **member and above** can submit reimbursement requests
- **super_admin** reviews and approves/requests changes
- In-app notifications to super_admin on submission
- **Limitation**: Email notifications are coded but blocked by Resend domain verification

### Activity log

Unified chronological timeline in Settings > Activity tab showing hours logged, approvals, signup assignments, and reimbursements with type tags.

- **All authenticated users** can view their own activity history

### Profile and account settings

Settings page at `/settings` with Profile tab (edit name, bio, avatar upload to Supabase Storage) and Account tab.

- **All authenticated users** can edit their profile
- Avatar upload uses Supabase Storage `avatars` bucket (2MB limit, JPEG/PNG/WebP)

### Group profile page

Page at `/group` showing group name, description, member count, organization name, and quick navigation links. Group pill in the top bar is a clickable link to this page.

- **All group members** can view their group profile
- Group description is editable by admins in the Organization tab

---

## 7. Known Issues and Roadmap

### Known issues and fragile points

- **Resend domain verification BLOCKER** — `tectonica.co` is "Not Started" in Resend. Partner must add DNS records in GoDaddy. Blocks all email-dependent flows.
- **Branch discipline** — `v2` is the active development branch. Never push to `main` — it auto-deploys the original app on Railway.
- **Auth race conditions** — Client components (RightSidebar, NotificationBar, TopBar) receive 401s during unauthenticated initial load. Error handling exists but should be verified when modifying these components.
- **Group goals first-run** — Widgets show zeros until an admin visits the Goals tab and saves once to create the `group_goals` row.
- **Bot icon field mismatch** — DB bot records store old Material Icons strings. `getBots()` merges DB names with hardcoded Streamline icons as fallback.
- **`--accent-purple` still neutral** — Set to `#18181B`, awaiting brand color decision.
- **`SparkAreaChart` default color** — Uses Tremor `"emerald"` default, needs custom color pass.
- **Container query breakpoint** — Button breakpoint at `350px` may need tuning if grid column widths change.
- **Base UI hydration warning** — Pre-existing console warning with id mismatch on Input components. Cosmetic only.
- **LEGACY `fundraising_goals` columns** — `fundraising_goal` and `print_budget` columns are superseded by `group_goals` equivalents. Not dropped, just no longer the display source.
- **LeadersChat and CampaignStats** — These components have empty arrays for contacts/messages and goals/notes/events respectively. They need real data sources.
- **Supabase auth rate limiting** — Heavy HMR reloads during development can trigger rate limits.

### Roadmap — next priorities

**Features:**
- Actions: external source adapters (NationBuilder actions, Action Network, ActBlue, Sosha), targeted assignment member picker, API-verified completions, leaderboards/points display
- Media Library: per-file visibility UI, thumbnail generation, virus scanning
- Group Coach Bot with real campaign data (currently mock stats)
- Graphics Creation bot with visual editor iframe integration
- Leaders & Organizers real-time chat (UI exists, needs real-time backend)
- Group Admin features (invitations, recruiter IDs, /join flow)

**Integrations:**
- Action Network API connection (action source adapter + signup ingestion)
- Mobilize API connection
- Image generation for Graphics Creation bot
- Resend domain verification (partner action required)

**Platform:**
- Multi-tenancy (multiple orgs/groups — database schema supports it, UI is currently single-group)
- Configurable bot system prompts per org (admin can already edit via Bots tab)
- Mobile responsive layout (desktop-first, mobile out of scope for now)

### QA status

**Tested and passed:** US-03 (Login), US-04 (Logout), US-06 (Edit Profile), US-07 (Member Permissions), US-08 (Group Admin), US-09 (Super Admin), US-10 (Role Change), US-11 (Supporter Visibility).

**Remaining:** US-12 through US-30 still need testing.
