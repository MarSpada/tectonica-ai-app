import { createClient } from "@/lib/supabase/server";

const NB_TOKEN = process.env.NATIONBUILDER_API_TOKEN;
const NB_SLUG = process.env.NATIONBUILDER_SLUG;

export async function GET() {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ signups: [], assignments: [] });
    }

    if (!NB_TOKEN || !NB_SLUG) {
      return Response.json({ signups: [], assignments: [] });
    }

    // Fetch last 3 signups from NationBuilder v2 API (read-only)
    const url = `https://${NB_SLUG}.nationbuilder.com/api/v2/signups?sort=-created_at&page[size]=3`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${NB_TOKEN}`,
        Accept: "application/json",
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!res.ok) {
      console.error(`NationBuilder API error: ${res.status} ${res.statusText}`);
      return Response.json({ signups: [], assignments: [] });
    }

    const json = await res.json();
    const data = json.data ?? [];

    const signups = data.map(
      (person: {
        id: string;
        attributes?: {
          first_name?: string;
          last_name?: string;
          email?: string;
          phone_number?: string;
          mobile_number?: string;
          created_at?: string;
        };
      }) => ({
        id: String(person.id),
        name: [person.attributes?.first_name, person.attributes?.last_name]
          .filter(Boolean)
          .join(" ") || "Unknown",
        email: person.attributes?.email || "",
        phone: person.attributes?.phone_number || person.attributes?.mobile_number || "",
        created_at: person.attributes?.created_at || "",
      })
    );

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
    return Response.json({ signups: [], assignments: [] });
  }
}
