import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/landing-pages/[id]/view
 *
 * Public route — no auth required. Serves a generated landing page as rendered HTML.
 * Supabase Storage forces text/plain + sandbox CSP on .html files, so we proxy
 * through this route to set the correct Content-Type and allow rendering.
 *
 * Uses the Supabase anon key (not service role) since the landing-pages bucket is public.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Look up the landing page record to get the storage path
  const { data: page, error: dbError } = await supabase
    .from("group_landing_pages")
    .select("id, group_id, public_url, status")
    .eq("id", id)
    .single();

  if (dbError || !page) {
    return new Response("Landing page not found", { status: 404 });
  }

  if (page.status === "archived") {
    return new Response("This landing page has been archived", { status: 410 });
  }

  // Download HTML from Storage
  const storagePath = `${page.group_id}/${page.id}.html`;
  const { data: fileData, error: downloadError } = await supabase.storage
    .from("landing-pages")
    .download(storagePath);

  if (downloadError || !fileData) {
    return new Response("Landing page content not found", { status: 404 });
  }

  const html = await fileData.text();

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
