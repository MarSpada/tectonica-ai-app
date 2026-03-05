import { createClient } from "@/lib/supabase/server";
import DashboardShell from "@/components/DashboardShell";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName =
    user?.user_metadata?.full_name || user?.email || "Organizer";

  // Fetch user's favorite bots — graceful fallback to defaults
  let initialFavorites: string[] | undefined;
  if (user) {
    try {
      const { data } = await supabase
        .from("user_favorite_bots")
        .select("bot_slug")
        .eq("user_id", user.id)
        .order("position", { ascending: true });

      if (data && data.length > 0) {
        initialFavorites = data.map((f) => f.bot_slug);
      }
    } catch {
      // Table may not exist yet
    }
  }

  return (
    <DashboardShell
      userName={displayName}
      initialFavorites={initialFavorites}
    />
  );
}
