"use client";

import { useState } from "react";
import type { UserRole } from "@/lib/types";
import OrgTab from "./OrgTab";
import PeopleTab from "./PeopleTab";
import BotsTab from "./BotsTab";

type AdminTab = "Organization" | "People" | "Bots";

interface AdminViewProps {
  role: UserRole;
  orgId: string | null;
  groupId: string | null;
}

export default function AdminView({ role, orgId, groupId }: AdminViewProps) {
  const isSuperAdmin = role === "super_admin";

  const availableTabs: AdminTab[] = isSuperAdmin
    ? ["Organization", "People", "Bots"]
    : ["People"];

  const [activeTab, setActiveTab] = useState<AdminTab>(availableTabs[0]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-0">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-icons-two-tone text-accent-purple text-[28px]">
            admin_panel_settings
          </span>
          <h1 className="text-2xl font-bold text-text-primary">Admin Panel</h1>
          {!isSuperAdmin && (
            <span className="text-xs font-medium bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
              Group Admin
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-black/5">
          {availableTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-accent-purple text-accent-purple"
                  : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {activeTab === "Organization" && isSuperAdmin && (
          <OrgTab orgId={orgId} />
        )}
        {activeTab === "People" && (
          <PeopleTab role={role} orgId={orgId} groupId={groupId} />
        )}
        {activeTab === "Bots" && isSuperAdmin && <BotsTab orgId={orgId} />}
      </div>
    </div>
  );
}
