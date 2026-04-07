import { NextResponse } from "next/server";
import { requireAuth, fetchProfileMap } from "@/lib/api-utils";
import { isAdminRole } from "@/lib/constants/roles";
import type { UserRole } from "@/lib/types";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { profile, supabase } = auth;

    if (!isAdminRole(profile.role as UserRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!profile.group_id) {
      return NextResponse.json({ members: [], total_hours: 0, this_month_hours: 0, active_this_month: 0 });
    }

    // Fetch all volunteer hours for the group
    const { data: entries, error } = await supabase
      .from("volunteer_hours")
      .select("user_id, hours, activity_date")
      .eq("group_id", profile.group_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate month boundary
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];

    // Aggregate per-user
    const userMap = new Map<
      string,
      { total_hours: number; this_month_hours: number; last_logged: string | null }
    >();

    for (const entry of entries || []) {
      const existing = userMap.get(entry.user_id) || {
        total_hours: 0,
        this_month_hours: 0,
        last_logged: null,
      };

      const hours = Number(entry.hours);
      existing.total_hours += hours;

      if (entry.activity_date >= monthStart) {
        existing.this_month_hours += hours;
      }

      if (!existing.last_logged || entry.activity_date > existing.last_logged) {
        existing.last_logged = entry.activity_date;
      }

      userMap.set(entry.user_id, existing);
    }

    // Fetch all group members (including those with 0 hours)
    const { data: groupMembers } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("group_id", profile.group_id);

    // Enrich with profile names/avatars
    const allUserIds = new Set((groupMembers || []).map((m) => m.id));
    const profileMap = await fetchProfileMap(supabase, allUserIds);

    // Build response array — include all members, not just those with hours
    const members = (groupMembers || []).map((member) => {
      const stats = userMap.get(member.id);
      const prof = profileMap[member.id];
      return {
        user_id: member.id,
        name: prof?.full_name || "Unknown",
        avatar_url: prof?.avatar_url || null,
        role: member.role as string,
        total_hours: stats?.total_hours || 0,
        this_month_hours: stats?.this_month_hours || 0,
        last_logged: stats?.last_logged || null,
      };
    });

    // Sort: this_month_hours DESC, then total_hours DESC
    members.sort((a, b) =>
      b.this_month_hours - a.this_month_hours || b.total_hours - a.total_hours
    );

    // Summary stats
    const total_hours = members.reduce((sum, m) => sum + m.total_hours, 0);
    const this_month_hours = members.reduce((sum, m) => sum + m.this_month_hours, 0);
    const active_this_month = members.filter((m) => m.this_month_hours > 0).length;

    return NextResponse.json({ members, total_hours, this_month_hours, active_this_month });
  } catch (err) {
    console.error("Fetch admin hours failed:", err);
    return NextResponse.json({ error: "Failed to fetch hours" }, { status: 500 });
  }
}
