"use client";

import type { UserRole } from "@/lib/types";
import { ROLES } from "@/lib/constants/roles";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import OrgTab from "./OrgTab";
import PeopleTab from "./PeopleTab";
import BotsTab from "./BotsTab";
import IntegrationsTab from "./IntegrationsTab";
import GoalsTab from "./GoalsTab";

interface AdminViewProps {
  role: UserRole;
  orgId: string | null;
  groupId: string | null;
}

export default function AdminView({ role, orgId, groupId }: AdminViewProps) {
  const isSuperAdmin = role === ROLES.SUPER_ADMIN;

  const tabs = isSuperAdmin
    ? (["Organization", "People", "Goals", "Bots", "Integrations"] as const)
    : (["People", "Goals"] as const);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-content-bg">
      <Tabs defaultValue={tabs[0]} className="flex-1 flex flex-col gap-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-0">
          <div className="flex items-center gap-3 mb-4">
            <Icon name="admin" size={28} />
            <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
            {!isSuperAdmin && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                Group Admin
              </Badge>
            )}
          </div>

          <TabsList variant="line" className="w-full justify-start border-b border-border">
            {tabs.map((tab) => (
              <TabsTrigger key={tab} value={tab}>
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {isSuperAdmin && (
            <TabsContent value="Organization">
              <OrgTab orgId={orgId} />
            </TabsContent>
          )}
          <TabsContent value="People">
            <PeopleTab role={role} orgId={orgId} groupId={groupId} />
          </TabsContent>
          <TabsContent value="Goals">
            <GoalsTab groupId={groupId} />
          </TabsContent>
          {isSuperAdmin && (
            <TabsContent value="Bots">
              <BotsTab orgId={orgId} />
            </TabsContent>
          )}
          {isSuperAdmin && (
            <TabsContent value="Integrations">
              <IntegrationsTab />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
}
