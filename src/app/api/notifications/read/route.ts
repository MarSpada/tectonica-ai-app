import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-utils";

export async function POST(req: Request) {
  try {
    const { notificationIds } = await req.json();

    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

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

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Mark notifications read failed:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
