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
      return Response.json({ signups: [] });
    }

    if (!NB_TOKEN || !NB_SLUG) {
      return Response.json({ signups: [] });
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
      return Response.json({ signups: [] });
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
          created_at?: string;
        };
      }) => ({
        id: String(person.id),
        name: [person.attributes?.first_name, person.attributes?.last_name]
          .filter(Boolean)
          .join(" ") || "Unknown",
        email: person.attributes?.email || "",
        created_at: person.attributes?.created_at || "",
      })
    );

    return Response.json({ signups });
  } catch (err) {
    console.error("NationBuilder fetch failed:", err);
    return Response.json({ signups: [] });
  }
}
