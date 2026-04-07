import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import { isSuperAdmin } from "@/lib/constants/roles";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { profile, supabase } = auth;

    if (!isSuperAdmin(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!profile.group_id) {
      return NextResponse.json({ topups: [] });
    }

    const { data: topups, error } = await supabase
      .from("group_billing_topups")
      .select("id, amount_usd, note, created_at, added_by_user_id")
      .eq("group_id", profile.group_id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Topups fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich with profile names
    const userIds = new Set<string>();
    for (const t of topups || []) {
      userIds.add(t.added_by_user_id);
    }

    let profileMap: Record<
      string,
      { full_name: string | null }
    > = {};
    if (userIds.size > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", [...userIds]);

      for (const p of profiles || []) {
        profileMap[p.id] = { full_name: p.full_name };
      }
    }

    const enriched = (topups || []).map((t) => ({
      id: t.id,
      amount_usd: t.amount_usd,
      note: t.note,
      created_at: t.created_at,
      added_by_name: profileMap[t.added_by_user_id]?.full_name || "Unknown",
    }));

    return NextResponse.json({ topups: enriched });
  } catch (err) {
    console.error("Topups list failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch top-up history" },
      { status: 500 },
    );
  }
}
