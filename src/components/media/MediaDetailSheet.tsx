"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import type { MediaItem } from "@/lib/types";
import type { IconName } from "@/lib/icon-map";

interface MediaDetailSheetProps {
  mediaId: string | null;
  canDelete: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

const categoryIcons: Record<string, IconName> = {
  image: "file-image",
  video: "file-video",
  document: "file-document",
  link: "link",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MediaDetailSheet({
  mediaId,
  canDelete,
  onClose,
  onDeleted,
}: MediaDetailSheetProps) {
  const [item, setItem] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!mediaId) {
      setItem(null);
      return;
    }
    setLoading(true);
    setConfirmDelete(false);
    fetch(`/api/media/${mediaId}`)
      .then((r) => r.json())
      .then((data) => setItem(data.item ?? null))
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [mediaId]);

  async function handleDownload() {
    if (!mediaId) return;
    const res = await fetch(`/api/media/${mediaId}/download`);
    const data = await res.json();
    if (data.url) {
      window.open(data.url, "_blank");
    }
  }

  async function handleDelete() {
    if (!mediaId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/media/${mediaId}`, { method: "DELETE" });
      if (res.ok) {
        onDeleted();
        onClose();
      }
    } finally {
      setDeleting(false);
    }
  }

  const isImage = item?.category === "image";
  const isLink = item?.category === "link";

  return (
    <Sheet open={!!mediaId} onOpenChange={() => onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto p-6">
        <SheetHeader>
          <SheetTitle className="text-base">Media Details</SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
          </div>
        ) : !item ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Item not found
          </p>
        ) : (
          <div className="space-y-5 pt-4">
            {/* Preview */}
            {isImage && item.signed_url ? (
              <div className="rounded-xl overflow-hidden border border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.signed_url}
                  alt={item.title || item.file_name}
                  className="w-full object-contain max-h-64"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-muted flex items-center justify-center py-10">
                <Icon
                  name={categoryIcons[item.category] ?? "file-document"}
                  size={48}
                  className="opacity-40"
                />
              </div>
            )}

            {/* Title + description */}
            <div>
              <h3 className="text-sm font-semibold">{item.title || item.file_name}</h3>
              {item.description && (
                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
              )}
            </div>

            {/* Metadata */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <Badge variant="outline" className="text-[10px]">
                  {item.category.toUpperCase()}
                </Badge>
              </div>
              {item.file_size && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size</span>
                  <span>{formatBytes(item.file_size)}</span>
                </div>
              )}
              {item.mime_type && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">MIME</span>
                  <span className="font-mono text-[10px]">{item.mime_type}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Uploaded</span>
                <span>{formatDate(item.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">By</span>
                <span>{item.uploader_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Downloads</span>
                <span>{item.download_count}</span>
              </div>
              {item.tags.length > 0 && (
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Tags</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {item.tags.map((t) => (
                      <Badge key={t} variant="outline" className="text-[10px]">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              {isLink && item.url ? (
                <Button className="flex-1" onClick={() => window.open(item.url!, "_blank")}>
                  <Icon name="link" size={14} />
                  Open Link
                </Button>
              ) : (
                <Button className="flex-1" onClick={handleDownload}>
                  <Icon name="download" size={14} />
                  Download
                </Button>
              )}

              {canDelete && (
                !confirmDelete ? (
                  <Button
                    variant="outline"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Icon name="trash" size={14} />
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Confirm Delete"}
                  </Button>
                )
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
