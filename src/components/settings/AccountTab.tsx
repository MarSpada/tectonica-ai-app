"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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

  return (
    <div className="space-y-6">
      {/* Email */}
      <div className="bg-card-bg rounded-2xl border border-card-stroke p-6">
        <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3">
          Email Address
        </h2>
        <Input
          type="text"
          value={email}
          disabled
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
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              New Password
            </label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <p className="text-[11px] text-red-500 mt-0.5">
                Passwords do not match
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <Button
            onClick={handlePasswordChange}
            disabled={!canSubmitPassword || changingPassword}
          >
            {changingPassword ? "Updating..." : "Update Password"}
          </Button>
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
              <p className="text-sm font-medium text-text-primary">
                Delete Account
              </p>
              <p className="text-[11px] text-text-muted">
                Permanently remove your account and all data
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="material-icons-two-tone text-red-500 text-2xl">
                warning
              </span>
              Delete Account
            </DialogTitle>
            <DialogDescription>
              Account deletion requires administrator approval. Please contact
              your organization administrator to request account deletion.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteDialog(false)}
              className="w-full sm:w-auto"
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
