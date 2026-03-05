"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface AccountTabProps {
  email: string;
}

export default function AccountTab({ email }: AccountTabProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordToast, setPasswordToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (!passwordToast) return;
    const timer = setTimeout(() => setPasswordToast(null), 3000);
    return () => clearTimeout(timer);
  }, [passwordToast]);

  const canSubmitPassword =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword;

  async function handlePasswordChange() {
    if (!canSubmitPassword) return;

    setChangingPassword(true);
    try {
      const supabase = createClient();

      // Verify current password
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (verifyError) {
        setPasswordToast({
          type: "error",
          message: "Current password is incorrect",
        });
        return;
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setPasswordToast({ type: "error", message: error.message });
        return;
      }

      setPasswordToast({
        type: "success",
        message: "Password changed successfully",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordToast({ type: "error", message: "Failed to change password" });
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="space-y-6">
      {/* Email */}
      <div className="bg-card-bg rounded-2xl border border-card-stroke p-6">
        <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3">
          Email Address
        </h2>
        <input
          type="text"
          value={email}
          disabled
          className="w-full px-3.5 py-2.5 rounded-lg border border-black/10 text-sm bg-black/[0.03] text-text-muted cursor-not-allowed"
        />
        <p className="text-[11px] text-text-muted mt-1">
          Email cannot be changed
        </p>
      </div>

      {/* Change Password */}
      <div className="bg-card-bg rounded-2xl border border-card-stroke p-6">
        <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4">
          Change Password
        </h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple/50 focus:border-accent-purple/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple/50 focus:border-accent-purple/50"
            />
            {newPassword.length > 0 && newPassword.length < 8 && (
              <p className="text-[11px] text-red-500 mt-0.5">
                Must be at least 8 characters
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple/50 focus:border-accent-purple/50"
            />
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <p className="text-[11px] text-red-500 mt-0.5">
                Passwords do not match
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={handlePasswordChange}
            disabled={!canSubmitPassword || changingPassword}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-accent-purple rounded-xl hover:bg-accent-purple/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {changingPassword ? "Updating..." : "Update Password"}
          </button>
          {passwordToast && (
            <span
              className={`text-sm font-medium ${
                passwordToast.type === "success"
                  ? "text-green-600"
                  : "text-red-500"
              }`}
            >
              {passwordToast.message}
            </span>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border-2 border-red-200 p-6">
        <h2 className="text-sm font-bold text-red-600 uppercase tracking-wider mb-4">
          Danger Zone
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">Sign Out</p>
              <p className="text-[11px] text-text-muted">
                Sign out of your account on this device
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              Sign Out
            </button>
          </div>
          <div className="border-t border-black/5" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">
                Delete Account
              </p>
              <p className="text-[11px] text-text-muted">
                Permanently remove your account and all data
              </p>
            </div>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Dialog */}
      {showDeleteDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setShowDeleteDialog(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="material-icons-two-tone text-red-500 text-2xl">
                warning
              </span>
              <h3 className="text-lg font-bold text-text-primary">
                Delete Account
              </h3>
            </div>
            <p className="text-sm text-text-secondary mb-5">
              Account deletion requires administrator approval. Please contact
              your organization administrator to request account deletion.
            </p>
            <button
              onClick={() => setShowDeleteDialog(false)}
              className="w-full px-4 py-2.5 text-sm font-semibold text-text-primary bg-black/5 rounded-xl hover:bg-black/10 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
