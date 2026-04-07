import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-utils";

// Note: credit_balance_usd can be negative (generation is never blocked by
// insufficient credits). It may also reflect approximate costs when image
// dimensions were unavailable from the fal.ai response and fell back to
// 1024×1024 defaults — see usedFallbackDimensions in billing-utils.ts.

const DEFAULT_RESPONSE = {
  credit_balance_usd: 0,
  cost_per_mp_base: 0.03,
  cost_per_mp_extra: 0.015,
  platform_fee_percentage: null,
  month_spend_usd: 0,
};

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { profile, supabase } = auth;

    if (!profile.group_id) {
      return NextResponse.json(DEFAULT_RESPONSE);
    }

    // Fetch billing row and current month spend in parallel
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [billingResult, spendResult] = await Promise.all([
      supabase
        .from("group_billing")
        .select(
          "credit_balance_usd, cost_per_mp_base, cost_per_mp_extra, platform_fee_percentage",
        )
        .eq("group_id", profile.group_id)
        .single(),
      supabase
        .from("image_generation_log")
        .select("cost_usd")
        .eq("group_id", profile.group_id)
        .gte("created_at", monthStart),
    ]);

    const billing = billingResult.data;
    const spendRows = spendResult.data || [];
    const monthSpend = spendRows.reduce(
      (sum, row) => sum + parseFloat(String(row.cost_usd)),
      0,
    );

    if (!billing) {
      return NextResponse.json({
        ...DEFAULT_RESPONSE,
        month_spend_usd: parseFloat(monthSpend.toFixed(4)),
      });
    }

    return NextResponse.json({
      ...billing,
      month_spend_usd: parseFloat(monthSpend.toFixed(4)),
    });
  } catch (err) {
    console.error("Billing balance fetch failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch billing balance" },
      { status: 500 },
    );
  }
}
