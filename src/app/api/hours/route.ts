import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { HourEntry } from "@/lib/types";

// GET — list volunteer hours for the user's group
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("group_id")
      .eq("id", user.id)
      .single();

    if (!profile?.group_id) return NextResponse.json({ entries: [], total: 0, thisWeek: 0 });

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");

    // Fetch hours entries
    const { data: entries } = await supabase
      .from("volunteer_hours")
      .select("*")
      .eq("group_id", profile.group_id)
      .order("activity_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    // Enrich with user names
    const enriched: HourEntry[] = [];
    if (entries && entries.length > 0) {
      const userIds = [...new Set(entries.map((e) => e.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.id, p])
      );

      for (const entry of entries) {
        const p = profileMap.get(entry.user_id);
        enriched.push({
          ...entry,
          user_name: p?.full_name || "Unknown",
          user_avatar: p?.avatar_url || null,
        });
      }
    }

    // Calculate totals
    const total = enriched.reduce((sum, e) => sum + Number(e.hours), 0);

    // This week's hours
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const thisWeek = enriched
      .filter((e) => new Date(e.activity_date) >= weekStart)
      .reduce((sum, e) => sum + Number(e.hours), 0);

    return NextResponse.json({ entries: enriched, total, thisWeek });
  } catch (err) {
    console.error("Fetch volunteer hours failed:", err);
    return NextResponse.json({ error: "Failed to fetch volunteer hours" }, { status: 500 });
  }
}

// POST — log volunteer hours
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("group_id")
      .eq("id", user.id)
      .single();

    if (!profile?.group_id) {
      return NextResponse.json({ error: "No group found" }, { status: 400 });
    }

    const body = await request.json();
    const { hours, description, activityDate } = body;

    if (!hours || hours <= 0 || hours > 24) {
      return NextResponse.json({ error: "Hours must be between 0 and 24" }, { status: 400 });
    }

    const { data: entry, error } = await supabase
      .from("volunteer_hours")
      .insert({
        user_id: user.id,
        group_id: profile.group_id,
        hours,
        description: description?.trim() || null,
        activity_date: activityDate || new Date().toISOString().split("T")[0],
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ entry });
  } catch (err) {
    console.error("Log volunteer hours failed:", err);
    return NextResponse.json({ error: "Failed to log hours" }, { status: 500 });
  }
}
