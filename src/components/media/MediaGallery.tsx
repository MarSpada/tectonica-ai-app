"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/lib/icon-map";

type MediaType = "all" | "images" | "videos" | "documents";
type ViewMode = "grid" | "list";

interface MediaItem {
  id: string;
  name: string;
  type: "IMG" | "VID" | "DOC" | "PDF";
  size: string;
  date: string;
}

const typeIcons: Record<string, IconName> = {
  IMG: "file-image",
  VID: "file-video",
  DOC: "file-document",
  PDF: "file-pdf",
};

const mockMedia: MediaItem[] = [
  { id: "1", name: "rally-poster-march.png", type: "IMG", size: "2.4 MB", date: "Mar 12, 2026" },
  { id: "2", name: "volunteer-training.mp4", type: "VID", size: "84 MB", date: "Mar 10, 2026" },
  { id: "3", name: "canvassing-script-v3.docx", type: "DOC", size: "156 KB", date: "Mar 8, 2026" },
  { id: "4", name: "social-card-template.png", type: "IMG", size: "1.1 MB", date: "Mar 7, 2026" },
  { id: "5", name: "q1-impact-report.pdf", type: "PDF", size: "3.2 MB", date: "Mar 5, 2026" },
  { id: "6", name: "team-photo-retreat.jpg", type: "IMG", size: "4.7 MB", date: "Mar 3, 2026" },
  { id: "7", name: "press-release-draft.docx", type: "DOC", size: "89 KB", date: "Feb 28, 2026" },
  { id: "8", name: "event-recap-feb.mp4", type: "VID", size: "120 MB", date: "Feb 26, 2026" },
  { id: "9", name: "flyer-community-day.png", type: "IMG", size: "1.8 MB", date: "Feb 24, 2026" },
  { id: "10", name: "fundraising-deck.pdf", type: "PDF", size: "5.1 MB", date: "Feb 20, 2026" },
  { id: "11", name: "banner-website-hero.png", type: "IMG", size: "980 KB", date: "Feb 18, 2026" },
  { id: "12", name: "talking-points-housing.docx", type: "DOC", size: "67 KB", date: "Feb 15, 2026" },
  { id: "13", name: "testimonial-maria.mp4", type: "VID", size: "45 MB", date: "Feb 12, 2026" },
  { id: "14", name: "infographic-impact.png", type: "IMG", size: "2.1 MB", date: "Feb 10, 2026" },
  { id: "15", name: "volunteer-handbook.pdf", type: "PDF", size: "8.4 MB", date: "Feb 8, 2026" },
  { id: "16", name: "strategy-map-q2.png", type: "IMG", size: "3.5 MB", date: "Feb 5, 2026" },
];

const filterMap: Record<MediaType, string[]> = {
  all: ["IMG", "VID", "DOC", "PDF"],
  images: ["IMG"],
  videos: ["VID"],
  documents: ["DOC", "PDF"],
};

export default function MediaGallery() {
  const [filter, setFilter] = useState<MediaType>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");

  const filteredMedia = mockMedia.filter((item) => {
    const matchesFilter = filterMap[filter].includes(item.type);
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalItems = 48; // Mock total
  const totalPages = 3;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-content-bg">
      {/* Header */}
      <div className="px-6 py-5 space-y-4">
        {/* Toolbar: search + filters + view toggle + upload */}
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

          {/* Filter pills — matches admin panel pattern */}
          <div className="flex gap-1.5">
            {(["all", "images", "videos", "documents"] as MediaType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-secondary-foreground border border-border hover:bg-muted"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
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

          <Badge variant="outline" className="ml-auto text-muted-foreground">
            {totalItems} items
          </Badge>

          <Button>
            <Icon name="upload" size={16} />
            Upload Media
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        {filteredMedia.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-border bg-card">
            <Icon name="group-media" size={48} className="opacity-40" />
            <p className="text-sm font-medium text-foreground mt-3">No media found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
            {filteredMedia.map((item) => (
              <div key={item.id} className="cursor-pointer group">
                {/* Thumbnail — neutral bg with centered file type icon */}
                <div className="relative rounded-xl aspect-[4/3] flex items-center justify-center bg-muted border border-border">
                  <Icon name={typeIcons[item.type]} size={32} className="opacity-50" />
                  {/* Type badge — top right corner */}
                  <Badge variant="outline" className="absolute top-2 right-2 text-[10px] font-bold">
                    {item.type}
                  </Badge>
                </div>
                {/* Info below thumbnail */}
                <p className="text-xs font-medium text-foreground mt-2 truncate">
                  {item.name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {item.date} · {item.size}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Name</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Type</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Size</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredMedia.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Icon name={typeIcons[item.type]} size={18} className="opacity-60" />
                        <span className="text-sm font-medium text-foreground">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {item.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{item.size}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{item.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="px-6 py-3 flex items-center justify-center gap-1.5">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            className={`w-8 h-8 text-xs font-semibold rounded-lg transition-colors ${
              i === 0
                ? "bg-primary text-primary-foreground"
                : "bg-card text-secondary-foreground border border-border hover:bg-muted"
            }`}
          >
            {i + 1}
          </button>
        ))}
        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-card text-secondary-foreground border border-border hover:bg-muted transition-colors">
          <Icon name="chevron-right" size={16} />
        </button>
      </div>
    </div>
  );
}
