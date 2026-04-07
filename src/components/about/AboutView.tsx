"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/icon";

/* ── Page definitions ── */

const PAGE_PARAM_MAP: Record<string, string> = {
  platform: "Platform",
  privacy: "Privacy Policy",
  credits: "Credits",
};

interface NavItem {
  key: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: "Platform", label: "About the Platform" },
  { key: "Privacy Policy", label: "Privacy Policy" },
  { key: "Credits", label: "Credits" },
];

/* ── Component ── */

export default function AboutView() {
  const searchParams = useSearchParams();

  const pageParam = searchParams.get("page")?.toLowerCase() || "";
  const requestedPage = PAGE_PARAM_MAP[pageParam];
  const initialPage = requestedPage || "Platform";

  const [activePage, setActivePage] = useState(initialPage);

  return (
    <div className="flex-1 flex min-h-0 overflow-hidden bg-content-bg">
      {/* Sidebar */}
      <aside className="w-[200px] shrink-0 border-r border-card-stroke bg-card-bg flex flex-col overflow-y-auto">
        <div className="px-3 py-4 flex items-center gap-2">
          <Icon name="info" size={16} />
          <span className="text-sm font-semibold text-text-primary">About Tectonica.AI</span>
        </div>

        <nav className="flex-1 px-1.5 pb-4">
          {NAV_ITEMS.map((item) => {
            const isActive = activePage === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActivePage(item.key)}
                className={`
                  w-full flex items-center px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors
                  ${isActive
                    ? "bg-[var(--accent-purple)]/10 text-[var(--accent-purple)] font-medium border-l-2 border-[var(--accent-purple)] -ml-px"
                    : "text-text-secondary hover:text-text-primary hover:bg-black/[0.02]"
                  }
                `}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-2xl">
          {activePage === "Platform" && (
            <>
              <h1 className="text-2xl font-bold text-foreground mb-4">About the Platform</h1>
              <div className="rounded-xl border border-border bg-card p-6">
                <p className="text-sm text-muted-foreground">Content coming soon.</p>
              </div>
            </>
          )}

          {activePage === "Privacy Policy" && (
            <>
              <h1 className="text-2xl font-bold text-foreground mb-4">Privacy Policy</h1>
              <div className="rounded-xl border border-border bg-card p-6">
                <p className="text-sm text-muted-foreground">Content coming soon.</p>
              </div>
            </>
          )}

          {activePage === "Credits" && (
            <>
              <h1 className="text-2xl font-bold text-foreground mb-4">Credits</h1>
              <div className="rounded-xl border border-border bg-card p-6">
                <p className="text-sm text-muted-foreground">Content coming soon.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
