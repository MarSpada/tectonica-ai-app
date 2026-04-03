import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, org_id")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id || profile.role !== "super_admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: orgLayout } = await supabase
      .from("dashboard_layouts_default")
      .select("layout, updated_at, created_by")
      .eq("org_id", profile.org_id)
      .single();

    return Response.json({
      layout: orgLayout?.layout || null,
      updated_at: orgLayout?.updated_at || null,
    });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, org_id")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id || profile.role !== "super_admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    if (!Array.isArray(body.layout)) {
      return Response.json({ error: "layout must be an array" }, { status: 400 });
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

    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, org_id")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id || profile.role !== "super_admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await supabase
      .from("dashboard_layouts_default")
      .delete()
      .eq("org_id", profile.org_id);

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
