"use client";

import { useState, useEffect, useCallback } from "react";
import { ROLES, isAdminRole } from "@/lib/constants/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/lib/icon-map";
import type { MediaItem, MediaCategory, UserRole } from "@/lib/types";
import StorageUsageBar from "./StorageUsageBar";
import UploadMediaModal from "./UploadMediaModal";
import MediaDetailSheet from "./MediaDetailSheet";

type FilterType = "all" | MediaCategory;
type ViewMode = "grid" | "list";

interface MediaGalleryProps {
  userRole: UserRole;
  storageUsedBytes: number;
  storageTotalBytes: number;
}

const ITEMS_PER_PAGE = 24;

const categoryIcons: Record<string, IconName> = {
  image: "file-image",
  video: "file-video",
  document: "file-document",
  link: "link",
  generated: "bot-graphics",
};

const categoryLabels: Record<string, string> = {
  image: "IMG",
  video: "VID",
  document: "DOC",
  link: "LINK",
  generated: "GEN",
};

/** Categories that can show image thumbnails */
const THUMBNAIL_CATEGORIES = new Set(["image", "generated"]);

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
  });
}

/** Get thumbnail URL for an item, or null if not available */
function getThumbnailUrl(item: MediaItem): string | null {
  if (!THUMBNAIL_CATEGORIES.has(item.category)) return null;
  // Generated images and links have a direct URL
  if (item.url) return item.url;
  // Uploaded images may have a signed URL
  if (item.signed_url) return item.signed_url;
  return null;
}

function Thumbnail({ item }: { item: MediaItem }) {
  const [failed, setFailed] = useState(false);
  const thumbUrl = getThumbnailUrl(item);

  if (!thumbUrl || failed) {
    return (
      <Icon
        name={categoryIcons[item.category] ?? "file-document"}
        size={32}
        className="opacity-50"
      />
    );
  }

  return (
    <img
      src={thumbUrl}
      alt={item.title || item.file_name}
      className="w-full h-full object-cover"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export default function MediaGallery({
  userRole,
  storageUsedBytes,
  storageTotalBytes,
}: MediaGalleryProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);

  const [items, setItems] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [showUpload, setShowUpload] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Select mode
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const canUpload = userRole !== ROLES.SUPPORTER;
  const canDelete = isAdminRole(userRole);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [filter, debouncedSearch]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== "all") params.set("category", filter);
    if (debouncedSearch) params.set("search", debouncedSearch);
    params.set("page", String(page));
    params.set("limit", String(ITEMS_PER_PAGE));

    try {
      const res = await fetch(`/api/media?${params}`);
      if (!res.ok) {
        setItems([]);
        setTotal(0);
        return;
      }
      const data = await res.json();
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filter, debouncedSearch, page]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  async function handleBulkDelete() {
    setDeleting(true);
    try {
      const promises = [...selectedIds].map((id) =>
        fetch(`/api/media/${id}`, { method: "DELETE" })
      );
      await Promise.all(promises);
      exitSelectMode();
      setShowDeleteConfirm(false);
      fetchItems();
    } catch {
      // Some deletions may have failed
    } finally {
      setDeleting(false);
    }
  }

  function handleCardClick(item: MediaItem) {
    if (selectMode) {
      toggleSelect(item.id);
    } else {
      setSelectedId(item.id);
    }
  }

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-content-bg">
      {/* Page title */}
      <div className="px-6 pt-5 pb-0">
        <div className="flex items-center gap-3 mb-4">
          <Icon name="media" size={28} />
          <h1 className="text-2xl font-bold text-foreground">Group Media</h1>
        </div>
      </div>

      {/* Header */}
      <div className="px-6 py-5 space-y-4">
        {/* Storage bar + upload */}
        <div className="flex items-center justify-between gap-4">
          <StorageUsageBar usedBytes={storageUsedBytes} totalBytes={storageTotalBytes} />
          {canUpload && (
            <Button onClick={() => setShowUpload(true)} className="shrink-0">
              <Icon name="upload" size={16} />
              Add Media
            </Button>
          )}
        </div>

        {/* Toolbar: search + filters + view toggle + select + count */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative w-72">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <Icon name="search" size={18} className="opacity-60" />
            </span>
            <Input
              type="text"
              placeholder="Search media..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filter pills */}
          <div className="flex gap-1.5">
            {(["all", "image", "video", "document", "link", "generated"] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-secondary-foreground border border-border hover:bg-muted"
                }`}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1) + "s"}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "grid" ? "bg-card shadow-sm" : "hover:bg-muted-foreground/10"
              }`}
            >
              <Icon name="view-grid" size={18} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "list" ? "bg-card shadow-sm" : "hover:bg-muted-foreground/10"
              }`}
            >
              <Icon name="view-list" size={18} />
            </button>
          </div>

          {/* Select / Cancel button */}
          {canDelete && items.length > 0 && (
            selectMode ? (
              <Button variant="ghost" size="sm" onClick={exitSelectMode} className="text-xs">
                Cancel
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setSelectMode(true)} className="text-xs">
                Select
              </Button>
            )
          )}

          <Badge variant="outline" className="ml-auto text-muted-foreground">
            {total} item{total !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        {loading ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="rounded-xl aspect-[4/3] bg-muted" />
                <div className="h-3 bg-muted rounded mt-2 w-3/4" />
                <div className="h-2.5 bg-muted rounded mt-1 w-1/2" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-border bg-card">
            <Icon name="group-media" size={48} className="opacity-40" />
            <p className="text-sm font-medium text-foreground mt-3">
              {debouncedSearch || filter !== "all" ? "No media found" : "No media yet"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {debouncedSearch || filter !== "all"
                ? "Try adjusting your search or filters."
                : "Upload files or add links to get started."}
            </p>
            {canUpload && !debouncedSearch && filter === "all" && (
              <Button className="mt-4" onClick={() => setShowUpload(true)}>
                <Icon name="upload" size={16} />
                Add Media
              </Button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
            {items.map((item) => {
              const isSelected = selectedIds.has(item.id);
              return (
                <div
                  key={item.id}
                  className={`cursor-pointer group ${isSelected ? "ring-2 ring-accent-purple rounded-xl" : ""}`}
                  onClick={() => handleCardClick(item)}
                >
                  <div className="relative rounded-xl aspect-[4/3] overflow-hidden flex items-center justify-center bg-muted border border-border">
                    <Thumbnail item={item} />
                    <Badge variant="outline" className="absolute top-2 right-2 text-[10px] font-bold bg-white/80 backdrop-blur-sm">
                      {categoryLabels[item.category] ?? "FILE"}
                    </Badge>
                    {item.visibility === "private" && (
                      <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-black/50 flex items-center justify-center" title="Private — only visible to you">
                        <Icon name="lock" size={12} color="#ffffff" />
                      </div>
                    )}
                    {/* Select checkbox */}
                    {selectMode && (
                      <div className={`absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-accent-purple border-accent-purple"
                          : "bg-white/80 border-black/20"
                      }`}>
                        {isSelected && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium text-foreground mt-2 truncate">
                    {item.title || item.file_name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatDate(item.created_at)}
                    {item.file_size ? ` · ${formatBytes(item.file_size)}` : ""}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  {selectMode && <th className="px-4 py-2.5 w-10" />}
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Name</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Type</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Size</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Date</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Uploaded By</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  const thumbUrl = getThumbnailUrl(item);
                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-border last:border-0 cursor-pointer ${
                        isSelected ? "bg-accent-purple/5" : "hover:bg-muted/50"
                      }`}
                      onClick={() => handleCardClick(item)}
                    >
                      {selectMode && (
                        <td className="px-4 py-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isSelected
                              ? "bg-accent-purple border-accent-purple"
                              : "border-black/20"
                          }`}>
                            {isSelected && (
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {thumbUrl ? (
                            <img src={thumbUrl} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                          ) : (
                            <Icon
                              name={categoryIcons[item.category] ?? "file-document"}
                              size={18}
                              className="opacity-60"
                            />
                          )}
                          <span className="text-sm font-medium text-foreground truncate max-w-xs">
                            {item.title || item.file_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px] font-bold">
                          {categoryLabels[item.category] ?? "FILE"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {item.file_size ? formatBytes(item.file_size) : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {item.uploader_name ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk delete bar */}
      {selectMode && selectedIds.size > 0 && (
        <div className="px-6 py-3 border-t border-border bg-card flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            {selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={exitSelectMode}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Icon name="delete" size={14} />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-foreground mb-2">
              Delete {selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""}?
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              This cannot be undone. The items will be permanently removed.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-3 flex items-center justify-center gap-1.5">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`w-8 h-8 text-xs font-semibold rounded-lg transition-colors ${
                page === i
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-secondary-foreground border border-border hover:bg-muted"
              }`}
            >
              {i + 1}
            </button>
          ))}
          {page < totalPages - 1 && (
            <button
              onClick={() => setPage(page + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-card text-secondary-foreground border border-border hover:bg-muted transition-colors"
            >
              <Icon name="chevron-right" size={16} />
            </button>
          )}
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <UploadMediaModal
          onClose={() => setShowUpload(false)}
          onUploaded={fetchItems}
        />
      )}

      {/* Detail sheet */}
      <MediaDetailSheet
        mediaId={selectedId}
        canDelete={canDelete}
        onClose={() => setSelectedId(null)}
        onDeleted={fetchItems}
      />
    </div>
  );
}
