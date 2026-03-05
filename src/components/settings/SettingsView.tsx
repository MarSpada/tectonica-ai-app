"use client";

import { useState } from "react";
import type { ProfileData } from "@/lib/types";
import ProfileTab from "./ProfileTab";
import AccountTab from "./AccountTab";

interface SettingsViewProps {
  userId: string;
  email: string;
  profile: ProfileData;
}

const tabs = ["Profile", "Account"] as const;
type Tab = (typeof tabs)[number];

export default function SettingsView({
  userId,
  email,
  profile,
}: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Profile");

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-0">
        <h1 className="text-2xl font-bold text-text-primary mb-4">
          Account Settings
        </h1>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-black/5">
          {tabs.map((tab) => (
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
        <div className="max-w-xl mx-auto">
          {activeTab === "Profile" ? (
            <ProfileTab userId={userId} profile={profile} />
          ) : (
            <AccountTab email={email} />
          )}
        </div>
      </div>
    </div>
  );
}
