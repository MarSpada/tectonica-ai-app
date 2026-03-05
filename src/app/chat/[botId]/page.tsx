import { createClient } from "@/lib/supabase/server";
import { bots } from "@/lib/bots";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import ChatView from "@/components/chat/ChatView";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ botId: string }>;
}) {
  const { botId } = await params;
  const bot = bots.find((b) => b.id === botId);
  if (!bot) redirect("/");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName =
    user?.user_metadata?.full_name || user?.email || "Organizer";

  // Fetch recent conversations — graceful fallback
  let recentConversations: Array<{
    id: string;
    title: string;
    updated_at: string;
  }> = [];
  try {
    const { data } = await supabase
      .from("conversations")
      .select("id, title, updated_at")
      .eq("bot_id", botId)
      .eq("user_id", user?.id)
      .order("updated_at", { ascending: false })
      .limit(20);
    if (data) recentConversations = data;
  } catch {
    // Tables don't exist yet — that's fine
  }

  return (
    <AppShell userName={displayName}>
      <ChatView
        bot={bot}
        userName={displayName.split(" ")[0]}
        recentConversations={recentConversations}
      />
    </AppShell>
  );
}
