export type BotCategory = "advisors" | "create" | "tools" | "analyze";

export interface Bot {
  id: string;
  name: string;
  icon: string;
  category: BotCategory;
  description: string;
}

export const categoryMeta: Record<
  BotCategory,
  { label: string; bg: string; accent: string; badgeBg: string }
> = {
  advisors: {
    label: "Advisors",
    bg: "var(--cat-advisors)",
    accent: "var(--cat-advisors-accent)",
    badgeBg: "var(--cat-advisors-badge)",
  },
  create: {
    label: "Create Things",
    bg: "var(--cat-create)",
    accent: "var(--cat-create-accent)",
    badgeBg: "var(--cat-create-badge)",
  },
  tools: {
    label: "Use Organizing Tools",
    bg: "var(--cat-tools)",
    accent: "var(--cat-tools-accent)",
    badgeBg: "var(--cat-tools-badge)",
  },
  analyze: {
    label: "Understand + Analyze",
    bg: "var(--cat-analyze)",
    accent: "var(--cat-analyze-accent)",
    badgeBg: "var(--cat-analyze-badge)",
  },
};

export const bots: Bot[] = [
  // Welcome Helper (not shown in grid — used by WelcomeHelper component)
  {
    id: "welcome",
    name: "Welcome Helper",
    icon: "bot-welcome",
    category: "advisors",
    description: "Your personal guide to Movement Intelligence. Ask me anything about what you can do here.",
  },

  // Advisors
  {
    id: "getting-started",
    name: "Getting Started + Help",
    icon: "bot-getting-started",
    category: "advisors",
    description: "Get help getting started with organizing tools and strategy.",
  },
  {
    id: "local-strategy",
    name: "Local Strategy Planning",
    icon: "bot-local-strategy",
    category: "advisors",
    description: "Plan and develop local organizing strategies.",
  },
  {
    id: "recruitment-planning",
    name: "Recruitment Planning",
    icon: "bot-recruitment-planning",
    category: "advisors",
    description: "Build a plan for recruiting new members and volunteers.",
  },
  {
    id: "action-planning",
    name: "Action Planning",
    icon: "bot-action-planning",
    category: "advisors",
    description: "Plan direct actions, rallies, and mobilizations.",
  },
  {
    id: "events-planning",
    name: "Events Planning + Management",
    icon: "bot-events-planning",
    category: "advisors",
    description: "Plan and manage events from start to finish.",
  },
  {
    id: "relationship-management",
    name: "Relationship/Contact Mng",
    icon: "bot-relationship-contact",
    category: "advisors",
    description: "Manage contacts and build stronger relationships.",
  },
  {
    id: "group-leadership",
    name: "Group Leadership Coach",
    icon: "bot-group-leadership",
    category: "advisors",
    description: "Get coaching on leading your organizing group.",
  },
  {
    id: "group-fundraising",
    name: "Group Fundraising",
    icon: "bot-group-fundraising",
    category: "advisors",
    description: "Plan and execute fundraising campaigns.",
  },
  {
    id: "canvassing-planner",
    name: "Canvassing Planner",
    icon: "bot-canvassing",
    category: "advisors",
    description: "Plan door-to-door canvassing routes and scripts.",
  },

  // Create Things
  {
    id: "graphics-creation",
    name: "Graphics Creation",
    icon: "bot-graphics",
    category: "create",
    description: "Create graphics, flyers, and visual content.",
  },
  {
    id: "written-content",
    name: "Written Content",
    icon: "bot-written-content",
    category: "create",
    description: "Write press releases, blog posts, and copy.",
  },
  {
    id: "distributed-email",
    name: "Distributed Email",
    icon: "bot-email",
    category: "create",
    description: "Create and manage email campaigns.",
  },
  {
    id: "group-webpage",
    name: "Set-Up/Manage Group Webpage",
    icon: "bot-webpage",
    category: "create",
    description: "Build and manage your group's web presence.",
  },
  {
    id: "video-creation",
    name: "Video Creation",
    icon: "bot-video",
    category: "create",
    description: "Create video content for campaigns.",
  },

  // Use Organizing Tools
  {
    id: "ad-placement",
    name: "Ad Placement",
    icon: "bot-ad-placement",
    category: "tools",
    description: "Place and manage digital advertising campaigns.",
  },
  {
    id: "social-media",
    name: "Social Media",
    icon: "bot-social-media",
    category: "tools",
    description: "Manage social media presence and campaigns.",
  },
  {
    id: "tech-tools",
    name: "Tech Tools How-To",
    icon: "bot-tech-tools",
    category: "tools",
    description: "Learn how to use organizing tech tools.",
  },
  {
    id: "targeted-advocacy",
    name: "Targeted Advocacy",
    icon: "bot-targeted-advocacy",
    category: "tools",
    description: "Run targeted advocacy and lobbying campaigns.",
  },

  // Understand + Analyze
  {
    id: "creating-people-power",
    name: "Creating People Power",
    icon: "bot-people-power",
    category: "analyze",
    description: "Analyze and grow grassroots people power.",
  },
  {
    id: "recruitment-progress",
    name: "Recruitment Progress",
    icon: "bot-recruitment-progress",
    category: "analyze",
    description: "Track and analyze recruitment metrics.",
  },
  {
    id: "email-performance",
    name: "Email Performance",
    icon: "bot-email-performance",
    category: "analyze",
    description: "Analyze email campaign performance.",
  },
  {
    id: "networks-resources",
    name: "Networks/Resources/Orgs",
    icon: "bot-networks",
    category: "analyze",
    description: "Map networks, resources, and allied organizations.",
  },
  {
    id: "group-decision-making",
    name: "Group Decision Making",
    icon: "bot-group-decision",
    category: "analyze",
    description: "Facilitate and analyze group decision processes.",
  },
];

export const defaultFeaturedBotIds = [
  "graphics-creation",
  "canvassing-planner",
  "group-leadership",
  "events-planning",
  "creating-people-power",
];
