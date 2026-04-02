import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import GroupProfile from "@/components/GroupProfile";

export default async function GroupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName =
    user?.user_metadata?.full_name || user?.email || "Organizer";

  let groupData = { name: "", description: "" };
  let memberCount = 0;
  let orgName = "";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("group_id, org_id")
      .eq("id", user.id)
      .single();

    if (profile?.group_id) {
      const { data: group } = await supabase
        .from("groups")
        .select("name, description")
        .eq("id", profile.group_id)
        .single();

      if (group) {
        groupData = {
          name: group.name || "",
          description: group.description || "",
        };
      }

      // Get member count
      const { data: members } = await supabase.rpc("get_group_members");
      if (members) memberCount = members.length;
    }

    if (profile?.org_id) {
      const { data: org } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", profile.org_id)
        .single();
      if (org) orgName = org.name;
    }
  }

  return (
    <AppShell userName={displayName}>
      <GroupProfile
        name={groupData.name}
        description={groupData.description}
        memberCount={memberCount}
        orgName={orgName}
      />
    </AppShell>
  );
}
