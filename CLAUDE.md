# Tectonica.AI — Movement Intelligence App

## What This Is

The functional version of Tectonica.AI's **Movement Intelligence** platform — an AI-powered suite of bots for political and social movement organizing. This app is being built based on a static prototype located at [github.com/MarSpada/tectonica.ai-future](https://github.com/MarSpada/tectonica.ai-future).

**The prototype is the design reference.** When in doubt about how something should look or behave, consult the prototype's `index.html`, `styles.css`, and `main.js`.

## Prototype Overview

The prototype is a desktop-only, non-functional mockup (vanilla HTML/CSS/JS, no build step) deployed on Railway. It demonstrates the full UI: bot grid, bot chat with AI responses, Group Coach Bot page, Group Media gallery, right sidebar dashboard widgets, and a visual image editor embedded via iframe for the Graphics Creation bot.

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
| `--radius` | `8px` | Default border radius |
| `--radius-sm` | `6px` | Small radius |
| `--radius-lg` | `12px` | Large radius |

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
- Left: sidebar collapse button, org icon (orange rounded square with "P"), org name "People's Movement" (clickable — returns to dashboard), "Group Name" pill
- Right: Tectonica.AI logo (`images/logo-color.png`)

### Left Sidebar (180px)
- Nav items: **Group Coach Bot**, **Group Media**
- **Leaders & Organizers** chat button (opens slide-in panel)
- **Bot Chats** section: search input + list of recent bot chats (Graphics Creation, Canvassing Planner, Events Planning)
- User info at bottom: avatar, name "Ned Howey", role "Organizer", settings gear
- Collapses to 64px icon-only at 899px, becomes overlay drawer at 699px

### Main Content
- Header: "Welcome back, Ned. Choose a bot to get started."
- **Your Bots** (featured): horizontal scrollable carousel, 5 per row, ~15% larger than grid cards, SortableJS drag-and-drop reordering
- **Bot categories**: 6-column grid of bot cards grouped under category headers

### Right Sidebar ("Group Dashboard")
- 12-column CSS grid with explicit row/column placement
- Widgets: New Sign-Ups, Recruit More People, Group Conversations, Group Actions, Fundraising, Recruitment Goal, Request Approval, Connected Systems, Hours Volunteered, Group Directory

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

- **User**: Ned Howey (Organizer)
- **Organization**: People's Movement
- **Group members** (directory): Ned Howey, Sara Chen, Marcus Rivera, Jasmine Okafor, David Park, Lucia Torres

---

## Connected Systems (integrations)

- Action Network
- NationBuilder
- Mobilize

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
- **Email**: Resend (transactional emails for signup assignment notifications)
- **Animations**: GSAP entrance transitions + stagger animations
- **Integrations**: NationBuilder v2 API (read-only signup ingestion)
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
| `/auth/callback` | GET | OAuth/email confirmation callback — signs out after confirmation, redirects to login |

---

## Key Components

| Component | Description |
|---|---|
| `AppShell.tsx` | Main layout: TopBar + NotificationBar + LeftSidebar + content |
| `TopBar.tsx` | Header with org info + Tectonica.AI logo |
| `LeftSidebar.tsx` | Navigation, bot chats list, user info footer |
| `RightSidebar.tsx` | 12-column widget grid dashboard with live NB signups |
| `NotificationBar.tsx` | Amber bar for unread signup assignment notifications |
| `BotGrid.tsx` | Featured carousel + categorized bot card grid with GSAP |
| `BotCard.tsx` | Individual bot card with star/favorite, hover description |
| `chat/ChatView.tsx` | Bot chat with streaming, conversation persistence |
| `coach/CoachChatView.tsx` | Group Coach Bot with campaign stats sidebar |
| `media/MediaGallery.tsx` | Media gallery with filters, grid/list view |
| `signups/NbSignupModal.tsx` | NB signup detail modal with contact/call/assign actions |
| `members/MemberDirectory.tsx` | Group member list with roles and avatars |
| `GroupConversationOverlay.tsx` | Real-time group messaging overlay |
| `LeadersChat.tsx` | Slide-in leaders & organizers chat panel |

---

## What's Working (Functional)

- Auth (email/password signup, login, email confirmation, session management)
- Role-based profiles (admin, organizer, leader, member, supporter) with group assignment
- Dashboard with 20 bot cards in 4 categories, star/favorite system
- Bot chat with GPT-4o streaming responses + conversation persistence
- Group Coach Bot page with campaign stats sidebar
- Media gallery (mock data, UI functional)
- Member directory with RPC-based group member fetching
- Profile settings (name, bio, avatar upload)
- Real-time group messaging (Supabase Realtime)
- NationBuilder integration (read-only signup ingestion with NB icon badges)
- Interactive NB signup assignments (click → modal → contact/call/assign)
- Email notifications to assignees via Resend
- In-app notification bar for assigned signups
- Connected Systems widget (NB: Functional, Action Network/Mobilize: Issues Found)
- GSAP entrance animations throughout
- Deployed on Railway with auto-deploy from main

## What Still Needs Work (Prioritized)

### Immediate — Auth & Onboarding Fixes
1. **Forgot password flow** — "Forgot password?" link on login → reset email → /reset-password page → `supabase.auth.updateUser({ password })`. Critical for real users.
2. **Login page `?confirmed=true` message** — Show "Email confirmed! Please log in." when redirected from auth callback
3. **Custom SMTP for Supabase Auth** — Replace Supabase's built-in SMTP (rate-limited ~3-4 emails/hr) with Resend SMTP or similar. Configure in Supabase Dashboard → Authentication → SMTP Settings.
4. **New user onboarding** — Currently new signups get a profile but no group/org assignment. Need a flow to assign them (admin invite, or auto-join default group).

### Next Session — Super Admin Panel (spec written)
- **Phase A**: Role hierarchy migration (`admin` → `super_admin` + `group_admin`), admin route guard, tab shell at /admin
- **Phase B**: Organization tab (edit org name, manage groups) + People tab (role changes, remove members, group reassignment)
- **Phase C**: Bots tab (bot_configs table, DB-driven bots replacing hardcoded bots.ts, API key management with server-side encryption)
- **Phase D**: Group Admin features (invitations, recruiter IDs, /join flow, member role management from directory)

### Priority — Next Features
- Media gallery with real file upload (currently mock data)
- Group Coach Bot with real campaign data (currently mock stats)
- Graphics Creation bot with visual editor iframe integration
- Leaders & Organizers real-time chat (UI exists, needs real-time backend)

### Priority — Integrations
- Action Network API connection
- Mobilize API connection
- Image generation for Graphics Creation bot

### Priority — Platform
- Multi-tenancy (multiple orgs/groups — schema supports it, UI is single-group)
- Configurable bot system prompts per org
- Mobile responsive layout (desktop-first, mobile out of scope for now)
