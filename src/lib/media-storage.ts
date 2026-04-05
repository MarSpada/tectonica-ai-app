/**
 * Media Storage Abstraction
 *
 * This is the ONLY file in the codebase that imports or references
 * Supabase Storage for media. Components and API routes call functions
 * from this module only — never storage directly.
 *
 * To swap storage providers, change the implementations here. No other
 * file needs to change.
 *
 * ────────────────────────────────────────────────────────────
 * SUPABASE STORAGE BUCKET SETUP (manual — cannot be done via migration)
 * ────────────────────────────────────────────────────────────
 * 1. Go to Supabase Dashboard → Storage → New bucket
 * 2. Bucket name: "media"
 * 3. Public bucket: OFF (private — all access via signed URLs)
 * 4. File size limit: 5 MB (5242880 bytes)
 * 5. Allowed MIME types: image/jpeg, image/png, image/webp, image/gif,
 *    video/mp4, video/quicktime, application/pdf,
 *    application/vnd.openxmlformats-officedocument.wordprocessingml.document,
 *    application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,
 *    application/vnd.openxmlformats-officedocument.presentationml.presentation,
 *    text/plain, text/csv
 *
 * 6. RLS policies (run in SQL Editor):
 *
 *    -- Group members can read files in their group's folder
 *    create policy "Group members can read media"
 *      on storage.objects for select
 *      using (
 *        bucket_id = 'media'
 *        and (storage.foldername(name))[1] = get_my_group_id()::text
 *      );
 *
 *    -- Members (not supporters) can upload to their group's folder
 *    create policy "Members can upload media"
 *      on storage.objects for insert
 *      with check (
 *        bucket_id = 'media'
 *        and (storage.foldername(name))[1] = get_my_group_id()::text
 *        and exists (
 *          select 1 from public.profiles
 *          where id = auth.uid()
 *          and role in ('member', 'group_admin', 'super_admin')
 *        )
 *      );
 *
 *    -- Uploaders can delete their own files; admins can delete any
 *    create policy "Owners and admins can delete media"
 *      on storage.objects for delete
 *      using (
 *        bucket_id = 'media'
 *        and (storage.foldername(name))[1] = get_my_group_id()::text
 *        and (
 *          owner = auth.uid()
 *          or exists (
 *            select 1 from public.profiles
 *            where id = auth.uid()
 *            and role in ('group_admin', 'super_admin')
 *          )
 *        )
 *      );
 *
 * ────────────────────────────────────────────────────────────
 */

import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "media";

/** Max file size in bytes (5 MB) */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Group storage quota in bytes (250 MB) */
export const GROUP_QUOTA = 250 * 1024 * 1024;

/** Signed URL TTL in seconds (1 hour) */
const SIGNED_URL_TTL = 60 * 60;

/** MIME types the server accepts — client MIME is informational only */
export const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/quicktime",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
]);

/** Map MIME type to media category */
export function mimeToCategory(mime: string): "image" | "video" | "document" {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "document";
}

/** Build the UUID-based storage path: {groupId}/{uuid}.{ext} */
export function buildStoragePath(
  groupId: string,
  fileExt: string
): string {
  const uuid = crypto.randomUUID();
  const ext = fileExt.replace(/^\./, "").toLowerCase();
  return `${groupId}/${uuid}.${ext}`;
}

/** Extract file extension from a filename */
export function getFileExtension(fileName: string): string {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

/** Sanitize a user-provided filename for storage as display name */
export function sanitizeFileName(name: string): string {
  return name
    .replace(/[^\w.\-() ]/g, "_")
    .replace(/_{2,}/g, "_")
    .trim()
    .slice(0, 255);
}

// ── Upload ──────────────────────────────────────────────────

/**
 * Upload a file to storage.
 *
 * Returns the storage path on success.
 * Throws on failure.
 *
 * HOOK: virus/malware scanning would go here, before the upload call.
 * Integrate a scanning service (e.g. ClamAV, VirusTotal API) and
 * reject the file if it fails the scan.
 */
export async function uploadFile(
  supabase: SupabaseClient,
  storagePath: string,
  file: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  // TODO: Insert virus/malware scan hook here

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType,
      upsert: false,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  return storagePath;
}

// ── Signed URLs ─────────────────────────────────────────────

/** Create a signed URL for a stored file (1-hour TTL) */
export async function getSignedUrl(
  supabase: SupabaseClient,
  storagePath: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to create signed URL: ${error?.message ?? "unknown"}`);
  }
  return data.signedUrl;
}

// ── Delete ──────────────────────────────────────────────────

/** Delete a file from storage */
export async function deleteFile(
  supabase: SupabaseClient,
  storagePath: string
): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([storagePath]);

  if (error) throw new Error(`Storage delete failed: ${error.message}`);
}

// ── Quota ───────────────────────────────────────────────────

/**
 * Check if a group has enough quota for an upload.
 * Returns { allowed: true } or { allowed: false, usedBytes, quotaBytes }.
 */
export async function checkQuota(
  supabase: SupabaseClient,
  groupId: string,
  additionalBytes: number
): Promise<
  | { allowed: true }
  | { allowed: false; usedBytes: number; quotaBytes: number }
> {
  const { data, error } = await supabase
    .from("groups")
    .select("storage_used_bytes")
    .eq("id", groupId)
    .single();

  if (error) throw new Error(`Failed to check quota: ${error.message}`);

  const used = data.storage_used_bytes ?? 0;
  if (used + additionalBytes > GROUP_QUOTA) {
    return { allowed: false, usedBytes: used, quotaBytes: GROUP_QUOTA };
  }
  return { allowed: true };
}

/**
 * Atomically increment the group's storage_used_bytes counter.
 * Call after a successful upload.
 * Uses SECURITY DEFINER RPC for atomicity.
 */
export async function incrementStorageUsed(
  supabase: SupabaseClient,
  groupId: string,
  bytes: number
): Promise<void> {
  const { error } = await supabase.rpc("increment_storage_used", {
    p_group_id: groupId,
    p_bytes: bytes,
  });
  if (error) throw new Error(`Failed to increment storage: ${error.message}`);
}

/**
 * Decrement is handled by the soft_delete_media_item() RPC.
 * No standalone decrement function needed — the RPC atomically
 * sets deleted_at and decrements storage_used_bytes in one transaction.
 */
