# Movement Intelligence App — Build Plan

This is the step-by-step plan for building the functional version of the Movement Intelligence platform. Each phase should be tackled in order. Give Claude one phase at a time and wait for it to finish before starting the next.

The **design reference** is the static prototype at [github.com/MarSpada/tectonica.ai-future](https://github.com/MarSpada/tectonica.ai-future). When the plan says "match the prototype", it means replicate the look, layout, and behavior from that codebase.

---

## Phase 0: Project Scaffolding

**Prompt to give Claude:**

> Set up a Next.js 14+ app with TypeScript, Tailwind CSS, and the App Router. Install these dependencies:
> - `@supabase/supabase-js` and `@supabase/ssr` for auth and database
> - `@anthropic-ai/sdk` for the Claude AI API
> - `framer-motion` for animations (replaces GSAP from the prototype)
> - `@dnd-kit/core` and `@dnd-kit/sortable` for drag-and-drop (replaces SortableJS)
>
> Create a `.env.local` with these placeholders:
> ```
> NEXT_PUBLIC_SUPABASE_URL=
> NEXT_PUBLIC_SUPABASE_ANON_KEY=
> ANTHROPIC_API_KEY=
> ```
>
> Set up this folder structure:
> ```
> /app                    — Next.js App Router pages
>   /layout.tsx           — Root layout with font, providers
>   /page.tsx             — Dashboard (main landing)
>   /login/page.tsx       — Login page
>   /chat/[slug]/page.tsx — Bot chat view
>   /coach/page.tsx       — Group Coach Bot page
>   /media/page.tsx       — Group Media gallery
>   /api/chat/route.ts    — AI chat streaming endpoint
> /components
>   /layout/              — TopBar, Sidebar, RightSidebar
>   /bots/                — BotCard, BotGrid, FeaturedCarousel
>   /chat/                — ChatMessages, ChatInput, ChatHistory
>   /dashboard/           — All right sidebar widgets
>   /ui/                  — Shared UI components (Button, Badge, etc.)
> /lib
>   /supabase.ts          — Supabase client setup
>   /bots.ts              — Bot definitions (names, categories, icons, prompts)
>   /types.ts             — TypeScript types
> /public
>   /fonts/               — Google Sans TTF files
>   /images/              — Logo, avatars
> ```
>
> Don't build any UI yet — just the skeleton with placeholder pages that say the page name.

**What this achieves:** Clean foundation. Everything after builds on this structure.

---

## Phase 1: Design System & Base Layout

**Prompt to give Claude:**

> Build the design system and base layout shell. Reference the prototype at github.com/MarSpada/tectonica.ai-future for exact colors and spacing.
>
> **1a. Tailwind config** — extend with these exact design tokens:
>
> Colors:
> - `bg: '#E3D1FF'` (page background, light lavender)
> - `card-bg: '#ffffff'`
> - `card-stroke: 'rgba(0,0,0,.08)'`
> - `sidebar-bg: '#E3D1FF'` (matches page bg)
> - `sidebar-active: '#6B3FA0'` (dark purple)
> - `text-primary: '#1a1a2e'`
> - `text-secondary: '#4a4a6a'`
> - `text-muted: '#6b6b8a'`
> - `accent-orange: '#FD883C'`
> - `accent-green: '#05C168'`
> - `accent-green-text: '#0A8A4A'`
> - `accent-blue: '#4E7CF6'`
> - `accent-purple: '#7C3AED'`
> - `accent-pink: '#E04EBA'`
> - `accent-cyan: '#22D3EE'`
>
> Category colors (for bot cards):
> - `cat-organizer: '#FFB5A7'` (coral) — Advisors
> - `cat-organizer-circle: '#E89485'`
> - `cat-content: '#A8D8EA'` (sky blue) — Create Things
> - `cat-content-circle: '#7FC4DB'`
> - `cat-fundraising: '#B5EAD7'` (mint) — Use Organizing Tools
> - `cat-fundraising-circle: '#8DD4BC'`
> - `cat-admin: '#FFDAC1'` (peach) — Understand + Analyze
> - `cat-admin-circle: '#F0B88A'`
>
> Border radii: `sm: 6px`, `DEFAULT: 8px`, `lg: 12px`, `xl: 20px` (for bot cards)
>
> **1b. Google Sans font** — self-hosted variable TTF (copy from prototype repo). Set as default font family.
>
> **1c. Material Icons** — add Google Fonts CDN link for Material Icons Two Tone: `https://fonts.googleapis.com/css?family=Material+Icons+Two+Tone&display=swap`
>
> **1d. Root layout** (`app/layout.tsx`) — the 3-column layout shell:
> - Top bar: height ~48px, background `#B3BBEE`, flex row
>   - Left: sidebar collapse button (SVG: rectangle with vertical line), org icon (28x28 orange rounded square with "P"), org name "People's Movement" (clickable, returns to dashboard), pill "Group Name"
>   - Right: Tectonica.AI logo image
> - Left sidebar: 180px width, background matches page bg (`#E3D1FF`), seamless
>   - Nav items: "Group Coach Bot" (chat bubble SVG icon), "Group Media" (image/landscape SVG icon)
>   - "Leaders & Organizers" button (purple pill, opens chat panel)
>   - "BOT CHATS" section: search input + list items (Graphics Creation, Canvassing Planner, Events Planning)
>   - User info at bottom: avatar, "Ned Howey", "Organizer", settings gear
> - Main content: flex-grow, `overflow-x: hidden`, scrollable
> - Right sidebar: `width: clamp(340px, 42vw, 780px)`, scrollable
>
> Make the sidebar collapse work:
> - Normal: 180px with text labels
> - Collapsed: 64px with only icons
> - Below 699px: hidden, slides in as overlay drawer
>
> For now, main content and right sidebar can just have placeholder text.

**What this achieves:** The visual shell of the app, pixel-accurate to the prototype.

---

## Phase 2: Supabase Auth & Database

**Prompt to give Claude:**

> Set up Supabase authentication and database schema. My Supabase project URL is [PASTE_YOUR_URL] and anon key is [PASTE_YOUR_KEY].
>
> **2a. Auth:**
> - Email/password login using Supabase Auth
> - Create a login page at `/login` with email + password form, styled to match our design system (lavender bg, white card, purple accent button)
> - Middleware to protect all routes except `/login` — redirect unauthenticated users to `/login`
> - Store user session, make it available via a React context/provider
>
> **2b. Database tables** (create via Supabase SQL editor or migrations):
>
> ```sql
> -- Organizations
> create table organizations (
>   id uuid primary key default gen_random_uuid(),
>   name text not null,
>   slug text unique not null,
>   created_at timestamptz default now()
> );
>
> -- Groups within organizations
> create table groups (
>   id uuid primary key default gen_random_uuid(),
>   org_id uuid references organizations(id),
>   name text not null,
>   created_at timestamptz default now()
> );
>
> -- User profiles (extends Supabase auth.users)
> create table profiles (
>   id uuid primary key references auth.users(id),
>   org_id uuid references organizations(id),
>   group_id uuid references groups(id),
>   full_name text not null,
>   role text default 'member', -- 'organizer', 'leader', 'member', 'supporter'
>   avatar_url text,
>   created_at timestamptz default now()
> );
>
> -- Bot conversations
> create table conversations (
>   id uuid primary key default gen_random_uuid(),
>   user_id uuid references auth.users(id),
>   bot_slug text not null,
>   title text,
>   messages jsonb default '[]'::jsonb,
>   created_at timestamptz default now(),
>   updated_at timestamptz default now()
> );
>
> -- Media files
> create table media (
>   id uuid primary key default gen_random_uuid(),
>   group_id uuid references groups(id),
>   uploaded_by uuid references auth.users(id),
>   filename text not null,
>   file_type text not null, -- 'image', 'video', 'document'
>   url text not null,
>   size_bytes bigint,
>   created_at timestamptz default now()
> );
>
> -- Group messages (for group conversation)
> create table group_messages (
>   id uuid primary key default gen_random_uuid(),
>   group_id uuid references groups(id),
>   user_id uuid references auth.users(id),
>   content text not null,
>   created_at timestamptz default now()
> );
> ```
>
> **2c. Seed data:**
> ```sql
> insert into organizations (name, slug) values ('People''s Movement', 'peoples-movement');
>
> insert into groups (org_id, name)
> select id, 'Group Name' from organizations where slug = 'peoples-movement';
> ```
>
> After signing up a user manually in the Supabase dashboard, insert their profile:
> ```sql
> insert into profiles (id, org_id, group_id, full_name, role)
> select
>   '[USER_AUTH_ID]',
>   o.id,
>   g.id,
>   'Ned Howey',
>   'organizer'
> from organizations o
> join groups g on g.org_id = o.id
> where o.slug = 'peoples-movement';
> ```
>
> **2d. Row-level security:** Enable RLS on all tables. Users can only read/write data belonging to their org/group. Conversations are private to the user who created them.
>
> **2e. Update the layout** to show the logged-in user's name and role in the sidebar (from the profiles table), instead of hardcoded "Ned Howey".

**What this achieves:** Real authentication, database ready, user can log in and see their name.

---

## Phase 3: Bot Definitions & Card Grid

**Prompt to give Claude:**

> Create the bot definitions data file and build the dashboard bot grid. Reference the prototype for exact look and feel.
>
> **3a. Bot definitions** — create `/lib/bots.ts` with ALL bots organized by category. Each bot has: `slug`, `name`, `category`, `icon` (Material Icons Two Tone name), `description`, `systemPrompt`.
>
> Here are all the bots:
>
> **Category: "Advisors"** (color: coral `#FFB5A7`, circle: `#E89485`)
> | Bot Name | Icon | Description | System Prompt |
> |---|---|---|---|
> | Getting Started + Help | `help_outline` | Onboarding guide, FAQs, and step-by-step help for new group leaders | You are the Getting Started + Help Bot. You help new organizers get oriented... |
> | Local Strategy Planning | `map` | Develop local campaign strategies, identify targets, plan tactical actions | You are the Local Strategy & Tactics Bot... |
> | Recruitment Planning | `person_add` | Recruit new volunteers, members, and supporters with pitches and onboarding | You are the Recruitment Bot... |
> | Action Planning | `flag` | Plan and coordinate direct actions, protests, and campaign events | You are the Action Planning Bot... |
> | Events Planning + Management | `event` | Create events, send invites, track RSVPs, manage day-of logistics | You are the Events Management Bot... |
> | Relationship/Contact Mng | `contacts` | Manage contact databases, track interactions, maintain relationships | You are the Relationship / Contacts Management Bot... |
> | Group Leadership Coach | `groups` | AI coaching for group leaders — strategy guidance, feedback, best practices | You are the Group Leadership Coach... |
> | Group Fundraising | `paid` | Plan and execute distributed fundraising campaigns | You are the Distributed Fundraising Bot... |
> | Canvassing Planner | `directions_walk` | Plan door-to-door routes, manage walk lists, log canvass results | You are the Field / Canvassing Bot... |
>
> **Category: "Create Things"** (color: sky blue `#A8D8EA`, circle: `#7FC4DB`)
> | Bot Name | Icon | Description |
> |---|---|---|
> | Graphics Creation | `palette` | Design graphics, social media cards, posters, and visual assets |
> | Written Content | `description` | Write emails, social posts, press releases, speeches, talking points |
> | Distributed Email | `email` | Create and manage email campaigns and distribution |
> | Set-Up/Manage Group Webpage | `web` | Create and manage campaign websites and landing pages |
> | Video Creation | `videocam` | Create video content — scripts, storyboards, editing, distribution |
>
> **Category: "Use Organizing Tools"** (color: mint `#B5EAD7`, circle: `#8DD4BC`)
> | Bot Name | Icon | Description |
> |---|---|---|
> | Ad Placement | `ads_click` | Create, review, and distribute ads across platforms |
> | Social Media | `share` | Manage social media presence and content strategy |
> | Tech Tools How-To | `build` | Learn and effectively use technology tools for campaigns |
> | Targeted Advocacy | `campaign` | Plan targeted advocacy — identify decision-makers, coordinate pressure |
>
> **Category: "Understand + Analyze"** (color: peach `#FFDAC1`, circle: `#F0B88A`)
> | Bot Name | Icon | Description |
> |---|---|---|
> | Creating People Power | `volunteer_activism` | Organizing knowledge center — principles, training, best practices |
> | Recruitment Progress | `trending_up` | Track and visualize recruitment metrics and engagement |
> | Email Performance | `mark_email_read` | Analyze email campaign performance and optimize |
> | Networks/Resources/Orgs | `hub` | Identify allied organizations, shared resources, coalition networks |
> | Group Decision Making | `how_to_vote` | Facilitate collaborative decision-making and consensus |
>
> Copy the full system prompts from the prototype's `main.js` `BOT_PROMPTS` object. For any bot that doesn't have an explicit system prompt in the prototype, write a similar one following the same pattern.
>
> **3b. Bot Card component** (`/components/bots/BotCard.tsx`):
> - `aspect-ratio: 3/4` (tall portrait)
> - Solid pastel background based on category
> - 56px colored circle with Material Icons Two Tone icon inside (icon color: `rgba(0,0,0,.45)`)
> - Bot name below (font-size ~0.85rem, font-weight 500)
> - "BOT" pill badge at bottom (tiny white pill with small text)
> - Hover: `translateY(-4px)` lift + deeper shadow + overlay appears
> - Hover overlay: same color as card bg at 100% opacity, black text showing the description
> - `border-radius: 20px`
> - Click navigates to `/chat/[slug]`
>
> **3c. Featured Carousel** (`/components/bots/FeaturedCarousel.tsx`):
> - "Your Bots" section with star icon and header
> - Horizontal row, 5 cards per row, cards ~15% larger than grid cards
> - Cards use source-category colors (not a uniform color)
> - Left/right scroll arrows
> - Drag-and-drop reordering with @dnd-kit
> - Default featured: Graphics Creation, Canvassing Planner, Group Leadership Coach, Events Planning + Management, Creating People Power
>
> **3d. Bot Grid** — category sections with headers and 6-column grid:
> - Category header: colored circle + category name
> - Cards in `repeat(auto-fill, minmax(120px, 1fr))` grid with 14px gap
> - Each card has a star button that adds/removes it from the featured section
>
> **3e. Dashboard page** (`/app/page.tsx`):
> - Main title: "Welcome back, [user name]. Choose a bot to get started."
> - Featured carousel
> - All 4 category grids

**What this achieves:** The full dashboard with all bots displayed, clickable, matching the prototype exactly.

---

## Phase 4: Bot Chat (The Core Feature)

**Prompt to give Claude:**

> Build the functional bot chat. This is the most important feature — make it work end-to-end with real AI responses.
>
> **4a. API Route** (`/app/api/chat/route.ts`):
> - Accept POST with `{ botSlug, messages, conversationId? }`
> - Look up bot's system prompt from `/lib/bots.ts`
> - Call Claude API (model: `claude-sonnet-4-20250514`) with streaming enabled
> - System prompt should include: bot's personality/purpose, the user's name and organization, instructions to be helpful and concise
> - Return a streaming response (ReadableStream with SSE format)
> - After the response completes, save the updated conversation to Supabase `conversations` table
>
> **4b. Chat Page** (`/app/chat/[slug]/page.tsx`):
> - Layout matches prototype:
>   - Header: back arrow (returns to dashboard), bot name, "Online" status, and for Graphics Creation bot only: "Open in Studio" button
>   - Messages area: scrollable, auto-scrolls to bottom on new messages
>   - Input area: text input, microphone button (placeholder), send button (purple arrow)
> - Message bubbles:
>   - User messages: right-aligned, with user avatar
>   - Bot messages: left-aligned, with bot SVG avatar, bot name label, action buttons below (edit, copy, listen, like, dislike, regenerate)
>   - Show timestamps
>   - Streaming: bot messages appear token-by-token as they stream in
> - Conversation history sidebar (right, 260px):
>   - "Recent Conversations" header
>   - List of past conversations loaded from Supabase
>   - Click to load a past conversation
>   - Create new conversation button
>   - When editor is open (Graphics Creation), this sidebar hides
>
> **4c. Chat persistence:**
> - On first message, create a new conversation in Supabase
> - Auto-generate conversation title from the first user message (first ~50 chars)
> - Save messages as JSONB array: `[{ role: 'user'|'assistant', content: string, timestamp: string }]`
> - Load conversation list from Supabase on page mount
> - Update `updated_at` on each new message
>
> **4d. Bot-specific welcome messages:**
> - When starting a new conversation, show a welcome message: "Hi [user name]! I'm the **[Bot Name]**. How can I help you today?"
> - This is NOT saved to the database — it's generated client-side
>
> **4e. Graphics Creation — Studio toggle:**
> - Only for the Graphics Creation bot (`slug: 'graphics-creation'`)
> - "Open in Studio" button in the header
> - When toggled, chat shrinks to 38% width, editor panel appears at 62%
> - Editor panel: header with "Image Studio" title + close button, then an iframe loading `https://qwen-image-editor-production-49d4.up.railway.app/standalone/studio?imageUrl=https%3A%2F%2Fv3b.fal.media%2Ffiles%2Fb%2F0a8b8b09%2FyZtS-RQqgWF7A9YWuYSYb.jpg&user_id=Tectonica`
> - Conversation history sidebar hides when editor is open

**What this achieves:** A fully functional AI chat with every bot, conversation persistence, and the visual editor for Graphics Creation.

---

## Phase 5: Right Sidebar Dashboard Widgets

**Prompt to give Claude:**

> Build the right sidebar "Group Dashboard" with all widgets. Use hardcoded data for now — we'll wire up real data later. Match the prototype's 12-column grid layout exactly.
>
> The sidebar uses `grid-template-columns: repeat(12, 1fr)` with explicit placement.
>
> **Widgets to build (each as its own component in `/components/dashboard/`):**
>
> 1. **NewSignUps** (cols 1-9, rows 1-2, bg `#fef3c7`)
>    - Title "NEW SIGN-UPS"
>    - List: "John Doe" with orange avatar circle "J", "Signed up 39 hrs. ago" in pulsing red text (animated). "Mary Doe" with magenta avatar "M", "Signed up 8 hrs. ago" in green
>    - Footer: "Contact them within 48 hrs for best results or assign to another person."
>
> 2. **RecruitMorePeople** (cols 10-12, rows 1-2, bg `var(--accent-purple)`)
>    - White text "RECRUIT MORE PEOPLE"
>    - Large person-plus icon
>
> 3. **GroupConversations** (cols 1-6, rows 3-7, bg `#f5f3ff`)
>    - Title "GROUP CONVERSATIONS"
>    - 3 messages: @Sara Chen, @Marcus Rivera, @Ned Howey with message previews
>    - "Open Conversation" purple button → opens group chat overlay
>
> 4. **GroupActions** (cols 7-12, rows 3-7, bg `#f0e6ff`)
>    - Title "GROUP ACTIONS TO TAKE TODAY"
>    - 5 action items with times: "Call New Supporters" 9 AM, "Distribute Flyers at Campus" 11 AM, "Host Community Meetup" 12 PM
>
> 5. **Fundraising** (cols 1-4, rows 8-14, bg `#fff3e0`)
>    - Title "CURRENT MONTH FUNDRAISING GOAL"
>    - Big number: "$1,500 of $1,900"
>    - "Total Raised: $12,340"
>    - Purple progress bar (80%)
>    - "Monthly Supply & Print Budget $150"
>    - Pink "Request Reimbursement" button
>
> 6. **RecruitmentGoal** (cols 5-8, rows 8-11, bg `#e0f2fe`)
>    - "RECRUITMENT GOAL"
>    - "15 Members of 18" with progress circle
>    - "23 Supporters of 25" with progress circle
>
> 7. **RequestApproval** (cols 9-12, rows 8-11, bg `#fdf2f8`)
>    - "REQUEST APPROVAL"
>    - "Send an idea or asset for approval"
>    - Purple "Start" button
>
> 8. **ConnectedSystems** (cols 9-12, rows 11-15, bg `#f8fafc`)
>    - "CONNECTED SYSTEMS"
>    - 3 items stacked: Action Network (green dot + "MANAGE"), NationBuilder (green dot + "MANAGE"), Mobilize (green dot + "MANAGE")
>
> 9. **HoursVolunteered** (cols 5-8, rows 12-14, bg `#ecfdf5`)
>    - "HOURS VOLUNTEERED"
>    - "23" big number with green "+9" badge
>    - Green progress bar
>
> 10. **GroupDirectory** (cols 1-8, rows 15-20, bg white)
>     - "GROUP DIRECTORY"
>     - 6 people: Ned Howey (Member), Sara Chen (Member), Marcus Rivera (Supporter), Jasmine Okafor (Member), David Park (Supporter), Lucia Torres (Member)
>     - Each with colored initial avatar circle
>
> **Group Conversation Overlay:**
> - When "Open Conversation" is clicked, show a full overlay within the right sidebar
> - Message thread with input field
> - Close button to dismiss

**What this achieves:** Complete right sidebar matching the prototype.

---

## Phase 6: Group Coach Bot Page

**Prompt to give Claude:**

> Build the Group Coach Bot page at `/coach`. This is a dedicated page (not the generic bot chat) with its own layout.
>
> **Layout:** Two columns
> - Left (60%): Chat interface with the Group Coach Bot
> - Right (40%): Campaign stats sidebar
>
> **Chat (left):**
> - Same chat functionality as Phase 4 but with a coach-specific system prompt:
>   > "You are the Group Coach Bot for the Movement Intelligence platform. You are an AI campaign strategist helping Ned Howey, an organizer at People's Movement. You have access to campaign metrics and provide strategic advice on outreach, voter contact, fundraising, and rally preparation. Be data-driven, actionable, and encouraging. When presenting data, use structured formats."
> - Pre-populated first exchange (for demo purposes, show as initial messages):
>   - Bot: "Hey Ned! I've been reviewing your campaign metrics. Your volunteer engagement is up 12% this week..." with 4 numbered options
>   - User: "Let's review outreach performance and then prep rally talking points."
>   - Bot: Stats cards showing: 847 Doors knocked (+18%), 2,340 Calls made (+7%), 156 Texts sent (+12%), 68% Response rate (-3%)
> - Input: "Ask your campaign coach..."
>
> **Stats sidebar (right):**
> - "CAMPAIGN GOALS" section:
>   - Voter contacts: 3,300 / 10,000 (73%) — purple progress bar
>   - Volunteer recruitment: 280 / 500 (56%) — orange progress bar
>   - Fundraising target: $128K / $200K (64%) — green progress bar
> - "STRATEGY NOTES" section:
>   - FEB 25: "Focus canvassing on Precinct 4 — highest undecided voter density."
>   - FEB 22: "A/B test rally invite: urgency framing vs. community framing."
>   - FEB 19: "Shift phone banking hours to 5–8 PM — contact rate up 22%."
> - "UPCOMING" section (colored dots):
>   - Climate Rally — Sat, Mar 1 · 2:00 PM (green)
>   - Phone bank training — Mon, Mar 3 · 6:00 PM (blue)
>   - Strategy review — Wed, Mar 5 · 10:00 AM (purple)
>
> Navigation: clicking "Group Coach Bot" in the sidebar navigates to `/coach`. Back arrow returns to dashboard.

**What this achieves:** The Group Coach Bot page with real AI chat and campaign context.

---

## Phase 7: Group Media Gallery

**Prompt to give Claude:**

> Build the Group Media page at `/media`. This is a CMS-style media gallery.
>
> **Layout:** Full width (main + right sidebar area), left sidebar stays visible.
>
> **Header:**
> - "Group Media" title + "48 items" count
> - Purple "Upload Media" button (right-aligned)
>
> **Toolbar:**
> - Search input with magnifying glass icon: "Search media..."
> - Filter pills: All (active/purple), Images, Videos, Documents
> - Grid/list view toggle buttons
>
> **Media Grid:**
> - `grid-template-columns: repeat(auto-fill, minmax(190px, 1fr))`
> - Each card: white background, rounded corners, subtle shadow
>   - Colored placeholder thumbnail (pastel colors matching file types)
>   - Type badge in top-right corner: IMG (blue), VID (red), DOC (green), PDF (amber)
>   - Filename, date, file size below thumbnail
>
> **Placeholder cards** (15 items):
> - rally-poster-march.png (IMG, Mar 12, 2.4 MB)
> - volunteer-training.mp4 (VID, Mar 10, 84 MB)
> - canvassing-script-v3.docx (DOC, Mar 8, 156 KB)
> - social-card-template.png (IMG, Mar 7, 1.1 MB)
> - q1-impact-report.pdf (PDF, Mar 5, 3.2 MB)
> - team-photo-retreat.jpg (IMG, Mar 3, 4.7 MB)
> - press-release-draft.docx (DOC, Feb 28, 89 KB)
> - event-recap-feb.mp4 (VID, Feb 26, 120 MB)
> - flyer-community-day.png (IMG, Feb 24, 1.8 MB)
> - fundraising-deck.pdf (PDF, Feb 20, 5.1 MB)
> - banner-website-hero.png (IMG, Feb 18, 980 KB)
> - talking-points-housing.docx (DOC, Feb 15, 67 KB)
> - testimonial-maria.mp4 (VID, Feb 12, 45 MB)
> - infographic-impact.png (IMG, Feb 10, 2.1 MB)
> - volunteer-handbook.pdf (PDF, Feb 8, 8.4 MB)
>
> **Pagination:** 1, 2, 3, next arrow
>
> **Upload functionality:**
> - "Upload Media" button opens a file picker
> - Upload to Supabase Storage bucket
> - Save metadata to `media` table
> - Show upload progress
> - After upload, file appears in the grid
>
> **Filters:**
> - "All" shows everything
> - "Images" filters to .png, .jpg, .jpeg, .gif, .webp
> - "Videos" filters to .mp4, .mov, .avi
> - "Documents" filters to .doc, .docx, .pdf, .txt, .xlsx
>
> Navigation: clicking "Group Media" in the sidebar navigates to `/media`.

**What this achieves:** A functional media gallery with real file uploads.

---

## Phase 8: Leaders & Organizers Chat Panel

**Prompt to give Claude:**

> Build the Leaders & Organizers real-time chat panel.
>
> **Trigger:** Clicking the "Leaders & Organizers" button in the sidebar opens a slide-in panel from the left (overlays the main content).
>
> **Panel layout:**
> - Header: "Leaders and Supporters Chat" + close button
> - Contact list (top): 4 people with status indicators
>   - Sarah Chen (Online, green dot)
>   - Marcus Rivera (Online, green dot)
>   - Jamie Okafor (Away, yellow dot)
>   - Lisa Tran (Offline, gray dot)
> - Message thread (scrollable):
>   - Messages with avatar, name, content, timestamp
>   - Alternating user messages
> - Input area: "Message your group..." + send button
>
> **Real-time messaging:**
> - Use Supabase Realtime to subscribe to the `group_messages` table
> - New messages appear instantly for all connected users
> - Messages are saved to the `group_messages` table
> - Load last 50 messages on panel open
>
> **Seed messages** (for initial state):
> - Sara Chen: "Just confirmed the venue for Saturday's rally. We're all set!" — 2:34 PM
> - Marcus Rivera: "Great work! I'll get the flyers distributed this afternoon." — 2:41 PM
> - Ned Howey: "Perfect. Let's sync at 5 to review the run-of-show." — 2:45 PM

**What this achieves:** Real-time group messaging.

---

## Phase 9: Responsive Layout

**Prompt to give Claude:**

> Make the entire app responsive, matching the prototype's breakpoint behavior:
>
> | Breakpoint | Changes |
> |---|---|
> | 1399px | Compact widget fonts and padding in right sidebar |
> | 1199px | Restack right sidebar widgets to pairs, featured carousel shows 4 per row |
> | 999px | Hide right sidebar completely |
> | 899px | Collapse left sidebar to 64px (icon-only mode), hide bot chats section |
> | 699px | Sidebar becomes overlay drawer (slides in from left), main content full width |
>
> The bot grid should use `repeat(auto-fill, minmax(120px, 1fr))` so it self-adjusts.
>
> Media gallery grid should also be responsive.
>
> Sidebar collapse button behavior:
> - Above 699px: toggles between 180px and 64px
> - Below 699px: toggles overlay drawer open/closed
>
> Desktop-first design. Mobile is out of scope but the layout should not break on smaller screens.

**What this achieves:** Responsive behavior matching the prototype.

---

## Phase 10: Polish & Animations

**Prompt to give Claude:**

> Add entrance animations and polish to match the prototype's feel.
>
> **Animations (using framer-motion):**
> - Bot cards: stagger fade-in from bottom on page load (`y: 30 → 0, opacity: 0 → 1, stagger: 0.04`)
> - Category headers: slide in from left (`x: -20 → 0`)
> - Right sidebar widgets: slide in from right (`x: 20 → 0, stagger: 0.08, delay: 0.3`)
> - Main title: fade down (`y: -15 → 0`)
> - View transitions: fade + slide when switching between dashboard/chat/coach/media
> - Bot card hover: `translateY(-4px)` with shadow deepening
> - Chat messages: stagger fade in when conversation loads
>
> **Other polish:**
> - John Doe "Signed up 39 hrs. ago" text: pulsing red animation (`color: #DC2626 ↔ #EF4444, opacity: 1 ↔ 0.6, 2s infinite`)
> - Smooth sidebar collapse/expand transition
> - Loading states for chat (typing indicator while waiting for AI response)
> - Keyboard shortcut: Enter to send message, Shift+Enter for new line

**What this achieves:** The app feels polished and matches the prototype's smooth interactions.

---

## Future Phases (not for now)

### Phase 11: Multi-tenancy
- Support multiple organizations and groups
- Admin panel for org management
- Configurable bot selection per org

### Phase 12: Real Integrations
- Action Network API connection
- NationBuilder API connection
- Mobilize API connection
- Real dashboard data from integrations

### Phase 13: Advanced Bot Features
- Image generation API for Graphics Creation bot
- Context-aware bots that can access campaign data
- Bot memory across conversations
- File upload in chat (PDFs, images for analysis)

### Phase 14: Deployment & DevOps
- Production deployment (Vercel, Railway, or similar)
- CI/CD pipeline
- Error tracking (Sentry)
- Analytics
- LLM cost monitoring

---

## Quick Reference: Giving Instructions to Claude

1. **One phase at a time.** Wait for Claude to finish before starting the next.
2. **Copy the prompt** from each phase and paste it into the chat.
3. **Fill in your secrets** — replace `[PASTE_YOUR_URL]` etc. with real values.
4. **Test each phase** before moving on. Make sure it works.
5. **If something breaks**, tell Claude what's wrong and let it fix it before continuing.
6. **The prototype is the design reference** — if you need Claude to check a specific detail, tell it to read the prototype files at `/Users/marianaspada/Documents/claude code projects/TAI Future/`.
