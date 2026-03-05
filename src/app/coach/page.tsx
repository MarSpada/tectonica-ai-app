import { createClient } from "@/lib/supabase/server";
import { bots } from "@/lib/bots";
import AppShell from "@/components/AppShell";
import CoachChatView from "@/components/coach/CoachChatView";

export default async function CoachPage() {
  const bot = bots.find((b) => b.id === "group-leadership")!;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName =
    user?.user_metadata?.full_name || user?.email || "Organizer";

  return (
    <AppShell userName={displayName}>
      <CoachChatView bot={bot} userName={displayName.split(" ")[0]} />
    </AppShell>
  );
}
