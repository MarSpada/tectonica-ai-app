import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import MemberDirectory from "@/components/members/MemberDirectory";
import type { Member } from "@/lib/types";

export default async function MembersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName =
    user?.user_metadata?.full_name || user?.email || "Organizer";

  let members: Member[] = [];
  if (user) {
    const { data } = await supabase.rpc("get_group_members");
    if (data) {
      members = data as Member[];
    }
  }

  return (
    <AppShell userName={displayName}>
      <MemberDirectory members={members} />
    </AppShell>
  );
}
