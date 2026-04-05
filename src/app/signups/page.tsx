import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import SignupsView from "@/components/signups/SignupsView";
import type { UserRole } from "@/lib/types";

export default async function SignupsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const displayName =
    user?.user_metadata?.full_name || user?.email || "Organizer";

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile?.role ?? "supporter") as UserRole;

  return (
    <AppShell userName={displayName}>
      <SignupsView userRole={role} />
    </AppShell>
  );
}
