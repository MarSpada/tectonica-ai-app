import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Get user's group
    const { data: profile } = await supabase
      .from("profiles")
      .select("group_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.group_id) {
      return Response.json({ goal: null });
    }

    // Get current month (first of month)
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    // Fetch current month goal
    const { data: goal } = await supabase
      .from("fundraising_goals")
      .select("*")
      .eq("group_id", profile.group_id)
      .eq("month", currentMonth)
      .single();

    return Response.json({
      goal: goal || {
        fundraising_goal: 0,
        amount_raised: 0,
        print_budget: 0,
        month: currentMonth,
      },
      isAdmin: ["super_admin", "group_admin"].includes(profile.role),
    });
  } catch (err) {
    console.error("Fundraising fetch failed:", err);
    return Response.json({ error: "Failed to fetch fundraising data" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Check admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("group_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || !["super_admin", "group_admin"].includes(profile.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { fundraising_goal, amount_raised, print_budget } = body;

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    // Upsert: create if doesn't exist, update if it does
    const { data, error } = await supabase
      .from("fundraising_goals")
      .upsert(
        {
          group_id: profile.group_id,
          month: currentMonth,
          ...(fundraising_goal !== undefined && { fundraising_goal }),
          ...(amount_raised !== undefined && { amount_raised }),
          ...(print_budget !== undefined && { print_budget }),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "group_id,month" }
      )
      .select()
      .single();

    if (error) {
      console.error("Fundraising upsert error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ goal: data });
  } catch (err) {
    console.error("Fundraising update failed:", err);
    return Response.json({ error: "Failed to update fundraising data" }, { status: 500 });
  }
}
