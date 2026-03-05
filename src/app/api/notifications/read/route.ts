import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { notificationIds } = await req.json();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (notificationIds === "all") {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);
    } else if (Array.isArray(notificationIds)) {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .in("id", notificationIds);
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Mark notifications read failed:", err);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}
