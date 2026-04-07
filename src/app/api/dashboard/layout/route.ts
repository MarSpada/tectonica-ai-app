import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import {
  SYSTEM_DEFAULT_LAYOUT,
  filterLayoutToRole,
  mergeLayoutWithDefaults,
} from "@/lib/dashboard-widgets";
import { ROLES } from "@/lib/constants/roles";
import type { UserRole } from "@/lib/types";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, profile, supabase } = auth;

    const role = (profile.role || ROLES.MEMBER) as UserRole;

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
        return NextResponse.json({ layout: filtered, source: "user" });
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
        return NextResponse.json({ layout: filtered, source: "org" });
      }
    }

    // 3. Fall back to system default
    const filtered = filterLayoutToRole(SYSTEM_DEFAULT_LAYOUT, role);
    return NextResponse.json({ layout: filtered, source: "system" });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, profile, supabase } = auth;

    if (!profile.org_id) return NextResponse.json({ error: "No organization" }, { status: 400 });

    const body = await request.json();
    if (!Array.isArray(body.layout)) {
      return NextResponse.json({ error: "layout must be an array" }, { status: 400 });
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
    const { user, profile, supabase } = auth;

    if (!profile.org_id) return NextResponse.json({ error: "No organization" }, { status: 400 });

    await supabase
      .from("dashboard_layouts_user")
      .delete()
      .eq("user_id", user.id)
      .eq("org_id", profile.org_id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
