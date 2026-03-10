"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ApprovalAttachment } from "@/lib/types";
import { getAvatarColor, getInitials } from "@/lib/avatar";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/5">
          <h2 className="text-base font-bold text-text-primary">New Approval Request</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/5 transition-colors"
          >
            <span className="material-icons-two-tone text-[20px] text-text-muted">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="px-3 py-2 text-xs text-red-700 bg-red-50 rounded-lg">{error}</div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Flyer design for weekend event"
              maxLength={150}
              className="w-full px-3 py-2 text-sm border border-black/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-purple"
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
                    <span className="material-icons-two-tone text-[18px] text-accent-purple ml-auto">
                      check_circle
                    </span>
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
              <span className="material-icons-two-tone text-[18px]">upload_file</span>
              Click to attach files (images, PDFs, docs — max 5MB each)
            </button>

            {pendingFiles.length > 0 && (
              <div className="mt-2 space-y-1">
                {pendingFiles.map((pf, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg"
                  >
                    <span className="material-icons-two-tone text-[16px] text-text-muted">
                      {pf.type.startsWith("image/") ? "image" : "description"}
                    </span>
                    <span className="text-xs text-text-primary truncate flex-1">{pf.name}</span>
                    <span className="text-[10px] text-text-muted shrink-0">
                      {(pf.size / 1024).toFixed(0)} KB
                    </span>
                    <button
                      onClick={() => removeFile(i)}
                      className="p-0.5 rounded hover:bg-black/10 transition-colors"
                    >
                      <span className="material-icons-two-tone text-[14px] text-text-muted">
                        close
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-black/5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-text-secondary hover:bg-black/5 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || !reviewerId}
            className="px-5 py-2 text-xs font-semibold text-white bg-pink-500 rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Submitting..." : "Submit for Approval"}
          </button>
        </div>
      </div>
    </div>
  );
}
