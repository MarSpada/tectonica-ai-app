import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import {
  getOrgImageCredentials,
  uploadImageToRailway,
  ImageToolError,
} from "@/lib/image-tools";

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { profile } = auth;

  if (!profile.org_id) {
    return NextResponse.json({ error: "No organization" }, { status: 400 });
  }

  const { base64 } = await req.json();
  if (!base64 || typeof base64 !== "string") {
    return NextResponse.json(
      { error: "base64 image string is required" },
      { status: 400 }
    );
  }

  // Validate size — rough check: base64 is ~4/3 of original size
  const estimatedBytes = Math.ceil((base64.length * 3) / 4);
  if (estimatedBytes > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Image exceeds 5MB limit" },
      { status: 400 }
    );
  }

  const credentials = await getOrgImageCredentials(profile.org_id);
  if (!credentials) {
    return NextResponse.json(
      { error: "not_configured" },
      { status: 503 }
    );
  }

  try {
    const { url } = await uploadImageToRailway(base64, credentials);

    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof ImageToolError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.code === "upload_error" ? 502 : 500 }
      );
    }
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
