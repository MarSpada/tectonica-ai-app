import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import MediaGallery from "@/components/media/MediaGallery";

export default async function MediaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName =
    user?.user_metadata?.full_name || user?.email || "Organizer";

  return (
    <AppShell userName={displayName}>
      <MediaGallery />
    </AppShell>
  );
}
