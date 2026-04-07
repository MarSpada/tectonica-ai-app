import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import { isSuperAdmin } from "@/lib/constants/roles";

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { profile, supabase } = auth;

  if (!isSuperAdmin(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: bots } = await supabase
    .from("bots")
    .select("id, slug, name, icon, category, description, system_prompt, model_id")
    .or(`org_id.eq.${profile.org_id},org_id.is.null`)
    .order("name");

  return NextResponse.json({ bots: bots || [] });
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { profile, supabase } = auth;

  if (!isSuperAdmin(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { slug, name, icon, category, description, system_prompt, model_id } = body;

  if (!slug?.trim() || !name?.trim()) {
    return NextResponse.json({ error: "Slug and name are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("bots")
    .insert({
      slug: slug.trim(),
      name: name.trim(),
      icon: icon?.trim() || "smart_toy",
      category: category || "advisors",
      description: description?.trim() || "",
      system_prompt: system_prompt || null,
      model_id: model_id || null,
      org_id: profile.org_id,
    })
    .select("id, slug, name")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "A bot with this slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bot: data });
}
