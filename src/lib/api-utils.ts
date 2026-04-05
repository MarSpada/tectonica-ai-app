import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

interface AuthResult {
  user: { id: string; email?: string };
  profile: {
    role: string;
    group_id: string | null;
    org_id: string | null;
  };
  supabase: SupabaseClient;
}

/**
 * Shared auth + profile lookup for API routes.
 * Returns { user, profile, supabase } on success, or a NextResponse 401 on failure.
 *
 * Usage:
 * ```ts
 * const auth = await requireAuth();
 * if (auth instanceof NextResponse) return auth;
 * const { user, profile, supabase } = auth;
 * ```
 */
export async function requireAuth(): Promise<AuthResult | NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, group_id, org_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 401 });
  }

  return { user, profile, supabase };
}

/**
 * Batch-fetch profile names and avatars for a set of user IDs.
 * Returns a map from user ID to { full_name, avatar_url }.
 *
 * Usage:
 * ```ts
 * const ids = new Set<string>();
 * items.forEach(i => ids.add(i.created_by));
 * const profileMap = await fetchProfileMap(supabase, ids);
 * const name = profileMap[userId]?.full_name || "Unknown";
 * ```
 */
export async function fetchProfileMap(
  supabase: SupabaseClient,
  userIds: Set<string>
): Promise<Record<string, { full_name: string | null; avatar_url: string | null }>> {
  if (userIds.size === 0) return {};

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", [...userIds]);

  const map: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
  for (const p of profiles || []) {
    map[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
  }
  return map;
}
