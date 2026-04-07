import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import { isSuperAdmin } from "@/lib/constants/roles";

/**
 * PATCH /api/admin/landing-pages/[id]
 * Super admin only. Archives a landing page (sets status to 'archived').
 * Body: { status: "archived" }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { profile, supabase } = auth;

    if (!isSuperAdmin(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    if (body.status !== "archived") {
      return NextResponse.json(
        { error: "Only status 'archived' is supported" },
        { status: 400 },
      );
    }

    const { data: page, error } = await supabase
      .from("group_landing_pages")
      .update({
        status: "archived",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Landing page archive error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!page) {
      return NextResponse.json({ error: "Landing page not found" }, { status: 404 });
    }

    return NextResponse.json({ landing_page: page });
  } catch (err) {
    console.error("Landing page PATCH failed:", err);
    return NextResponse.json(
      { error: "Failed to update landing page" },
      { status: 500 },
    );
  }
}
