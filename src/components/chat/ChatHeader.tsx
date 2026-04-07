"use client";

import Link from "next/link";
import { type Bot, categoryMeta } from "@/lib/bots";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { formatCredits } from "@/lib/billing-utils";
import { isSuperAdmin } from "@/lib/constants/roles";
import type { IconName } from "@/lib/icon-map";

interface ChatHeaderProps {
  bot: Bot;
  isImageBot?: boolean;
  mostRecentImageUrl?: string | null;
  onOpenStudio?: () => void;
  creditBalance?: number | null;
  userRole?: string;
}

export default function ChatHeader({
  bot,
  isImageBot,
  mostRecentImageUrl,
  onOpenStudio,
  creditBalance,
  userRole,
}: ChatHeaderProps) {
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
      <div className="flex-1">
        <h1 className="text-sm font-semibold text-text-primary">{bot.name}</h1>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-xs text-text-muted">Online</span>
        </div>
      </div>

      {/* Credit balance — only for image-capable bots */}
      {isImageBot && (
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium ${
              creditBalance == null
                ? "text-text-muted"
                : creditBalance < 0
                  ? "text-red-600"
                  : creditBalance < 1
                    ? "text-amber-600"
                    : "text-text-primary"
            }`}
          >
            Credits: {creditBalance == null ? "\u2014" : formatCredits(creditBalance)}
          </span>
          {isSuperAdmin(userRole) ? (
            <Link href="/admin?tab=billing">
              <Button variant="outline" size="sm" className="text-xs">
                Buy More Credits
              </Button>
            </Link>
          ) : (
            <Button variant="outline" size="sm" className="text-xs" disabled>
              Buy More Credits
            </Button>
          )}
        </div>
      )}

      {/* Open in Studio button — only for image-capable bots */}
      {isImageBot && (
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenStudio}
          disabled={!mostRecentImageUrl}
          title={
            mostRecentImageUrl
              ? "Open in Studio"
              : "Generate an image first"
          }
          className="text-xs gap-1.5"
        >
          <Icon name="bot-graphics" size={16} />
          Open in Studio
        </Button>
      )}
    </div>
  );
}
