import { NextResponse, type NextRequest } from "next/server";
import { isSuperAdmin } from "@/lib/constants/roles";
import { requireAuth } from "@/lib/api-utils";

// PATCH — update a calendar source (toggle enabled, rename, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { profile, supabase } = auth;

    if (!isSuperAdmin(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!profile.group_id) {
      return NextResponse.json({ error: "No group assigned" }, { status: 403 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.name !== undefined) updates.name = body.name;
    if (body.feedUrl !== undefined) updates.feed_url = body.feedUrl;
    if (body.color !== undefined) updates.color = body.color;
    if (body.enabled !== undefined) updates.enabled = body.enabled;

    const { error } = await supabase
      .from("calendar_sources")
      .update(updates)
      .eq("id", id)
      .eq("group_id", profile.group_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Update calendar source failed:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// DELETE — remove a calendar source
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { profile, supabase } = auth;

    if (!isSuperAdmin(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!profile.group_id) {
      return NextResponse.json({ error: "No group assigned" }, { status: 403 });
    }

    const { error } = await supabase
      .from("calendar_sources")
      .delete()
      .eq("id", id)
      .eq("group_id", profile.group_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete calendar source failed:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
