"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";

interface TopBarProps {
  onToggleSidebar?: () => void;
}

export default function TopBar({ onToggleSidebar }: TopBarProps) {
  return (
    <header className="flex items-center justify-between h-14 px-4 bg-topbar-bg">
      {/* Left section */}
      <div className="flex items-center gap-3">
        {/* Sidebar collapse button */}
        <button onClick={onToggleSidebar} className="p-1.5 rounded-md hover:bg-black/5 transition-colors">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>

        {/* Org icon */}
        <div className="w-8 h-8 rounded-lg bg-orange-400 flex items-center justify-center text-white font-bold text-sm">
          P
        </div>

        {/* Org name */}
        <Link href="/" className="font-semibold text-text-primary hover:underline">
          People&apos;s Movement
        </Link>

        {/* Group pill */}
        <span className="px-3 py-1 text-xs font-medium bg-white/50 rounded-full text-text-secondary">
          Group Name
        </span>
      </div>

      {/* Right section — logo */}
      <div className="flex items-center">
        <img
          src="/logo-color.png"
          alt="Tectonica.AI"
          className="h-7 w-auto"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.nextElementSibling?.classList.remove("hidden");
          }}
        />
        <span className="hidden text-sm font-bold text-accent-purple">
          Tectonica.AI
        </span>
      </div>
    </header>
  );
}
