import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import SettingsView from "@/components/settings/SettingsView";
import type { ProfileData } from "@/lib/types";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, avatar_url, bio, role, org_id, group_id, organizations ( name ), groups ( name )"
    )
    .eq("id", user.id)
    .single();

  const displayName =
    profile?.full_name || user.user_metadata?.full_name || user.email || "User";

  const profileData: ProfileData = {
    fullName: profile?.full_name || "",
    avatarUrl: profile?.avatar_url || null,
    bio: profile?.bio || "",
    role: profile?.role || "member",
    orgName:
      (profile?.organizations as unknown as { name: string } | null)?.name || "\u2014",
    groupName: (profile?.groups as unknown as { name: string } | null)?.name || "\u2014",
  };

  return (
    <AppShell userName={displayName}>
      <SettingsView
        userId={user.id}
        email={user.email || ""}
        profile={profileData}
        userRole={profile?.role || "member"}
      />
    </AppShell>
  );
}
