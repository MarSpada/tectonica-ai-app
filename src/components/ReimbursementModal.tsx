"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";

interface ReimbursementModalProps {
  onClose: () => void;
  onCreated: () => void;
}

interface PendingFile {
  file: File;
  name: string;
  size: number;
  type: string;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export default function ReimbursementModal({ onClose, onCreated }: ReimbursementModalProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files;
    if (!selected) return;

    const newFiles: PendingFile[] = [];
    for (const file of Array.from(selected)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("Only JPG, PNG, and PDF files are allowed");
        return;
      }
      if (file.size > MAX_SIZE) {
        setError("File must be under 5MB");
        return;
      }
      newFiles.push({ file, name: file.name, size: file.size, type: file.type });
    }
    setFiles((prev) => [...prev, ...newFiles]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    setError(null);
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    if (!description.trim()) {
      setError("Please enter a description");
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Find the super_admin reviewer for this group
      const { data: profile } = await supabase
        .from("profiles")
        .select("group_id")
        .eq("id", user.id)
        .single();

      if (!profile?.group_id) throw new Error("No group assigned");

      const { data: admins } = await supabase
        .from("profiles")
        .select("id")
        .eq("group_id", profile.group_id)
        .eq("role", "super_admin")
        .limit(1);

      if (!admins?.[0]) throw new Error("No super admin found for your group");
      const reviewerId = admins[0].id;

      // Step 1: Create the request (no attachments yet)
      const res = await fetch("/api/reimbursements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numAmount,
          description: description.trim(),
          reviewerId,
          attachments: [],
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create request");
      const requestId = json.requestId;

      // Step 2: Upload files to storage
      if (files.length > 0 && requestId) {
        const uploaded: { url: string; name: string; type: string }[] = [];

        for (const f of files) {
          const ext = f.name.split(".").pop() || "bin";
          const storagePath = `${user.id}/${requestId}/${crypto.randomUUID()}.${ext}`;

          const { error: uploadErr } = await supabase.storage
            .from("reimbursements")
            .upload(storagePath, f.file, { contentType: f.type });

          if (!uploadErr) {
            const { data: urlData } = supabase.storage
              .from("reimbursements")
              .getPublicUrl(storagePath);
            uploaded.push({ url: urlData.publicUrl, name: f.name, type: f.type });
          }
        }

        // Step 3: Update request with attachment URLs
        if (uploaded.length > 0) {
          await supabase
            .from("reimbursement_requests")
            .update({ attachments: uploaded })
            .eq("id", requestId);
        }
      }

      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = amount && parseFloat(amount) > 0 && description.trim() && !submitting;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Reimbursement</DialogTitle>
        </DialogHeader>

        {/* Form */}
        <div className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              Amount ($) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was this expense for?"
              maxLength={500}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-accent-purple/50 resize-none"
            />
          </div>

          {/* File upload */}
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              Invoice / Receipt
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-3 py-2 rounded-lg border border-dashed border-black/20 text-xs text-text-muted hover:border-accent-purple hover:text-accent-purple transition-colors text-center"
            >
              <Icon name="upload" size={16} className="inline-block align-middle mr-1" />
              Attach JPG, PNG, or PDF (max 5MB)
            </button>

            {files.length > 0 && (
              <div className="mt-2 space-y-1">
                {files.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-gray-50 text-xs"
                  >
                    <span className="truncate text-text-primary">{f.name}</span>
                    <button
                      onClick={() => removeFile(i)}
                      className="text-red-400 hover:text-red-600 ml-2 shrink-0"
                    >
                      <Icon name="close" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="bg-orange-400 hover:bg-orange-500 text-white"
          >
            {submitting ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
