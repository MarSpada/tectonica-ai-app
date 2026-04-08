import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import { fetchRecentSignups } from "@/lib/signup-utils";
import { decrypt } from "@/lib/encryption";
import { ROLES } from "@/lib/constants/roles";
import type { NbCredentials } from "@/lib/signup-utils";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, profile, supabase } = auth;

    if (!profile.org_id) {
      return NextResponse.json({ signups: [], assignments: [], status: "not_configured", enabled: false });
    }

    // Fetch NB config from DB via SECURITY DEFINER RPC
    const { data: nbConfig } = await supabase.rpc("get_nb_config", {
      p_org_id: profile.org_id,
    });

    const config = Array.isArray(nbConfig) ? nbConfig[0] : nbConfig;
    const nbEnabled = config?.nb_enabled ?? false;

    // If NB is disabled, return immediately
    if (!nbEnabled) {
      return NextResponse.json({ signups: [], assignments: [], status: "not_configured", enabled: false });
    }

    // Resolve credentials: DB first, then env var fallback
    let credentials: NbCredentials | null = null;

    if (config?.nb_api_token && config?.nb_slug) {
      // DB credentials exist — decrypt token
      try {
        const apiToken = decrypt(config.nb_api_token);
        credentials = { apiToken, slug: config.nb_slug };
      } catch {
        console.error("NB credentials: failed to decrypt stored token");
      }
    }

    if (!credentials) {
      // Fallback to env vars
      const envToken = process.env.NATIONBUILDER_API_TOKEN;
      const envSlug = process.env.NATIONBUILDER_SLUG;

      if (envToken && envSlug) {
        console.warn(
          "NB credentials: using env var fallback — configure via admin panel to remove this warning"
        );
        credentials = { apiToken: envToken, slug: envSlug };
      }
    }

    // No credentials from either source
    if (!credentials) {
      return NextResponse.json({ signups: [], assignments: [], status: "not_configured", enabled: true });
    }

    const result = await fetchRecentSignups(credentials, 50);
    const { signups, status: nbStatus } = result;

    // If NB API returned an error, return early with status
    if (nbStatus !== "connected") {
      return NextResponse.json({ signups: [], assignments: [], status: nbStatus, enabled: true });
    }

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
      if (profile.group_id) {
        const { data: admins } = await supabase
          .from("profiles")
          .select("id, full_name")
          .eq("group_id", profile.group_id)
          .eq("role", ROLES.SUPER_ADMIN)
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

    return NextResponse.json({ signups, assignments, status: "connected", enabled: true });
  } catch (err) {
    console.error("NationBuilder fetch failed:", err);
    return NextResponse.json({ signups: [], assignments: [], status: "error", enabled: false }, { status: 200 });
  }
}
