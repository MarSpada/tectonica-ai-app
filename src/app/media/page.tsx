import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import MediaGallery from "@/components/media/MediaGallery";
import { GROUP_QUOTA } from "@/lib/media-storage";
import type { UserRole } from "@/lib/types";

export default async function MediaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const displayName =
    user?.user_metadata?.full_name || user?.email || "Organizer";

  // Fetch profile with group info
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, group_id")
    .eq("id", user.id)
    .single();

  const role = (profile?.role ?? "supporter") as UserRole;
  const groupId = profile?.group_id as string | null;

  // Fetch storage usage from groups table
  let storageUsedBytes = 0;
  if (groupId) {
    const { data: group } = await supabase
      .from("groups")
      .select("storage_used_bytes")
      .eq("id", groupId)
      .single();
    storageUsedBytes = group?.storage_used_bytes ?? 0;
  }

  return (
    <AppShell userName={displayName}>
      <MediaGallery
        userRole={role}
        storageUsedBytes={storageUsedBytes}
        storageTotalBytes={GROUP_QUOTA}
      />
    </AppShell>
  );
}
