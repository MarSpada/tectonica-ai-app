import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/constants/roles";
import { requireAuth } from "@/lib/api-utils";

// GET — list all calendar sources for the admin's group
export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { profile, supabase } = auth;

    if (!isSuperAdmin(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!profile.group_id) {
      return NextResponse.json({ error: "No group assigned" }, { status: 403 });
    }

    const { data: sources, error } = await supabase
      .from("calendar_sources")
      .select("*")
      .eq("group_id", profile.group_id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ sources: sources || [] });
  } catch (err) {
    console.error("Fetch calendar sources failed:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST — add a new calendar source
export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, profile, supabase } = auth;

    if (!isSuperAdmin(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!profile.group_id) {
      return NextResponse.json({ error: "No group assigned" }, { status: 403 });
    }

    const body = await request.json();
    const { name, feedUrl, provider, color } = body;

    if (!name?.trim() || !feedUrl?.trim()) {
      return NextResponse.json({ error: "Name and feed URL are required" }, { status: 400 });
    }

    const { data: source, error } = await supabase
      .from("calendar_sources")
      .insert({
        group_id: profile.group_id,
        org_id: profile.org_id,
        name: name.trim(),
        feed_url: feedUrl.trim(),
        provider: provider || "ical",
        color: color || "#7C3AED",
        created_by: user.id,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ source });
  } catch (err) {
    console.error("Create calendar source failed:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
