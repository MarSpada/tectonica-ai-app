import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { parseIcs } from "@/lib/ical-parser";

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string | null;
  location: string | null;
  description: string | null;
  sourceName: string;
  sourceColor: string;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ events: [] });

    // Get user's org
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id) return NextResponse.json({ events: [] });

    // Fetch enabled calendar sources for this org
    const { data: sources } = await supabase
      .from("calendar_sources")
      .select("*")
      .eq("org_id", profile.org_id)
      .eq("enabled", true);

    if (!sources || sources.length === 0) {
      return NextResponse.json({ events: [] });
    }

    const now = new Date();
    const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const allEvents: CalendarEvent[] = [];

    // Fetch and parse each ICS feed
    for (const source of sources) {
      try {
        const res = await fetch(source.feed_url, {
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) continue;

        const icsText = await res.text();
        const parsed = parseIcs(icsText);

        for (const event of parsed) {
          if (!event.start || event.start < now || event.start > thirtyDaysOut) continue;

          allEvents.push({
            id: `${source.id}-${event.uid}`,
            title: event.summary,
            start: event.start.toISOString(),
            end: event.end ? event.end.toISOString() : null,
            location: event.location,
            description: event.description,
            sourceName: source.name,
            sourceColor: source.color || "#7C3AED",
          });
        }
      } catch (err) {
        console.error(`Failed to fetch calendar source "${source.name}":`, err);
      }
    }

    // Sort by start date ascending
    allEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    return NextResponse.json({ events: allEvents.slice(0, 20) });
  } catch (err) {
    console.error("Events fetch failed:", err);
    return NextResponse.json({ events: [] });
  }
}
