import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import { isSuperAdmin } from "@/lib/constants/roles";

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, profile, supabase } = auth;

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
    const { amount_usd, note } = body;

    if (typeof amount_usd !== "number" || amount_usd <= 0) {
      return NextResponse.json(
        { error: "amount_usd must be a positive number" },
        { status: 400 },
      );
    }

    // Insert audit record
    const { error: topupError } = await supabase
      .from("group_billing_topups")
      .insert({
        group_id: profile.group_id,
        org_id: profile.org_id,
        added_by_user_id: user.id,
        amount_usd,
        note: note || null,
      });

    if (topupError) {
      console.error("Topup insert error:", topupError);
      return NextResponse.json(
        { error: topupError.message },
        { status: 500 },
      );
    }

    // Select-then-update pattern is safe here: only super_admins call this route
    // (low concurrency). The high-frequency debit path uses the atomic
    // debit_image_credit RPC instead.

    // Check if group_billing row exists
    const { data: existing } = await supabase
      .from("group_billing")
      .select("id, credit_balance_usd")
      .eq("group_id", profile.group_id)
      .single();

    let billing;

    if (existing) {
      // Increment existing balance
      const newBalance =
        parseFloat(String(existing.credit_balance_usd)) + amount_usd;
      const { data, error } = await supabase
        .from("group_billing")
        .update({
          credit_balance_usd: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) {
        console.error("Billing update error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      billing = data;
    } else {
      // Create new row with the top-up amount as starting balance
      const { data, error } = await supabase
        .from("group_billing")
        .insert({
          group_id: profile.group_id,
          org_id: profile.org_id,
          credit_balance_usd: amount_usd,
        })
        .select()
        .single();

      if (error) {
        console.error("Billing insert error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      billing = data;
    }

    return NextResponse.json({ billing });
  } catch (err) {
    console.error("Topup failed:", err);
    return NextResponse.json(
      { error: "Failed to process top-up" },
      { status: 500 },
    );
  }
}
