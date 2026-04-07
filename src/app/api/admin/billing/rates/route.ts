import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import { isSuperAdmin } from "@/lib/constants/roles";

export async function PATCH(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { profile, supabase } = auth;

    if (!isSuperAdmin(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!profile.group_id || !profile.org_id) {
      return NextResponse.json(
        { error: "No group or org assigned" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { cost_per_mp_base, cost_per_mp_extra, platform_fee_percentage } =
      body;

    const updateFields: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (cost_per_mp_base !== undefined) {
      if (typeof cost_per_mp_base !== "number" || cost_per_mp_base < 0) {
        return NextResponse.json(
          { error: "cost_per_mp_base must be a non-negative number" },
          { status: 400 },
        );
      }
      updateFields.cost_per_mp_base = cost_per_mp_base;
    }

    if (cost_per_mp_extra !== undefined) {
      if (typeof cost_per_mp_extra !== "number" || cost_per_mp_extra < 0) {
        return NextResponse.json(
          { error: "cost_per_mp_extra must be a non-negative number" },
          { status: 400 },
        );
      }
      updateFields.cost_per_mp_extra = cost_per_mp_extra;
    }

    if (platform_fee_percentage !== undefined) {
      if (
        platform_fee_percentage !== null &&
        (typeof platform_fee_percentage !== "number" ||
          platform_fee_percentage < 0)
      ) {
        return NextResponse.json(
          { error: "platform_fee_percentage must be a non-negative number or null" },
          { status: 400 },
        );
      }
      updateFields.platform_fee_percentage = platform_fee_percentage;
    }

    // Upsert — create row with defaults if it doesn't exist
    const { data: billing, error } = await supabase
      .from("group_billing")
      .upsert(
        {
          group_id: profile.group_id,
          org_id: profile.org_id,
          ...updateFields,
        },
        { onConflict: "group_id" },
      )
      .select()
      .single();

    if (error) {
      console.error("Rates update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ billing });
  } catch (err) {
    console.error("Rates update failed:", err);
    return NextResponse.json(
      { error: "Failed to update rates" },
      { status: 500 },
    );
  }
}
