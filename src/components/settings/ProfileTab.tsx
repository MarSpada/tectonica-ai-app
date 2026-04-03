"use client";

import { useState, useRef, useEffect } from "react";
import type { ProfileData } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { getAvatarColor, getInitials, getRoleLabel } from "@/lib/avatar";
import { useUserProfile } from "@/lib/UserProfileContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

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
    <div className="bg-card-bg rounded-2xl border border-card-stroke p-8 space-y-0">
      {/* ── Avatar Section ── */}
      <div className="flex items-center gap-6">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={fullName || "Avatar"}
            className="w-28 h-28 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div
            className={`w-28 h-28 rounded-full ${getAvatarColor(userId)} flex items-center justify-center text-3xl font-bold text-white flex-shrink-0`}
          >
            {getInitials(fullName)}
          </div>
        )}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload Photo"}
            </Button>
            {avatarUrl && (
              <Button
                variant="outline"
                onClick={handleAvatarRemove}
                disabled={uploading}
              >
                Remove
              </Button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={handleAvatarUpload}
            className="hidden"
          />
          <p className="text-[11px] text-text-muted">
            JPG, PNG or WebP. Max 2MB.
          </p>
        </div>
      </div>

      <Separator className="my-6" />

      {/* ── Editable Fields ── */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Display Name
          </label>
          <Input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            maxLength={50}
            required
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-1">
            <label className="text-sm font-medium text-text-primary">
              Bio
            </label>
            <span className="text-[11px] text-text-muted">
              {bio.length} / 200
            </span>
          </div>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={200}
            rows={3}
            placeholder="Tell your group a bit about yourself"
            className="w-full px-3.5 py-2.5 rounded-lg border border-black/10 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent-purple/50 focus:border-accent-purple/50"
          />
        </div>
      </div>

      <Separator className="my-6" />

      {/* ── Read-Only Fields ── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          Account Info
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-text-muted mb-1">Role</label>
            <p className="text-sm font-medium text-text-primary bg-muted rounded-lg px-3 py-2">
              {getRoleLabel(profile.role)}
            </p>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Organization</label>
            <p className="text-sm font-medium text-text-primary bg-muted rounded-lg px-3 py-2 truncate">
              {profile.orgName}
            </p>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Group</label>
            <p className="text-sm font-medium text-text-primary bg-muted rounded-lg px-3 py-2 truncate">
              {profile.groupName}
            </p>
          </div>
        </div>
      </div>

      <Separator className="my-6" />

      {/* ── Save + Toast ── */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          onClick={handleSave}
          disabled={!isDirty || saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>

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

      <Separator className="my-6" />

      {/* ── Sign Out ── */}
      <div>
        <Button
          variant="destructive"
          onClick={async () => {
            const supabase = createClient();
            await supabase.auth.signOut();
            window.location.href = "/login";
          }}
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
