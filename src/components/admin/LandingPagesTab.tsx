"use client";

import { useState, useEffect, useCallback } from "react";
import type { UserRole } from "@/lib/types";
import { isSuperAdmin } from "@/lib/constants/roles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@/components/ui/icon";
import { toast } from "sonner";

interface LandingPageRow {
  id: string;
  headline: string;
  type: "signup" | "donate";
  status: "live" | "archived";
  public_url: string;
  created_by_name: string;
  created_at: string;
}

interface LandingPagesTabProps {
  role: UserRole;
  groupId: string | null;
}

export default function LandingPagesTab({ role, groupId }: LandingPagesTabProps) {
  const [pages, setPages] = useState<LandingPageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [archiving, setArchiving] = useState<string | null>(null);
  const canManage = isSuperAdmin(role);

  const fetchPages = useCallback(async () => {
    if (!groupId) return;
    try {
      const res = await fetch("/api/admin/landing-pages");
      const json = await res.json();
      if (json.landing_pages) setPages(json.landing_pages);
    } catch {
      // Pages unavailable
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  async function handleArchive(pageId: string) {
    if (!confirm("Are you sure you want to archive this page? This cannot be undone.")) return;
    setArchiving(pageId);
    try {
      const res = await fetch(`/api/admin/landing-pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      });
      const json = await res.json();
      if (res.ok) {
        await fetchPages();
        toast.success("Landing page archived");
      } else {
        toast.error(json.error || "Failed to archive");
      }
    } catch {
      toast.error("Failed to archive");
    } finally {
      setArchiving(null);
    }
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-8" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-text-primary">Landing Pages</h2>
        <Badge variant="outline" className="text-muted-foreground">
          {pages.length}
        </Badge>
      </div>

      {/* Page list */}
      {pages.length === 0 ? (
        <div className="bg-card-bg rounded-xl border border-card-stroke p-8 text-center">
          <p className="text-sm text-text-muted">
            No landing pages generated yet. Use the Landing Page Creator bot in the chat to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {pages.map((page) => (
            <div
              key={page.id}
              className="flex items-center justify-between py-2 px-3 rounded-lg bg-black/[0.02] border border-black/5"
            >
              {/* Left: headline + badges */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-sm font-semibold text-text-primary truncate max-w-[200px]">
                  {page.headline}
                </span>
                <Badge
                  variant="secondary"
                  className={
                    page.type === "signup"
                      ? "text-[10px] bg-blue-100 text-blue-700"
                      : "text-[10px] bg-green-100 text-green-700"
                  }
                >
                  {page.type}
                </Badge>
                {page.status === "live" ? (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-green-50 text-green-700 border-green-200"
                  >
                    live
                  </Badge>
                ) : (
                  <span className="text-[10px] text-text-muted">archived</span>
                )}
              </div>

              {/* Right: meta + actions */}
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-xs text-text-muted hidden sm:inline">
                  {page.created_by_name}
                </span>
                <span className="text-xs text-text-muted hidden sm:inline">
                  {formatDate(page.created_at)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1"
                  onClick={() => window.open(page.public_url, "_blank", "noopener,noreferrer")}
                >
                  View
                  <Icon name="external-link" size={12} />
                </Button>
                {canManage && page.status === "live" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-text-muted hover:text-red-600"
                    disabled={archiving === page.id}
                    onClick={() => handleArchive(page.id)}
                  >
                    {archiving === page.id ? "Archiving..." : "Archive"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
