import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("group_id")
      .eq("id", user.id)
      .single();

    if (!profile?.group_id) {
      return Response.json({ goals: null });
    }

    const { data: goals } = await supabase
      .from("group_goals")
      .select("*")
      .eq("group_id", profile.group_id)
      .single();

    return Response.json({ goals: goals || null });
  } catch (err) {
    console.error("Goals fetch failed:", err);
    return Response.json({ error: "Failed to fetch goals" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("group_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || !["super_admin", "group_admin"].includes(profile.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!profile.group_id) {
      return Response.json({ error: "No group assigned" }, { status: 400 });
    }

    const body = await request.json();
    const { money_goal, money_budget, money_raised_offline, members_goal, supporters_goal } = body;

    const updateFields: Record<string, unknown> = {
      group_id: profile.group_id,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    };

    if (money_goal !== undefined) updateFields.money_goal = money_goal;
    if (money_budget !== undefined) updateFields.money_budget = money_budget;
    if (money_raised_offline !== undefined) updateFields.money_raised_offline = money_raised_offline;
    if (members_goal !== undefined) updateFields.members_goal = members_goal;
    if (supporters_goal !== undefined) updateFields.supporters_goal = supporters_goal;

    const { data, error } = await supabase
      .from("group_goals")
      .upsert(updateFields, { onConflict: "group_id" })
      .select()
      .single();

    if (error) {
      console.error("Goals upsert error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ goals: data });
  } catch (err) {
    console.error("Goals update failed:", err);
    return Response.json({ error: "Failed to update goals" }, { status: 500 });
  }
}
