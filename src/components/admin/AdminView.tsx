"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import type { UserRole } from "@/lib/types";
import { ROLES } from "@/lib/constants/roles";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/lib/icon-map";
import OrgTab from "./OrgTab";
import PeopleTab from "./PeopleTab";
import BotsTab from "./BotsTab";
import IntegrationsTab from "./IntegrationsTab";
import GoalsTab from "./GoalsTab";
import BillingTab from "./BillingTab";
import BrandingTab from "./BrandingTab";
import LandingPagesTab from "./LandingPagesTab";
import HoursTab from "./HoursTab";

/* ── URL param ↔ tab key mapping ── */

const TAB_PARAM_MAP: Record<string, string> = {
  organization: "Organization",
  people: "People",
  hours: "Hours",
  goals: "Goals",
  bots: "Bots",
  integrations: "Integrations",
  billing: "Billing",
  branding: "Branding",
  "landing-pages": "Landing Pages",
};

/* ── Sidebar nav structure ── */

interface NavItem {
  key: string;       // matches TAB_PARAM_MAP display name
  label: string;
  icon: IconName;
  superOnly: boolean;
}

interface NavGroup {
  heading: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    heading: "Manage",
    items: [
      { key: "People", label: "People", icon: "members", superOnly: false },
      { key: "Hours", label: "Hours", icon: "log-hours", superOnly: false },
      { key: "Goals", label: "Goals", icon: "nav-goals", superOnly: false },
      { key: "Organization", label: "Organization", icon: "nav-organization", superOnly: true },
    ],
  },
  {
    heading: "Tools",
    items: [
      { key: "Bots", label: "Bots", icon: "nav-bots", superOnly: true },
      { key: "Branding", label: "Branding", icon: "nav-branding", superOnly: false },
      { key: "Landing Pages", label: "Landing Pages", icon: "bot-landing-page", superOnly: false },
    ],
  },
  {
    heading: "Settings",
    items: [
      { key: "Integrations", label: "Integrations", icon: "widget-connected-systems", superOnly: true },
      { key: "Billing", label: "Billing", icon: "widget-fundraising", superOnly: true },
    ],
  },
];

/* ── Component ── */

interface AdminViewProps {
  role: UserRole;
  orgId: string | null;
  groupId: string | null;
}

export default function AdminView({ role, orgId, groupId }: AdminViewProps) {
  const searchParams = useSearchParams();
  const isSuperAdmin = role === ROLES.SUPER_ADMIN;

  // Build flat list of accessible tab keys for this role
  const accessibleTabs = NAV_GROUPS
    .flatMap((g) => g.items)
    .filter((item) => !item.superOnly || isSuperAdmin)
    .map((item) => item.key);

  // Resolve initial tab from URL param
  const tabParam = searchParams.get("tab")?.toLowerCase() || "";
  const requestedTab = TAB_PARAM_MAP[tabParam];
  const initialTab =
    requestedTab && accessibleTabs.includes(requestedTab)
      ? requestedTab
      : accessibleTabs[0] || "People";

  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="flex-1 flex min-h-0 overflow-hidden bg-content-bg">
      {/* ── Sidebar navigation ── */}
      <aside className="w-[220px] shrink-0 border-r border-card-stroke bg-card-bg flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="px-3 py-4 flex items-center gap-2">
          <Icon name="admin" size={16} />
          <span className="text-sm font-semibold text-text-primary">Admin Panel</span>
          {!isSuperAdmin && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 ml-auto text-[10px]">
              Group Admin
            </Badge>
          )}
        </div>

        {/* Nav groups */}
        <nav className="flex-1 px-1.5 pb-4">
          {NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter(
              (item) => !item.superOnly || isSuperAdmin
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.heading}>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted px-3 mb-1 mt-4">
                  {group.heading}
                </p>
                {visibleItems.map((item) => {
                  const isActive = activeTab === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setActiveTab(item.key)}
                      className={`
                        w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors
                        ${isActive
                          ? "bg-[var(--accent-purple)]/10 text-[var(--accent-purple)] font-medium border-l-2 border-[var(--accent-purple)] -ml-px"
                          : "text-text-secondary hover:text-text-primary hover:bg-black/[0.02]"
                        }
                      `}
                    >
                      <Icon name={item.icon} size={16} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* ── Content area ── */}
      <div className="flex-1 overflow-y-auto p-6 min-w-0">
        {activeTab === "Organization" && isSuperAdmin && (
          <OrgTab orgId={orgId} />
        )}
        {activeTab === "People" && (
          <PeopleTab role={role} orgId={orgId} groupId={groupId} />
        )}
        {activeTab === "Hours" && (
          <HoursTab groupId={groupId} />
        )}
        {activeTab === "Goals" && (
          <GoalsTab groupId={groupId} />
        )}
        {activeTab === "Bots" && isSuperAdmin && (
          <BotsTab orgId={orgId} />
        )}
        {activeTab === "Integrations" && isSuperAdmin && (
          <IntegrationsTab />
        )}
        {activeTab === "Billing" && isSuperAdmin && (
          <BillingTab groupId={groupId} />
        )}
        {activeTab === "Branding" && (
          <BrandingTab role={role} groupId={groupId} orgId={orgId} />
        )}
        {activeTab === "Landing Pages" && (
          <LandingPagesTab role={role} groupId={groupId} />
        )}
      </div>
    </div>
  );
}
