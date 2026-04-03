import { createClient } from "@/lib/supabase/server";
import {
  SYSTEM_DEFAULT_LAYOUT,
  filterLayoutToRole,
  mergeLayoutWithDefaults,
} from "@/lib/dashboard-widgets";
import type { UserRole } from "@/lib/types";

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

    if (!profile) return Response.json({ error: "Profile not found" }, { status: 404 });

    const role = (profile.role || "member") as UserRole;

    // 1. Check user layout
    if (profile.org_id) {
      const { data: userLayout } = await supabase
        .from("dashboard_layouts_user")
        .select("layout")
        .eq("user_id", user.id)
        .eq("org_id", profile.org_id)
        .single();

      if (userLayout?.layout) {
        const merged = mergeLayoutWithDefaults(userLayout.layout, role);
        const filtered = filterLayoutToRole(merged, role);
        return Response.json({ layout: filtered, source: "user" });
      }

      // 2. Check org default
      const { data: orgLayout } = await supabase
        .from("dashboard_layouts_default")
        .select("layout")
        .eq("org_id", profile.org_id)
        .single();

      if (orgLayout?.layout) {
        const merged = mergeLayoutWithDefaults(orgLayout.layout, role);
        const filtered = filterLayoutToRole(merged, role);
        return Response.json({ layout: filtered, source: "org" });
      }
    }

    // 3. Fall back to system default
    const filtered = filterLayoutToRole(SYSTEM_DEFAULT_LAYOUT, role);
    return Response.json({ layout: filtered, source: "system" });
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
      .select("org_id")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id) return Response.json({ error: "No organization" }, { status: 400 });

    const body = await request.json();
    if (!Array.isArray(body.layout)) {
      return Response.json({ error: "layout must be an array" }, { status: 400 });
    }

    const { error } = await supabase
      .from("dashboard_layouts_user")
      .upsert(
        {
          user_id: user.id,
          org_id: profile.org_id,
          layout: body.layout,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,org_id" }
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
      .select("org_id")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id) return Response.json({ error: "No organization" }, { status: 400 });

    await supabase
      .from("dashboard_layouts_user")
      .delete()
      .eq("user_id", user.id)
      .eq("org_id", profile.org_id);

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
