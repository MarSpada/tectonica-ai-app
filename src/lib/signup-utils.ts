import type { NbSignup } from "./types";

const NB_TOKEN = process.env.NATIONBUILDER_API_TOKEN;
const NB_SLUG = process.env.NATIONBUILDER_SLUG;

export type NbConnectionStatus = "connected" | "error" | "not_configured";

interface FetchSignupsResult {
  signups: NbSignup[];
  status: NbConnectionStatus;
}

/**
 * Fetch the most recent signups from the NationBuilder v2 API (read-only).
 * Returns signups and connection status.
 */
export async function fetchRecentSignups(limit = 3): Promise<FetchSignupsResult> {
  if (!NB_TOKEN || !NB_SLUG) return { signups: [], status: "not_configured" };

  const url = `https://${NB_SLUG}.nationbuilder.com/api/v2/signups?sort=-created_at&page[size]=${limit}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${NB_TOKEN}`,
      Accept: "application/json",
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    console.error(`NationBuilder API error: ${res.status} ${res.statusText}`);
    return { signups: [], status: "error" };
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
    }): NbSignup => ({
      id: String(person.id),
      name:
        [person.attributes?.first_name, person.attributes?.last_name]
          .filter(Boolean)
          .join(" ") || "Unknown",
      email: person.attributes?.email || "",
      phone:
        person.attributes?.phone_number ||
        person.attributes?.mobile_number ||
        "",
      created_at: person.attributes?.created_at || "",
    })
  );

  return { signups, status: "connected" };
}

export function formatSignupTime(dateStr: string): { text: string; urgent: boolean } {
  if (!dateStr) return { text: "Recently", urgent: false };
  const hours = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000);
  if (hours < 1) return { text: "Signed up just now", urgent: false };
  if (hours < 48) return { text: `Signed up ${hours} hrs. ago`, urgent: hours > 24 };
  const days = Math.floor(hours / 24);
  return { text: `Signed up ${days} days ago`, urgent: true };
}

export function isUrgent(createdAt: string): boolean {
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() > 24 * 3600000;
}
