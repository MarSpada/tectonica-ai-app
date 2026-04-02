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
- All routes that require auth call `supabase.auth.getUser()` first and return 401 if no session
- Role checks use the `profiles` table, not JWT claims directly

### Types
- All shared types live in `lib/types.ts` — never define types inline in components
- Never use `any` — if the shape is unknown, define a type for it

### Components
- User role/org/group data comes from `UserProfileContext` — never re-fetch it inside a component
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

### 10. Settings Page (`/settings`)
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
- **AI**: OpenAI GPT-4o (streaming SSE via API routes)
- **Email**: Resend (transactional emails for signups, approvals, notifications)
- **Animations**: GSAP entrance transitions + stagger animations
- **Integrations**: NationBuilder v2 API (read-only signup ingestion), iCal/ICS calendar feeds
- **Deployment**: Railway (auto-deploy from `main` branch)

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key |
| `OPENAI_API_KEY` | OpenAI API key for GPT-4o bot chat |
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

---

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/chat` | POST | Streams GPT-4o responses, persists conversations + messages to Supabase |
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
| `/api/fundraising` | GET/PATCH | GET: current month's fundraising goal for user's group. PATCH: update goal/budget (admin only, upserts) |
| `/api/reimbursements` | GET/POST | GET: list reimbursement requests for group. POST: create request (RPC + notification to super_admin) |
| `/api/reimbursements/[id]/status` | POST | Approve or request changes on reimbursement (reviewer only) |
| `/api/reimbursements/[id]/resubmit` | POST | Resubmit after changes requested (submitter only) |
| `/auth/callback` | GET | OAuth/email confirmation callback — signs out after confirmation, redirects to login |
| `/auth/reset-callback` | GET | Password reset callback — exchanges PKCE code, redirects to /reset-password |

---

## Key Components

| Component | Description |
|---|---|
| `AppShell.tsx` | Main layout: TopBar + NotificationBar + LeftSidebar + content |
| `TopBar.tsx` | Header with dynamic org/group names from DB + Tectonica.AI logo |
| `LeftSidebar.tsx` | Navigation, bot chats list, user info footer |
| `RightSidebar.tsx` | 12-column widget grid dashboard with live NB signups, events, hours, group chat |
| `NotificationBar.tsx` | Amber bar for unread signup/approval notifications |
| `BotGrid.tsx` | Featured carousel + categorized bot card grid with GSAP |
| `BotCard.tsx` | Individual bot card with star/favorite, hover description |
| `WelcomeHelper.tsx` | Welcome bot chat on dashboard |
| `DashboardShell.tsx` | Dashboard layout container |
| `chat/ChatView.tsx` | Bot chat with streaming, conversation persistence |
| `chat/ChatHeader.tsx` | Bot name, status, back button |
| `chat/ChatInput.tsx` | Message input with send button |
| `chat/MessageList.tsx` | Scrollable message history |
| `chat/RecentConversations.tsx` | Sidebar of recent bot chats |
| `coach/CoachChatView.tsx` | Group Coach Bot with campaign stats sidebar |
| `coach/CampaignStats.tsx` | Campaign goals, strategy notes, upcoming events sidebar |
| `media/MediaGallery.tsx` | Media gallery with filters, grid/list view |
| `signups/NbSignupModal.tsx` | NB signup detail modal with contact/call/assign actions |
| `members/MemberDirectory.tsx` | Group member list with roles and search |
| `members/MemberDetailModal.tsx` | Member detail popup |
| `members/MemberProfile.tsx` | Member profile card |
| `admin/AdminView.tsx` | Main admin tab container with role guard |
| `admin/OrgTab.tsx` | Organization settings (name, details) |
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

---

## Key Lib Files

| File | Description |
|---|---|
| `lib/types.ts` | Type definitions: UserRole, Message, Conversation, Member, GroupMessage, NbSignup, SignupAssignment, AppNotification, ApprovalRequest, ApprovalComment, FundraisingGoal, ReimbursementRequest, etc. |
| `lib/bots.ts` | Hardcoded bot definitions: 24 bots with metadata (id, name, icon, category, description), categoryMeta colors, defaultFeaturedBotIds |
| `lib/bots-prompts.ts` | Bot system prompts mapped by bot ID, falls back to generic prompt |
| `lib/bot-resolver.ts` | getBots() (DB-first, fallback to hardcoded), getSystemPrompt() (DB-first, fallback to bots-prompts.ts) |
| `lib/ical-parser.ts` | Lightweight ICS parser (no native deps) — handles DTSTART/DTEND with TZID, line unfolding, escaped chars |
| `lib/avatar.ts` | Avatar utilities (upload, delete, generate URL) for Supabase Storage |
| `lib/signup-utils.ts` | NationBuilder signup utilities (fetch, parse, enrich). Returns connection status (connected/error/not_configured) |
| `lib/UserProfileContext.tsx` | React Context for user profile data (role, org, group, name, avatar) |
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
- Bot chat with GPT-4o streaming responses + conversation persistence
- Group Coach Bot page with campaign stats sidebar
- Media gallery (mock data, UI functional)
- Member directory with RPC-based group member fetching + member detail pages
- Profile settings (name, bio, avatar upload)
- Real-time group messaging (Supabase Realtime)
- NationBuilder integration (read-only signup ingestion with NB icon badges)
- Interactive NB signup assignments (click → modal → contact/call/assign)
- Email notifications via Resend (signups, approvals, status changes)
- In-app notification bar for signup assignments and approvals
- **Super Admin Panel** — org settings, people management (roles, groups, inline name editing), DB-driven bot management, integrations
- **Approval workflow** — submit, review, approve/request changes, resubmit, comment threads
- **Calendar integration** — system-agnostic iCal/ICS feeds (Google Calendar, Outlook, Mobilize), managed in admin Integrations tab
- **Upcoming Events widget** — pulls from connected calendar feeds, shows next 30 days
- **Volunteer hours tracking** — log hours, view detail overlay with entries by date, dashboard widget with real totals
- **Dynamic top bar** — org name and group name fetched from DB, update when admin changes them
- **Connected Systems widget** — dynamic: NB shows real status (Functional/Error/Not Connected), Calendar reflects live feed state, Action Network/Mobilize: Not Connected
- **Fundraising goals** — per group/month, admin-editable inline in widget and in admin panel, real data from DB
- **Reimbursement requests** — submit with amount/description/attachment, approval workflow (pending→approved/changes_requested→resubmit), notifications to super_admin
- **Activity log** — unified chronological timeline in Settings > Activity tab showing hours, approvals, signups, reimbursements with type tags
- **Notification bar** — handles multiple notification types simultaneously (signups, approvals, reimbursements), uses real signup_assignments count, clickable signup count opens lightbox
- **Group profile page** — `/group` route showing group name, description, member count, quick links. Group pill in top bar is clickable link.
- **Group descriptions** — admin can edit in Organization tab, visible on group profile page
- **Sidebar role display** — shows dynamic user role instead of hardcoded "Settings"
- **Default signup role** — new users default to 'supporter' (lowest privilege)
- GSAP entrance animations throughout
- Deployed on Railway with auto-deploy from main

## What Still Needs Work (Prioritized)

### Priority — Next Features
- Media gallery with real file upload (currently mock data)
- Group Coach Bot with real campaign data (currently mock stats)
- Graphics Creation bot with visual editor iframe integration
- Leaders & Organizers real-time chat (UI exists, needs real-time backend)
- Group Admin features (invitations, recruiter IDs, /join flow)

### Priority — Integrations
- Action Network API connection
- Mobilize API connection
- Image generation for Graphics Creation bot
- Custom SMTP for Supabase Auth — Resend SMTP is configured in Supabase but `tectonica.co` domain is unverified in Resend. Partner needs to add DNS records in GoDaddy.

### Priority — Platform
- Multi-tenancy (multiple orgs/groups — schema supports it, UI is single-group)
- Configurable bot system prompts per org (admin can already edit via Bots tab)
- Mobile responsive layout (desktop-first, mobile out of scope for now)

## Known Issues / Next Session

- Client components that call GET routes (RightSidebar, NotificationBar,
  TopBar) now receive 401s when unauthenticated. Verify they handle
  error responses gracefully and don't throw uncaught errors during
  auth load race conditions.
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

---

## UI Improvement Sessions

### UI Session A — Design token consolidation
Status: Complete
Goal: Centralise all design tokens into lib/design-tokens.ts and tailwind.config.ts. Replace all hardcoded hex/rgba values in components with token references. No visual changes.

### UI Session B — Shadcn/ui introduction
Status: Complete
Goal: Replace admin panel table, tabs, modals, and dropdowns with Shadcn components themed with existing design tokens.

### UI Session B.5 — Complete Shadcn rollout
Status: Complete
Goal: Extend Shadcn components to the remaining parts of the app flagged in the Session B scan. Same principles as Session B — preserve functionality, improve with judgment.

Known gotchas from Sessions B and B.5:
- Shadcn Button uses render prop for polymorphism, not asChild — keep this in mind for buttons that wrap anchor elements
- Shadcn Select onValueChange can pass null — wrap with fallback when using with string state setters
- GroupConversationOverlay is a persistent sidebar, not a modal — Sheet conversion is inappropriate
- StatusBadge.tsx is a thin wrapper around Shadcn Badge — use it for approval statuses
- Textareas remain hand-rolled (no Shadcn Textarea installed)
- RightSidebar widget buttons use ghost/outline only — never default variant inside widgets

### UI Session C — Tremor dashboard widgets
Status: Ready to run
Goal: Rebuild right sidebar widget content using Tremor components themed with existing design tokens. Same improvement principles as Sessions B and B.5 — preserve functionality, improve with judgment.

Context from B and B.5 handovers:
- All Shadcn primitives are in src/components/ui/ — import from there, do not reinstall
- Read components.json before starting to confirm what is installed
- Widget background colors are in lib/design-tokens.ts as WIDGET_BG_* constants and as CSS vars (var(--widget-bg-signups) etc.)
- Role-based widget visibility is in lib/dashboard-widgets.ts — do not hardcode role checks in widget components
- Border radius: Shadcn --radius base is intentionally low — do not override per-component unless there is a specific design reason
- Badges use rounded-full intentionally — do not change
- Chat send buttons, tab toggles, filter pills, and card clicks are intentionally left as raw elements
- Sheet (side="right") for detail views, Dialog for confirmations — see Overlays convention

### UI Session D — Configurable dashboard grid
Status: Depends on UI Session C
Goal: Introduce React Grid Layout for drag/resize/persist. Wire to database. Use lib/dashboard-widgets.ts for permissions, constraints, and default layout.
Key behaviour:
- Auto-save on drag end with subtle "Layout saved" toast
- User layouts never overwritten by org default changes
- Role-invisible widgets disappear and gap closes
- Rearrangement and resizing applies to right sidebar only
- Resize is constrained by WIDGET_CONSTRAINTS per widget
