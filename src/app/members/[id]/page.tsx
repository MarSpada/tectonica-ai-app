import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import MemberProfile from "@/components/members/MemberProfile";
import type { Member } from "@/lib/types";

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const displayName =
    user.user_metadata?.full_name || user.email || "Organizer";

  // Fetch all group members (RPC ensures same-group security)
  const { data: members } = await supabase.rpc("get_group_members");
  const member = (members as Member[] | null)?.find((m) => m.id === id);

  if (!member) notFound();

  // Fetch bio for this member
  const { data: profile } = await supabase
    .from("profiles")
    .select("bio")
    .eq("id", id)
    .single();

  return (
    <AppShell userName={displayName}>
      <MemberProfile member={member} bio={profile?.bio || null} />
    </AppShell>
  );
}
