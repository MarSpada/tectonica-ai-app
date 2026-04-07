import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import { isSuperAdmin } from "@/lib/constants/roles";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { profile, supabase } = auth;

    if (!profile.org_id || !isSuperAdmin(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: orgLayout } = await supabase
      .from("dashboard_layouts_default")
      .select("layout, updated_at, created_by")
      .eq("org_id", profile.org_id)
      .single();

    return NextResponse.json({
      layout: orgLayout?.layout || null,
      updated_at: orgLayout?.updated_at || null,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, profile, supabase } = auth;

    if (!profile.org_id || !isSuperAdmin(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    if (!Array.isArray(body.layout)) {
      return NextResponse.json({ error: "layout must be an array" }, { status: 400 });
    }

    const { error } = await supabase
      .from("dashboard_layouts_default")
      .upsert(
        {
          org_id: profile.org_id,
          layout: body.layout,
          created_by: user.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "org_id" }
      );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { profile, supabase } = auth;

    if (!profile.org_id || !isSuperAdmin(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await supabase
      .from("dashboard_layouts_default")
      .delete()
      .eq("org_id", profile.org_id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
