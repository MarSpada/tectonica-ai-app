import { createClient } from "@/lib/supabase/server";
import { bots as hardcodedBots, type Bot, type BotCategory } from "./bots";
import { getSystemPrompt as getHardcodedPrompt } from "./bots-prompts";

/**
 * Reads bots from the database first, falls back to hardcoded bots.ts.
 * Used in server contexts (API routes, Server Components).
 */
export async function getBots(): Promise<Bot[]> {
  try {
    const supabase = await createClient();
    const { data: dbBots } = await supabase
      .from("bots")
      .select("slug, name, icon, category, description")
      .order("name");

    if (dbBots && dbBots.length > 0) {
      return dbBots.map((b) => ({
        id: b.slug,
        name: b.name,
        icon: b.icon,
        category: b.category as BotCategory,
        description: b.description || "",
      }));
    }
  } catch {
    // Fallback to hardcoded
  }
  return hardcodedBots;
}

/**
 * Gets the system prompt for a bot. Checks DB first (where admins may have
 * customized it), falls back to the hardcoded prompts in bots-prompts.ts.
 */
export async function getSystemPrompt(botId: string): Promise<string> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("bots")
      .select("system_prompt")
      .eq("slug", botId)
      .single();

    if (data?.system_prompt) {
      return data.system_prompt;
    }
  } catch {
    // Fallback
  }
  return getHardcodedPrompt(botId);
}
