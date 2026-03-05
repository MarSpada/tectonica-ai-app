"use client";

import Link from "next/link";
import { type Bot, categoryMeta } from "@/lib/bots";

interface ChatHeaderProps {
  bot: Bot;
}

export default function ChatHeader({ bot }: ChatHeaderProps) {
  const meta = categoryMeta[bot.category];

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-card-stroke bg-card-bg">
      {/* Back button */}
      <Link
        href="/"
        className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </Link>

      {/* Bot icon */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: meta.accent }}
      >
        <span className="material-icons-two-tone text-white text-[22px]">
          {bot.icon}
        </span>
      </div>

      {/* Bot info */}
      <div>
        <h1 className="text-sm font-semibold text-text-primary">{bot.name}</h1>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-xs text-text-muted">Online</span>
        </div>
      </div>
    </div>
  );
}
