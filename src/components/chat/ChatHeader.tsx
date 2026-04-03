"use client";

import Link from "next/link";
import { type Bot, categoryMeta } from "@/lib/bots";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/lib/icon-map";

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
        <Icon name="back" size={20} />
      </Link>

      {/* Bot icon */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: meta.accent }}
      >
        <Icon name={bot.icon as IconName} size={22} />
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
