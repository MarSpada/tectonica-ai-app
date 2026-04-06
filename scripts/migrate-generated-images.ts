/**
 * One-time migration script: Move generated images from FAL URLs to Supabase Storage.
 *
 * Fetches all media_items rows where category='generated' AND storage_path IS NULL,
 * downloads each image from its FAL URL, uploads to Supabase Storage, and updates
 * the storage_path column. Keeps the original url as fallback.
 *
 * Usage:
 *   npx tsx scripts/migrate-generated-images.ts
 *
 * Requires these env vars (reads from .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load env vars from .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing env vars. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const BUCKET = "media";

async function main() {
  console.log("Fetching generated images without storage_path...");

  const { data: items, error } = await supabase
    .from("media_items")
    .select("id, url, group_id, title")
    .eq("category", "generated")
    .is("storage_path", null)
    .not("url", "is", null);

  if (error) {
    console.error("Failed to fetch media_items:", error.message);
    process.exit(1);
  }

  if (!items || items.length === 0) {
    console.log("No images to migrate. All generated images already have storage_path.");
    return;
  }

  console.log(`Found ${items.length} images to migrate.\n`);

  let succeeded = 0;
  let failed = 0;

  for (const item of items) {
    const label = `[${item.id}] "${item.title}"`;
    try {
      // Download from FAL URL
      console.log(`${label} — downloading from ${item.url.slice(0, 80)}...`);
      const res = await fetch(item.url, {
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) {
        throw new Error(`Download failed (${res.status} ${res.statusText})`);
      }
      const arrayBuf = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);

      // Build storage path: {groupId}/{itemId}.jpg
      const storagePath = `${item.group_id}/${item.id}.jpg`;

      // Upload to Supabase Storage
      console.log(`${label} — uploading to storage at ${storagePath} (${buffer.length} bytes)...`);
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, buffer, {
          contentType: "image/jpeg",
          upsert: true, // allow re-run if files already uploaded from a previous attempt
        });

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      // Update media_items row — set storage_path, keep url as fallback
      const { error: updateError } = await supabase
        .from("media_items")
        .update({ storage_path: storagePath })
        .eq("id", item.id);

      if (updateError) {
        throw new Error(`DB update failed: ${updateError.message}`);
      }

      console.log(`${label} — migrated successfully.\n`);
      succeeded++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`${label} — FAILED: ${msg}\n`);
      failed++;
    }
  }

  console.log("────────────────────────────────────");
  console.log(`Migration complete.`);
  console.log(`  Succeeded: ${succeeded}`);
  console.log(`  Failed:    ${failed}`);
  console.log(`  Total:     ${items.length}`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
