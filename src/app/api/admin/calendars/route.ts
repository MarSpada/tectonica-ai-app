import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/constants/roles";

// GET — list all calendar sources for the admin's org
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id || !isSuperAdmin(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: sources, error } = await supabase
      .from("calendar_sources")
      .select("*")
      .eq("org_id", profile.org_id)
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
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id || !isSuperAdmin(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, feedUrl, provider, color } = body;

    if (!name?.trim() || !feedUrl?.trim()) {
      return NextResponse.json({ error: "Name and feed URL are required" }, { status: 400 });
    }

    const { data: source, error } = await supabase
      .from("calendar_sources")
      .insert({
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
