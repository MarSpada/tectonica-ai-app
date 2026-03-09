import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import AdminView from "@/components/admin/AdminView";
import type { UserRole } from "@/lib/types";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, org_id, group_id")
    .eq("id", user.id)
    .single();

  const role = profile?.role as UserRole;
  if (role !== "super_admin" && role !== "group_admin") {
    redirect("/");
  }

  const displayName =
    profile?.full_name || user.user_metadata?.full_name || user.email || "Admin";

  return (
    <AppShell userName={displayName}>
      <AdminView
        role={role}
        orgId={profile?.org_id ?? null}
        groupId={profile?.group_id ?? null}
      />
    </AppShell>
  );
}
