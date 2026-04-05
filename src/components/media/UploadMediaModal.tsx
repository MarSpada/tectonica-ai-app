"use client";

import { useState, useRef } from "react";
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
import { MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from "@/lib/media-storage";

type TabType = "file" | "link";

interface UploadMediaModalProps {
  onClose: () => void;
  onUploaded: () => void;
}

export default function UploadMediaModal({ onClose, onUploaded }: UploadMediaModalProps) {
  const [tab, setTab] = useState<TabType>("file");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // File tab state
  const [file, setFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState("");
  const [fileDescription, setFileDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Link tab state
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkDescription, setLinkDescription] = useState("");

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > MAX_FILE_SIZE) {
      setError(`File exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
      return;
    }
    if (!ALLOWED_MIME_TYPES.has(selected.type)) {
      setError("This file type is not supported");
      return;
    }
    setFile(selected);
    if (!fileTitle) setFileTitle(selected.name);
  }

  function removeFile() {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmitFile() {
    if (!file) return;
    setError(null);
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (fileTitle) formData.append("title", fileTitle);
      if (fileDescription) formData.append("description", fileDescription);

      const res = await fetch("/api/media", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }

      onUploaded();
      onClose();
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitLink() {
    if (!linkUrl || !linkTitle) {
      setError("Title and URL are required");
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/media/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: linkUrl,
          title: linkTitle,
          description: linkDescription || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to add link");
        return;
      }

      onUploaded();
      onClose();
    } catch {
      setError("Failed to add link. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Media</DialogTitle>
        </DialogHeader>

        {/* Tab toggle */}
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => { setTab("file"); setError(null); }}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              tab === "file" ? "bg-card shadow-sm" : "hover:bg-muted-foreground/10"
            }`}
          >
            Upload File
          </button>
          <button
            onClick={() => { setTab("link"); setError(null); }}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              tab === "link" ? "bg-card shadow-sm" : "hover:bg-muted-foreground/10"
            }`}
          >
            Add Link
          </button>
        </div>

        {error && (
          <div className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {tab === "file" ? (
          <div className="space-y-3">
            {/* Drop zone / file select */}
            {!file ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-xl py-8 flex flex-col items-center gap-2 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <Icon name="upload" size={28} className="opacity-50" />
                <span className="text-sm font-medium text-muted-foreground">
                  Click to select a file
                </span>
                <span className="text-xs text-muted-foreground/70">
                  Max {MAX_FILE_SIZE / 1024 / 1024}MB — images, videos, documents
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted">
                <Icon name="file-document" size={20} className="opacity-60" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                </div>
                <button onClick={removeFile} className="p-1 hover:bg-muted-foreground/10 rounded">
                  <Icon name="close" size={16} />
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept={Array.from(ALLOWED_MIME_TYPES).join(",")}
            />

            <Input
              placeholder="Title (optional)"
              value={fileTitle}
              onChange={(e) => setFileTitle(e.target.value)}
            />
            <Input
              placeholder="Description (optional)"
              value={fileDescription}
              onChange={(e) => setFileDescription(e.target.value)}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <Input
              placeholder="URL *"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
            <Input
              placeholder="Title *"
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
            />
            <Input
              placeholder="Description (optional)"
              value={linkDescription}
              onChange={(e) => setLinkDescription(e.target.value)}
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={tab === "file" ? handleSubmitFile : handleSubmitLink}
            disabled={submitting || (tab === "file" ? !file : !linkUrl || !linkTitle)}
          >
            {submitting ? "Saving..." : tab === "file" ? "Upload" : "Add Link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
