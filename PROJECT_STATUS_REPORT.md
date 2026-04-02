# Tectonica.AI — Project Status Report

**Date:** March 6, 2026

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS 4 + design token CSS variables |
| Database | Supabase PostgreSQL with RLS, Realtime, Storage |
| Auth | Supabase Auth (email/password, email confirmation) |
| AI | OpenAI GPT-4o (streaming SSE via API routes) |
| Email | Resend (transactional assignment notifications) |
| Animations | GSAP entrance transitions + stagger animations |
| Integrations | NationBuilder v2 API (read-only signup ingestion) |
| Deployment | Railway (auto-deploy from `main` branch) |

---

## What's Working

### Core Platform
- Email/password authentication with email confirmation flow
- Role-based user profiles (admin, organizer, leader, member, supporter)
- Organization > Group > User hierarchy with RLS-enforced data isolation
- Profile settings page (name, bio, avatar upload to Supabase Storage)
- Deployed and running on Railway with auto-deploy from `main`

### Bot System (20 bots across 4 categories)
- Full bot grid dashboard with category-colored cards (Advisors, Create Things, Use Organizing Tools, Understand + Analyze)
- Star/favorite system with persistent ordering
- Bot chat with GPT-4o streaming responses (SSE)
- Conversation persistence (create, resume, list recent)
- Group Coach Bot page with campaign stats sidebar
- All 20 bots have system prompts configured

### Dashboard Widgets (Right Sidebar)
- 12-column responsive widget grid matching prototype design
- **New Sign-Ups** — Live data from NationBuilder API with NB icon badges
- **Group Conversations** — Real-time group messaging (Supabase Realtime)
- **Group Directory** — Member list from database with roles/avatars
- **Connected Systems** — NationBuilder (green/Functional), Action Network + Mobilize (orange/Issues Found)
- Recruit More People, Group Actions, Fundraising, Recruitment Goal, Request Approval, Hours Volunteered (static/mock)

### NationBuilder Integration (Read-Only)
- Fetches last 3 signups from NB v2 API
- Clickable signups open detail modal (name, email, phone, signup time)
- Urgency banner for signups older than 24 hours
- Contact (mailto:) and Call (tel:) action buttons
- Assign to team member dropdown (admin/organizer/leader/member roles)
- Auto-assigns unassigned signups to first admin
- Email notification to assignee via Resend
- In-app notification bar on login for assigned signups

### Real-Time Features
- Group conversation messaging with Supabase Realtime subscriptions
- Paginated message history with optimistic UI updates

### UI/UX
- Light pastel "Google Labs" design theme matching prototype
- GSAP entrance animations (stagger, fade-in, slide)
- Responsive left sidebar (collapse at 899px, drawer at 699px)
- Media gallery page (UI functional with mock data)
- Member directory with detail modals
- Leaders & Organizers chat panel (UI exists)

---

## Database (7 Migrations)

| Tables | Purpose |
|---|---|
| organizations, groups | Multi-tenancy structure |
| profiles | User profiles extending Supabase Auth |
| bots, conversations, messages | Bot chat system |
| user_favorite_bots | Star/favorite ordering |
| media | File gallery |
| group_messages | Real-time group chat |
| signup_assignments | NB signup > member assignments |
| notifications | In-app notification system |

---

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/chat` | POST | Streams GPT-4o responses, persists conversations + messages |
| `/api/favorites` | GET/POST | Fetch, add, remove user's favorite/starred bots |
| `/api/nationbuilder/signups` | GET | Fetches NB signups, auto-assigns, returns with assignments |
| `/api/signups/assign` | POST | Assigns NB signup to team member + Resend email |
| `/api/notifications` | GET | Unread notifications for current user |
| `/api/notifications/read` | POST | Mark notifications as read |
| `/auth/callback` | GET | Email confirmation callback (signs out, redirects to login) |

---

## What's Not Yet Functional

| Feature | Status |
|---|---|
| Media gallery file upload | UI done, needs real upload logic |
| Group Coach campaign data | UI done, uses mock stats |
| Graphics Creation visual editor | Not integrated (iframe URL exists) |
| Leaders & Organizers real-time chat | UI exists, needs real-time backend |
| Action Network integration | Not started |
| Mobilize integration | Not started |
| Super Admin Panel | Spec written, not started |
| Group Admin features | Spec written, not started |
| Mobile responsive layout | Desktop-first, mobile out of scope |
| Multi-group switching | Schema supports it, UI is single-group |
| Configurable bot prompts per org | Prompts are global, not per-org |

---

## Environment Variables (Required on Railway)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key |
| `OPENAI_API_KEY` | OpenAI API key for GPT-4o bot chat |
| `NATIONBUILDER_API_TOKEN` | NationBuilder v2 API Bearer token |
| `NATIONBUILDER_SLUG` | NationBuilder subdomain slug |
| `RESEND_API_KEY` | Resend email API key |

---

## Test Users

| Email | Role | Password |
|---|---|---|
| mar@tectonica.co | admin | (original) |
| mar.isabel.spada@gmail.com | member | macrigato |
