import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/fundraising/history
 * Returns the last 8 months of fundraising data for the user's group.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("group_id")
      .eq("id", user.id)
      .single();

    if (!profile?.group_id) {
      return Response.json({ history: [] });
    }

    const { data: rows } = await supabase
      .from("fundraising_goals")
      .select("month, amount_raised, fundraising_goal")
      .eq("group_id", profile.group_id)
      .order("month", { ascending: false })
      .limit(8);

    // Reverse to chronological order for chart display
    const history = (rows || []).reverse().map((r) => ({
      month: r.month,
      raised: Number(r.amount_raised),
      goal: Number(r.fundraising_goal),
    }));

    return Response.json({ history });
  } catch (err) {
    console.error("Fundraising history fetch failed:", err);
    return Response.json({ error: "Failed to fetch fundraising history" }, { status: 500 });
  }
}
