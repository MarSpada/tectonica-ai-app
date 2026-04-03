import { createClient } from "@/lib/supabase/server";

interface WeekBucket {
  week: string;
  hours: number;
}

/**
 * GET /api/hours/history
 * Returns volunteer hours aggregated by week (last 8 weeks) for the user's group.
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
      return Response.json({ weeks: [] });
    }

    // Get entries from the last 8 weeks
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
    const cutoff = eightWeeksAgo.toISOString().split("T")[0];

    const { data: entries } = await supabase
      .from("volunteer_hours")
      .select("activity_date, hours")
      .eq("group_id", profile.group_id)
      .gte("activity_date", cutoff)
      .order("activity_date", { ascending: true });

    // Aggregate by week (Monday-start)
    const weekMap = new Map<string, number>();

    // Pre-fill 8 weeks with zeros
    for (let i = 7; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      const weekStart = getWeekStart(d);
      weekMap.set(weekStart, 0);
    }

    for (const entry of entries || []) {
      const weekStart = getWeekStart(new Date(entry.activity_date));
      weekMap.set(weekStart, (weekMap.get(weekStart) || 0) + Number(entry.hours));
    }

    const weeks: WeekBucket[] = Array.from(weekMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, hours]) => ({ week, hours: Math.round(hours * 10) / 10 }));

    return Response.json({ weeks });
  } catch (err) {
    console.error("Hours history fetch failed:", err);
    return Response.json({ error: "Failed to fetch hours history" }, { status: 500 });
  }
}

/** Returns the Monday of the week containing the given date as YYYY-MM-DD */
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}
