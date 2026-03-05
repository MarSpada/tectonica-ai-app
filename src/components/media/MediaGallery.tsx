"use client";

import { useState } from "react";

type MediaType = "all" | "images" | "videos" | "documents";
type ViewMode = "grid" | "list";

interface MediaItem {
  id: string;
  name: string;
  type: "IMG" | "VID" | "DOC" | "PDF";
  size: string;
  date: string;
  color: string;
}

const mockMedia: MediaItem[] = [
  { id: "1", name: "rally-poster-march.png", type: "IMG", size: "2.4 MB", date: "Mar 12, 2026", color: "#B5EAD7" },
  { id: "2", name: "volunteer-training.mp4", type: "VID", size: "84 MB", date: "Mar 10, 2026", color: "#FFB5A7" },
  { id: "3", name: "canvassing-script-v3.docx", type: "DOC", size: "156 KB", date: "Mar 8, 2026", color: "#A8D8EA" },
  { id: "4", name: "social-card-template.png", type: "IMG", size: "1.1 MB", date: "Mar 7, 2026", color: "#B5EAD7" },
  { id: "5", name: "q1-impact-report.pdf", type: "PDF", size: "3.2 MB", date: "Mar 5, 2026", color: "#E8C5E8" },
  { id: "6", name: "team-photo-retreat.jpg", type: "IMG", size: "4.7 MB", date: "Mar 3, 2026", color: "#A8D8EA" },
  { id: "7", name: "press-release-draft.docx", type: "DOC", size: "89 KB", date: "Feb 28, 2026", color: "#B5EAD7" },
  { id: "8", name: "event-recap-feb.mp4", type: "VID", size: "120 MB", date: "Feb 26, 2026", color: "#FFB5A7" },
  { id: "9", name: "flyer-community-day.png", type: "IMG", size: "1.8 MB", date: "Feb 24, 2026", color: "#FFDAC1" },
  { id: "10", name: "fundraising-deck.pdf", type: "PDF", size: "5.1 MB", date: "Feb 20, 2026", color: "#FFB5A7" },
  { id: "11", name: "banner-website-hero.png", type: "IMG", size: "980 KB", date: "Feb 18, 2026", color: "#A8D8EA" },
  { id: "12", name: "talking-points-housing.docx", type: "DOC", size: "67 KB", date: "Feb 15, 2026", color: "#B5EAD7" },
  { id: "13", name: "testimonial-maria.mp4", type: "VID", size: "45 MB", date: "Feb 12, 2026", color: "#FFB5A7" },
  { id: "14", name: "infographic-impact.png", type: "IMG", size: "2.1 MB", date: "Feb 10, 2026", color: "#A8D8EA" },
  { id: "15", name: "volunteer-handbook.pdf", type: "PDF", size: "8.4 MB", date: "Feb 8, 2026", color: "#E8C5E8" },
  { id: "16", name: "strategy-map-q2.png", type: "IMG", size: "3.5 MB", date: "Feb 5, 2026", color: "#FFDAC1" },
];

const typeBadgeColors: Record<string, string> = {
  IMG: "bg-blue-500",
  VID: "bg-red-500",
  DOC: "bg-green-500",
  PDF: "bg-amber-600",
};

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
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5">
        <div className="flex items-baseline justify-between mb-4">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-bold text-text-primary">Group Media</h1>
            <span className="text-sm text-text-muted">{totalItems} items</span>
          </div>
          <button className="px-5 py-2.5 text-sm font-semibold text-white bg-accent-purple rounded-xl hover:bg-accent-purple/90 transition-colors flex items-center gap-2">
            <span className="text-lg font-bold">+</span>
            Upload Media
          </button>
        </div>

        {/* Toolbar: search + filters + view toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative w-72">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-icons-two-tone text-[18px] text-text-muted">
                search
              </span>
              <input
                type="text"
                placeholder="Search media..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-white/60 rounded-xl border border-black/5 placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-purple/30"
              />
            </div>

            {/* Filter pills */}
            <div className="flex gap-2">
              {(["all", "images", "videos", "documents"] as MediaType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                    filter === f
                      ? "bg-accent-purple text-white"
                      : "bg-white/60 text-text-secondary border border-black/5 hover:bg-black/5"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* View toggle */}
          <div className="flex gap-1 bg-white/50 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "grid" ? "bg-white shadow-sm" : "hover:bg-black/5"
              }`}
            >
              <span className="material-icons-two-tone text-[18px] text-text-secondary">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "list" ? "bg-white shadow-sm" : "hover:bg-black/5"
              }`}
            >
              <span className="material-icons-two-tone text-[18px] text-text-secondary">view_list</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
            {filteredMedia.map((item) => (
              <div key={item.id} className="cursor-pointer group">
                {/* Thumbnail — full pastel colored, no card wrapper */}
                <div
                  className="relative rounded-xl aspect-[4/3] flex items-center justify-center"
                  style={{ backgroundColor: item.color }}
                >
                  {/* Type badge — top right corner */}
                  <span
                    className={`absolute top-2 right-2 text-[10px] font-bold text-white px-2 py-0.5 rounded ${typeBadgeColors[item.type]}`}
                  >
                    {item.type}
                  </span>
                </div>
                {/* Info below thumbnail */}
                <p className="text-xs font-medium text-text-primary mt-2 truncate">
                  {item.name}
                </p>
                <p className="text-[10px] text-text-muted">
                  {item.date} · {item.size}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card-bg rounded-xl border border-card-stroke overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-card-stroke text-left">
                  <th className="px-4 py-2 text-xs font-semibold text-text-muted">Name</th>
                  <th className="px-4 py-2 text-xs font-semibold text-text-muted">Type</th>
                  <th className="px-4 py-2 text-xs font-semibold text-text-muted">Size</th>
                  <th className="px-4 py-2 text-xs font-semibold text-text-muted">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredMedia.map((item) => (
                  <tr key={item.id} className="border-b border-card-stroke last:border-0 hover:bg-black/[.02] cursor-pointer">
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-medium text-text-primary">{item.name}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded ${typeBadgeColors[item.type]}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-text-muted">{item.size}</td>
                    <td className="px-4 py-2.5 text-xs text-text-muted">{item.date}</td>
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
                ? "bg-accent-purple text-white"
                : "bg-white/60 text-text-secondary hover:bg-black/5"
            }`}
          >
            {i + 1}
          </button>
        ))}
        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/60 text-text-secondary hover:bg-black/5 transition-colors">
          <span className="material-icons-two-tone text-[16px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
