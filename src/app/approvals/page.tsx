import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import ApprovalsView from "@/components/approvals/ApprovalsView";
import type { UserRole } from "@/lib/types";

export default async function ApprovalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const role = (profile?.role || "member") as UserRole;

  // Supporters cannot access approvals
  if (role === "supporter") {
    redirect("/");
  }

  const displayName =
    profile?.full_name || user.user_metadata?.full_name || user.email || "User";

  return (
    <AppShell userName={displayName}>
      <ApprovalsView currentUserId={user.id} currentUserRole={role} />
    </AppShell>
  );
}
