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
      // Merge: use DB names/descriptions but keep hardcoded icons as fallback
      // (DB may store old Material Icons strings that don't match Streamline map)
      const dbMap = new Map(dbBots.map((b) => [b.slug, b]));
      const merged = hardcodedBots.map((hb) => {
        const db = dbMap.get(hb.id);
        if (!db) return hb;
        return {
          ...hb,
          name: db.name || hb.name,
          description: db.description || hb.description,
          category: (db.category as BotCategory) || hb.category,
          // Keep hardcoded icon unless DB icon looks like a Streamline name (contains "bot-")
          icon: db.icon?.startsWith("bot-") ? db.icon : hb.icon,
        };
      });
      // Add any DB-only bots not in the hardcoded list
      for (const db of dbBots) {
        if (!hardcodedBots.find((hb) => hb.id === db.slug)) {
          merged.push({
            id: db.slug,
            name: db.name,
            icon: db.icon,
            category: db.category as BotCategory,
            description: db.description || "",
          });
        }
      }
      return merged;
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
