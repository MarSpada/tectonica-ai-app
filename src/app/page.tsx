import { createClient } from "@/lib/supabase/server";
import { getBots } from "@/lib/bot-resolver";
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

  // Fetch user's org_id for scoping bot list
  let orgId: string | undefined;
  if (user) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single();
    orgId = prof?.org_id ?? undefined;
  }

  // Fetch bots from DB (admin-editable names), fallback to hardcoded
  const dbBots = await getBots(orgId);

  return (
    <DashboardShell
      userName={displayName}
      initialFavorites={initialFavorites}
      initialBots={dbBots}
    />
  );
}
