import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/* POST /api/media/links — create a link-type media item */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check role — supporters blocked
  const { data: profile } = await supabase
    .from("profiles")
    .select("group_id, role")
    .eq("id", user.id)
    .single();
  if (!profile?.group_id) {
    return NextResponse.json({ error: "No group assigned" }, { status: 400 });
  }
  if (profile.role === "supporter") {
    return NextResponse.json({ error: "Supporters cannot add media" }, { status: 403 });
  }

  const body = await req.json();
  const { url, title, description } = body as {
    url?: string;
    title?: string;
    description?: string;
  };

  if (!url || !title) {
    return NextResponse.json(
      { error: "Both url and title are required for links" },
      { status: 400 }
    );
  }

  // Basic URL validation
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const { data: item, error } = await supabase
    .from("media_items")
    .insert({
      group_id: profile.group_id,
      uploaded_by: user.id,
      category: "link",
      file_name: title,
      url,
      title,
      description: description || null,
      status: "ready",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item }, { status: 201 });
}
