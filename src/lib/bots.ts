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
  { label: string; bg: string; accent: string }
> = {
  advisors: {
    label: "Advisors",
    bg: "var(--cat-advisors)",
    accent: "var(--cat-advisors-accent)",
  },
  create: {
    label: "Create Things",
    bg: "var(--cat-create)",
    accent: "var(--cat-create-accent)",
  },
  tools: {
    label: "Use Organizing Tools",
    bg: "var(--cat-tools)",
    accent: "var(--cat-tools-accent)",
  },
  analyze: {
    label: "Understand + Analyze",
    bg: "var(--cat-analyze)",
    accent: "var(--cat-analyze-accent)",
  },
};

export const bots: Bot[] = [
  // Advisors
  {
    id: "getting-started",
    name: "Getting Started + Help",
    icon: "help_outline",
    category: "advisors",
    description: "Get help getting started with organizing tools and strategy.",
  },
  {
    id: "local-strategy",
    name: "Local Strategy Planning",
    icon: "map",
    category: "advisors",
    description: "Plan and develop local organizing strategies.",
  },
  {
    id: "recruitment-planning",
    name: "Recruitment Planning",
    icon: "person_add",
    category: "advisors",
    description: "Build a plan for recruiting new members and volunteers.",
  },
  {
    id: "action-planning",
    name: "Action Planning",
    icon: "flag",
    category: "advisors",
    description: "Plan direct actions, rallies, and mobilizations.",
  },
  {
    id: "events-planning",
    name: "Events Planning + Management",
    icon: "event",
    category: "advisors",
    description: "Plan and manage events from start to finish.",
  },
  {
    id: "relationship-management",
    name: "Relationship/Contact Mng",
    icon: "contacts",
    category: "advisors",
    description: "Manage contacts and build stronger relationships.",
  },
  {
    id: "group-leadership",
    name: "Group Leadership Coach",
    icon: "groups",
    category: "advisors",
    description: "Get coaching on leading your organizing group.",
  },
  {
    id: "group-fundraising",
    name: "Group Fundraising",
    icon: "paid",
    category: "advisors",
    description: "Plan and execute fundraising campaigns.",
  },
  {
    id: "canvassing-planner",
    name: "Canvassing Planner",
    icon: "directions_walk",
    category: "advisors",
    description: "Plan door-to-door canvassing routes and scripts.",
  },

  // Create Things
  {
    id: "graphics-creation",
    name: "Graphics Creation",
    icon: "palette",
    category: "create",
    description: "Create graphics, flyers, and visual content.",
  },
  {
    id: "written-content",
    name: "Written Content",
    icon: "description",
    category: "create",
    description: "Write press releases, blog posts, and copy.",
  },
  {
    id: "distributed-email",
    name: "Distributed Email",
    icon: "email",
    category: "create",
    description: "Create and manage email campaigns.",
  },
  {
    id: "group-webpage",
    name: "Set-Up/Manage Group Webpage",
    icon: "web",
    category: "create",
    description: "Build and manage your group's web presence.",
  },
  {
    id: "video-creation",
    name: "Video Creation",
    icon: "videocam",
    category: "create",
    description: "Create video content for campaigns.",
  },

  // Use Organizing Tools
  {
    id: "ad-placement",
    name: "Ad Placement",
    icon: "ads_click",
    category: "tools",
    description: "Place and manage digital advertising campaigns.",
  },
  {
    id: "social-media",
    name: "Social Media",
    icon: "share",
    category: "tools",
    description: "Manage social media presence and campaigns.",
  },
  {
    id: "tech-tools",
    name: "Tech Tools How-To",
    icon: "build",
    category: "tools",
    description: "Learn how to use organizing tech tools.",
  },
  {
    id: "targeted-advocacy",
    name: "Targeted Advocacy",
    icon: "campaign",
    category: "tools",
    description: "Run targeted advocacy and lobbying campaigns.",
  },

  // Understand + Analyze
  {
    id: "creating-people-power",
    name: "Creating People Power",
    icon: "volunteer_activism",
    category: "analyze",
    description: "Analyze and grow grassroots people power.",
  },
  {
    id: "recruitment-progress",
    name: "Recruitment Progress",
    icon: "trending_up",
    category: "analyze",
    description: "Track and analyze recruitment metrics.",
  },
  {
    id: "email-performance",
    name: "Email Performance",
    icon: "mark_email_read",
    category: "analyze",
    description: "Analyze email campaign performance.",
  },
  {
    id: "networks-resources",
    name: "Networks/Resources/Orgs",
    icon: "hub",
    category: "analyze",
    description: "Map networks, resources, and allied organizations.",
  },
  {
    id: "group-decision-making",
    name: "Group Decision Making",
    icon: "how_to_vote",
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
