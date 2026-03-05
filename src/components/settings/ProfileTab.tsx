"use client";

import { useState, useRef, useEffect } from "react";
import type { ProfileData } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { getAvatarColor, getInitials, getRoleLabel } from "@/lib/avatar";
import { useUserProfile } from "@/lib/UserProfileContext";

interface ProfileTabProps {
  userId: string;
  profile: ProfileData;
}

export default function ProfileTab({ userId, profile }: ProfileTabProps) {
  const { updateProfile } = useUserProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(profile.fullName);
  const [bio, setBio] = useState(profile.bio);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Track initial values for dirty detection
  const [initial, setInitial] = useState({
    fullName: profile.fullName,
    bio: profile.bio,
  });

  const isDirty = fullName !== initial.fullName || bio !== initial.bio;

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size
    if (file.size > 2 * 1024 * 1024) {
      setToast({ type: "error", message: "File must be under 2MB" });
      return;
    }

    // Validate type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setToast({
        type: "error",
        message: "Only .jpg, .png, and .webp files are allowed",
      });
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        setToast({ type: "error", message: uploadError.message });
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      await supabase
        .from("profiles")
        .update({ avatar_url: urlWithCacheBust })
        .eq("id", userId);

      setAvatarUrl(urlWithCacheBust);
      updateProfile({ avatarUrl: urlWithCacheBust });
      setToast({ type: "success", message: "Avatar uploaded" });
    } catch {
      setToast({ type: "error", message: "Upload failed" });
    } finally {
      setUploading(false);
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleAvatarRemove() {
    setUploading(true);
    try {
      const supabase = createClient();
      const { data: files } = await supabase.storage
        .from("avatars")
        .list(userId);
      if (files?.length) {
        await supabase.storage
          .from("avatars")
          .remove(files.map((f) => `${userId}/${f.name}`));
      }

      await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", userId);

      setAvatarUrl(null);
      updateProfile({ avatarUrl: null });
      setToast({ type: "success", message: "Avatar removed" });
    } catch {
      setToast({ type: "error", message: "Failed to remove avatar" });
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!fullName.trim()) {
      setToast({ type: "error", message: "Display name is required" });
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim(), bio: bio.trim() || null })
        .eq("id", userId);

      if (error) {
        setToast({ type: "error", message: error.message });
        return;
      }

      // Keep auth user_metadata in sync
      await supabase.auth.updateUser({ data: { full_name: fullName.trim() } });

      updateProfile({ fullName: fullName.trim() });
      setInitial({ fullName: fullName.trim(), bio: bio.trim() });
      setToast({ type: "success", message: "Profile updated" });
    } catch {
      setToast({ type: "error", message: "Failed to save" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-card-bg rounded-2xl border border-card-stroke p-6 space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={fullName || "Avatar"}
            className="w-24 h-24 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div
            className={`w-24 h-24 rounded-full ${getAvatarColor(userId)} flex items-center justify-center text-2xl font-bold text-white flex-shrink-0`}
          >
            {getInitials(fullName)}
          </div>
        )}
        <div className="space-y-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 text-sm font-semibold text-white bg-accent-purple rounded-lg hover:bg-accent-purple/90 transition-colors disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload Photo"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={handleAvatarUpload}
            className="hidden"
          />
          {avatarUrl && (
            <button
              onClick={handleAvatarRemove}
              disabled={uploading}
              className="block text-xs text-red-500 hover:underline disabled:opacity-50"
            >
              Remove Photo
            </button>
          )}
          <p className="text-[11px] text-text-muted">
            JPG, PNG or WebP. Max 2MB.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Display Name */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Display Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            maxLength={50}
            required
            className="w-full px-3.5 py-2.5 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple/50 focus:border-accent-purple/50"
          />
        </div>

        {/* Role (read-only) */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Role
          </label>
          <input
            type="text"
            value={getRoleLabel(profile.role)}
            disabled
            className="w-full px-3.5 py-2.5 rounded-lg border border-black/10 text-sm bg-black/[0.03] text-text-muted cursor-not-allowed"
          />
        </div>

        {/* Organization (read-only) */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Organization
          </label>
          <input
            type="text"
            value={profile.orgName}
            disabled
            className="w-full px-3.5 py-2.5 rounded-lg border border-black/10 text-sm bg-black/[0.03] text-text-muted cursor-not-allowed"
          />
        </div>

        {/* Group (read-only) */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Group
          </label>
          <input
            type="text"
            value={profile.groupName}
            disabled
            className="w-full px-3.5 py-2.5 rounded-lg border border-black/10 text-sm bg-black/[0.03] text-text-muted cursor-not-allowed"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={200}
            rows={3}
            placeholder="Tell your group a bit about yourself"
            className="w-full px-3.5 py-2.5 rounded-lg border border-black/10 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent-purple/50 focus:border-accent-purple/50"
          />
          <p className="text-[11px] text-text-muted text-right mt-0.5">
            {bio.length} / 200
          </p>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="px-5 py-2.5 text-sm font-semibold text-white bg-accent-purple rounded-xl hover:bg-accent-purple/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

        {/* Toast */}
        {toast && (
          <span
            className={`text-sm font-medium ${
              toast.type === "success" ? "text-green-600" : "text-red-500"
            }`}
          >
            {toast.message}
          </span>
        )}
      </div>
    </div>
  );
}
