"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ApprovalAttachment } from "@/lib/types";
import { getAvatarColor, getInitials } from "@/lib/avatar";
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

interface Reviewer {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  email: string | null;
}

interface PendingFile {
  file: File;
  name: string;
  size: number;
  type: string;
}

interface CreateApprovalModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function CreateApprovalModal({ onClose, onCreated }: CreateApprovalModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reviewerId, setReviewerId] = useState("");
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchReviewers();
  }, []);

  async function fetchReviewers() {
    try {
      const res = await fetch("/api/approvals/reviewers");
      const json = await res.json();
      if (json.reviewers) setReviewers(json.reviewers);
    } catch {
      // Error fetching
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const newFiles: PendingFile[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`"${file.name}" exceeds 5MB limit`);
        continue;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`"${file.name}" is not an allowed file type`);
        continue;
      }
      newFiles.push({ file, name: file.name, size: file.size, type: file.type });
    }

    setPendingFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(index: number) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!reviewerId) {
      setError("Please select a reviewer");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // Step 1: Create the request via API (gets back requestId)
      const createRes = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          reviewerId,
          attachments: [], // Will update after uploads
        }),
      });

      const createJson = await createRes.json();
      if (!createRes.ok) {
        setError(createJson.error || "Failed to create request");
        setSubmitting(false);
        return;
      }

      const requestId = createJson.requestId;

      // Step 2: Upload files to storage and collect URLs
      if (pendingFiles.length > 0) {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const uploadedAttachments: ApprovalAttachment[] = [];

          for (const pf of pendingFiles) {
            const ext = pf.name.split(".").pop()?.toLowerCase() || "bin";
            const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
            const path = `${user.id}/${requestId}/${safeName}`;

            const { error: uploadError } = await supabase.storage
              .from("approvals")
              .upload(path, pf.file, { contentType: pf.type });

            if (!uploadError) {
              const {
                data: { publicUrl },
              } = supabase.storage.from("approvals").getPublicUrl(path);

              uploadedAttachments.push({
                url: publicUrl,
                name: pf.name,
                size: pf.size,
                type: pf.type,
              });
            }
          }

          // Step 3: Update the request with attachment URLs
          if (uploadedAttachments.length > 0) {
            await supabase
              .from("approval_requests")
              .update({ attachments: uploadedAttachments })
              .eq("id", requestId);
          }
        }
      }

      onCreated();
      onClose();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Approval Request</DialogTitle>
        </DialogHeader>

        {/* Body */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto -mx-4 px-4">
          {error && (
            <div className="px-3 py-2 text-xs text-red-700 bg-red-50 rounded-lg">{error}</div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Flyer design for weekend event"
              maxLength={150}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your idea or asset..."
              rows={4}
              maxLength={2000}
              className="w-full px-3 py-2 text-sm border border-black/10 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-accent-purple"
            />
          </div>

          {/* Reviewer Picker */}
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Reviewer <span className="text-red-500">*</span>
            </label>
            <div className="space-y-1.5">
              {reviewers.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setReviewerId(r.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-colors ${
                    reviewerId === r.id
                      ? "border-accent-purple bg-purple-50"
                      : "border-black/10 hover:bg-black/3"
                  }`}
                >
                  {r.avatar_url ? (
                    <img
                      src={r.avatar_url}
                      alt={r.full_name || ""}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[10px]"
                      style={{ backgroundColor: getAvatarColor(r.full_name || "?") }}
                    >
                      {getInitials(r.full_name || "?")}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-text-primary">{r.full_name || "Unknown"}</p>
                    <p className="text-[10px] text-text-muted truncate">
                      {r.email ? `${r.email} · ` : ""}<span className="capitalize">{r.role.replace("_", " ")}</span>
                    </p>
                  </div>
                  {reviewerId === r.id && (
                    <Icon name="check-circle" size={18} className="ml-auto" />
                  )}
                </button>
              ))}
              {reviewers.length === 0 && (
                <p className="text-xs text-text-muted italic px-3 py-2">Loading reviewers...</p>
              )}
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Attachments
            </label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.pdf,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-3 border-2 border-dashed border-black/10 rounded-lg text-xs text-text-muted hover:border-accent-purple hover:text-accent-purple transition-colors"
            >
              <Icon name="upload" size={18} />
              Click to attach files (images, PDFs, docs — max 5MB each)
            </button>

            {pendingFiles.length > 0 && (
              <div className="mt-2 space-y-1">
                {pendingFiles.map((pf, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg"
                  >
                    <Icon name={pf.type.startsWith("image/") ? "file-image" : "file-document"} size={16} className="opacity-60" />
                    <span className="text-xs text-text-primary truncate flex-1">{pf.name}</span>
                    <span className="text-[10px] text-text-muted shrink-0">
                      {(pf.size / 1024).toFixed(0)} KB
                    </span>
                    <button
                      onClick={() => removeFile(i)}
                      className="p-0.5 rounded hover:bg-black/10 transition-colors"
                    >
                      <Icon name="close" size={14} className="opacity-60" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || !reviewerId}
          >
            {submitting ? "Submitting..." : "Submit for Approval"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
