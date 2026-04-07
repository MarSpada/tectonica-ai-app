import { NextResponse } from "next/server";
import { requireAuth, fetchProfileMap } from "@/lib/api-utils";
import { isAdminRole } from "@/lib/constants/roles";

/**
 * GET /api/admin/landing-pages
 * Returns all landing pages for the authenticated user's group.
 * Accessible to super_admin and group_admin.
 * Ordered by created_at DESC. Includes created_by_name via profile join.
 */
export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { profile, supabase } = auth;

    if (!isAdminRole(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!profile.group_id) {
      return NextResponse.json({ error: "No group assigned" }, { status: 400 });
    }

    const { data: pages, error } = await supabase
      .from("group_landing_pages")
      .select("*")
      .eq("group_id", profile.group_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Landing pages fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich with creator names
    const userIds = new Set<string>();
    for (const page of pages || []) {
      if (page.created_by) userIds.add(page.created_by);
    }
    const profileMap = await fetchProfileMap(supabase, userIds);

    const enriched = (pages || []).map((page) => ({
      ...page,
      created_by_name: page.created_by
        ? profileMap[page.created_by]?.full_name || "Unknown"
        : "System",
    }));

    return NextResponse.json({ landing_pages: enriched });
  } catch (err) {
    console.error("Landing pages GET failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch landing pages" },
      { status: 500 },
    );
  }
}
