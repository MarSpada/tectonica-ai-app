"use client";

import { useState, useEffect } from "react";
import { ROLES } from "@/lib/constants/roles";
import { useSearchParams } from "next/navigation";
import type { ProfileData, UserRole } from "@/lib/types";
import ProfileTab from "./ProfileTab";
import AccountTab from "./AccountTab";
import ActivityTab from "./ActivityTab";
import ApprovalsView from "../approvals/ApprovalsView";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface SettingsViewProps {
  userId: string;
  email: string;
  profile: ProfileData;
  userRole?: UserRole;
}

const TAB_CONFIG = [
  { value: "profile", label: "Profile" },
  { value: "account", label: "Account" },
  { value: "activity", label: "Activity" },
  { value: "approvals", label: "Approvals" },
] as const;

type TabValue = (typeof TAB_CONFIG)[number]["value"];

export default function SettingsView({
  userId,
  email,
  profile,
  userRole,
}: SettingsViewProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab: TabValue = tabParam === "approvals" ? "approvals" : tabParam === "activity" ? "activity" : "profile";
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab);

  // Respond to URL param changes (e.g., clicking bell icon)
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "approvals") setActiveTab("approvals");
    else if (tab === "activity") setActiveTab("activity");
  }, [searchParams]);

  // Filter tabs: hide Approvals for supporters
  const visibleTabs = TAB_CONFIG.filter((t) => {
    if (t.value === "approvals" && userRole === ROLES.SUPPORTER) return false;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-content-bg">
      {/* Header */}
      <div className="px-6 pt-5 pb-0">
        <h1 className="text-2xl font-bold text-text-primary mb-4">
          Account Settings
        </h1>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as TabValue)}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="px-6">
          <TabsList variant="line" className="gap-6">
            {visibleTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <TabsContent value="profile">
            <div className="max-w-xl mx-auto">
              <ProfileTab userId={userId} profile={profile} />
            </div>
          </TabsContent>
          <TabsContent value="account">
            <div className="max-w-xl mx-auto">
              <AccountTab email={email} />
            </div>
          </TabsContent>
          <TabsContent value="activity">
            <div className="max-w-xl mx-auto">
              <ActivityTab userId={userId} />
            </div>
          </TabsContent>
          <TabsContent value="approvals">
            <ApprovalsView currentUserId={userId} currentUserRole={userRole || ROLES.MEMBER} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
