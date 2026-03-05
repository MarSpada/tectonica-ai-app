import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ favorites: [] });
    }

    const { data } = await supabase
      .from("user_favorite_bots")
      .select("bot_slug, position")
      .eq("user_id", user.id)
      .order("position", { ascending: true });

    return Response.json({
      favorites: data?.map((f) => f.bot_slug) ?? [],
    });
  } catch {
    return Response.json({ favorites: [] });
  }
}

export async function POST(req: Request) {
  const { botSlug, action, currentFavorites } = await req.json();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Check if user has any saved favorites
    const { data: existing } = await supabase
      .from("user_favorite_bots")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);

    // If no saved favorites yet, seed from the current client-side list
    if ((!existing || existing.length === 0) && currentFavorites?.length > 0) {
      const rows = (currentFavorites as string[]).map((slug, i) => ({
        user_id: user.id,
        bot_slug: slug,
        position: i,
      }));
      await supabase.from("user_favorite_bots").insert(rows);
    }

    // Now perform the action
    if (action === "add") {
      const { data: maxPos } = await supabase
        .from("user_favorite_bots")
        .select("position")
        .eq("user_id", user.id)
        .order("position", { ascending: false })
        .limit(1);

      const nextPos = maxPos && maxPos.length > 0 ? maxPos[0].position + 1 : 0;

      await supabase.from("user_favorite_bots").upsert(
        {
          user_id: user.id,
          bot_slug: botSlug,
          position: nextPos,
        },
        { onConflict: "user_id,bot_slug" }
      );
    } else if (action === "remove") {
      await supabase
        .from("user_favorite_bots")
        .delete()
        .eq("user_id", user.id)
        .eq("bot_slug", botSlug);
    }

    // Return updated list
    const { data } = await supabase
      .from("user_favorite_bots")
      .select("bot_slug")
      .eq("user_id", user.id)
      .order("position", { ascending: true });

    return Response.json({
      favorites: data?.map((f) => f.bot_slug) ?? [],
    });
  } catch {
    return Response.json({ error: "Failed to update favorites" }, { status: 500 });
  }
}
