import { createClient } from "@/lib/supabase/server";
import { fetchRecentSignups } from "@/lib/signup-utils";

export async function GET() {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const signups = await fetchRecentSignups(3);

    // Fetch existing assignments for these signups
    const signupIds = signups.map((s: { id: string }) => s.id);
    const { data: rawAssignments } = await supabase
      .from("signup_assignments")
      .select("id, nb_signup_id, assigned_to, assigned_by, status, created_at")
      .in("nb_signup_id", signupIds);

    // Enrich assignments with assignee names
    const assignments = [];
    if (rawAssignments && rawAssignments.length > 0) {
      const assigneeIds = [...new Set(rawAssignments.map((a: { assigned_to: string }) => a.assigned_to))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", assigneeIds);
      const nameMap = new Map((profiles ?? []).map((p: { id: string; full_name: string }) => [p.id, p.full_name]));

      for (const a of rawAssignments) {
        assignments.push({
          ...a,
          assignee_name: nameMap.get(a.assigned_to) || "Unknown",
        });
      }
    }

    // Auto-assign unassigned signups to the first admin
    const assignedIds = new Set((rawAssignments ?? []).map((a: { nb_signup_id: string }) => a.nb_signup_id));
    const unassigned = signups.filter((s: { id: string }) => !assignedIds.has(s.id));

    if (unassigned.length > 0) {
      // Get caller's group_id
      const { data: profile } = await supabase
        .from("profiles")
        .select("group_id")
        .eq("id", user.id)
        .single();

      if (profile?.group_id) {
        const { data: admins } = await supabase
          .from("profiles")
          .select("id, full_name")
          .eq("group_id", profile.group_id)
          .eq("role", "super_admin")
          .limit(1);

        if (admins?.[0]) {
          for (const signup of unassigned) {
            const { data: newId } = await supabase.rpc("create_signup_assignment", {
              p_nb_signup_id: signup.id,
              p_nb_signup_name: signup.name,
              p_nb_signup_email: signup.email,
              p_nb_signup_phone: signup.phone,
              p_nb_signup_created_at: signup.created_at || null,
              p_assigned_to: admins[0].id,
            });
            if (newId) {
              assignments.push({
                id: newId,
                nb_signup_id: signup.id,
                assigned_to: admins[0].id,
                assigned_by: user.id,
                status: "pending",
                created_at: new Date().toISOString(),
                assignee_name: admins[0].full_name || "Admin",
              });
            }
          }
        }
      }
    }

    return Response.json({ signups, assignments });
  } catch (err) {
    console.error("NationBuilder fetch failed:", err);
    return Response.json({ error: "Failed to fetch signups" }, { status: 500 });
  }
}
