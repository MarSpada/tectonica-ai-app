import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import { isAdminRole } from "@/lib/constants/roles";
import type { UserRole } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { profile, supabase } = auth;

    if (!isAdminRole(profile.role as UserRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!profile.group_id) {
      return NextResponse.json({ error: "No group assigned" }, { status: 400 });
    }

    const { userId } = await params;

    // Validate target user belongs to same group
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("id, group_id, full_name")
      .eq("id", userId)
      .single();

    if (!targetProfile || targetProfile.group_id !== profile.group_id) {
      return NextResponse.json({ error: "User not found in group" }, { status: 404 });
    }

    // Fetch all entries for this user in this group
    const { data: entries, error } = await supabase
      .from("volunteer_hours")
      .select("id, hours, description, activity_date, created_at")
      .eq("user_id", userId)
      .eq("group_id", profile.group_id)
      .order("activity_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate totals
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];

    const total_hours = (entries || []).reduce((sum, e) => sum + Number(e.hours), 0);
    const this_month_hours = (entries || [])
      .filter((e) => e.activity_date >= monthStart)
      .reduce((sum, e) => sum + Number(e.hours), 0);

    return NextResponse.json({
      entries: entries || [],
      total_hours,
      this_month_hours,
      user_name: targetProfile.full_name || "Unknown",
    });
  } catch (err) {
    console.error("Fetch user hours failed:", err);
    return NextResponse.json({ error: "Failed to fetch user hours" }, { status: 500 });
  }
}
