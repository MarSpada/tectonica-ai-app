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
  let totalConversationCount = 0;
  let recentConversations: Array<{
    id: string;
    title: string;
    updated_at: string;
  }> = [];
  try {
    const { data, count } = await supabase
      .from("conversations")
      .select("id, title, updated_at", { count: "exact" })
      .eq("bot_id", botId)
      .eq("user_id", user?.id)
      .order("updated_at", { ascending: false })
      .limit(20);
    if (data) recentConversations = data;
    totalConversationCount = count ?? data?.length ?? 0;
  } catch {
    // Tables don't exist yet — that's fine
  }

  // Check if this bot has image tools enabled (DB-driven)
  let isImageBot = false;
  let orgSlug = "";
  try {
    const { data: botRow } = await supabase
      .from("bots")
      .select("image_tools_enabled")
      .eq("slug", botId)
      .single();
    isImageBot = !!botRow?.image_tools_enabled;

    if (isImageBot && user) {
      // Get org name/slug for Studio iframe user_id param
      const { data: profile } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("id", user.id)
        .single();
      if (profile?.org_id) {
        const { data: org } = await supabase
          .from("organizations")
          .select("name")
          .eq("id", profile.org_id)
          .single();
        orgSlug = org?.name ?? "Tectonica";
      }
    }
  } catch {
    // Graceful fallback — image tools just won't be available
  }

  return (
    <AppShell userName={displayName}>
      <ChatView
        bot={bot}
        userName={displayName.split(" ")[0]}
        recentConversations={recentConversations}
        totalConversationCount={totalConversationCount}
        isImageBot={isImageBot}
        orgSlug={orgSlug}
      />
    </AppShell>
  );
}
