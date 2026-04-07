import { NextResponse } from "next/server";
// LEGACY — fundraising_goal in fundraising_goals is superseded by money_goal in group_goals.
// This route still returns historical data for chart display. The goal field in the
// response reflects the legacy per-month value, not the current group_goals target.
import { requireAuth } from "@/lib/api-utils";

/**
 * GET /api/fundraising/history
 * Returns the last 8 months of fundraising data for the user's group.
 */
export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { profile, supabase } = auth;

    if (!profile.group_id) {
      return NextResponse.json({ history: [] });
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

    return NextResponse.json({ history });
  } catch (err) {
    console.error("Fundraising history fetch failed:", err);
    return NextResponse.json({ error: "Failed to fetch fundraising history" }, { status: 500 });
  }
}
