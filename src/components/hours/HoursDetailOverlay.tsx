"use client";

import { getAvatarColor, getInitials } from "@/lib/avatar";
import type { HourEntry } from "@/lib/types";
import { Icon } from "@/components/ui/icon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface HoursDetailOverlayProps {
  entries: HourEntry[];
  total: number;
  thisWeek: number;
  onClose: () => void;
  onLogHours: () => void;
}

export default function HoursDetailOverlay({
  entries,
  total,
  thisWeek,
  onClose,
  onLogHours,
}: HoursDetailOverlayProps) {
  // Group entries by date
  const grouped = new Map<string, HourEntry[]>();
  for (const entry of entries) {
    const dateKey = entry.activity_date;
    if (!grouped.has(dateKey)) grouped.set(dateKey, []);
    grouped.get(dateKey)!.push(entry);
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col" showCloseButton={false}>
        {/* Header */}
        <DialogHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <DialogTitle>Volunteer Hours</DialogTitle>
            <p className="text-xs text-text-muted mt-0.5">
              Total: <span className="font-semibold text-text-primary">{total}h</span>
              {" · "}This week: <span className="font-semibold text-green-600">{thisWeek}h</span>
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <Icon name="close" size={20} className="opacity-60" />
          </Button>
        </DialogHeader>

        {/* Entries */}
        <div className="flex-1 overflow-y-auto -mx-4 px-4">
          {entries.length === 0 ? (
            <div className="text-center py-8">
              <Icon name="history" size={40} className="opacity-60" />
              <p className="text-sm text-text-muted mt-2">No hours logged yet</p>
              <p className="text-xs text-text-muted mt-1">Be the first to track your volunteer time!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Array.from(grouped.entries()).map(([date, dayEntries]) => {
                const d = new Date(date + "T00:00:00");
                const dateLabel = d.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                });
                const dayTotal = dayEntries.reduce((s, e) => s + Number(e.hours), 0);

                return (
                  <div key={date}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                        {dateLabel}
                      </span>
                      <span className="text-[10px] font-semibold text-green-600">
                        {dayTotal}h
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {dayEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center gap-2.5 bg-gray-50 rounded-lg px-3 py-2"
                        >
                          {entry.user_avatar ? (
                            <img
                              src={entry.user_avatar}
                              alt={entry.user_name || ""}
                              className="w-6 h-6 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div
                              className={`w-6 h-6 rounded-full ${getAvatarColor(entry.user_id)} flex items-center justify-center text-[9px] font-bold text-white shrink-0`}
                            >
                              {getInitials(entry.user_name || "?")}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-text-primary">
                                {entry.user_name}
                              </span>
                              <span className="text-[10px] font-semibold text-green-600">
                                {entry.hours}h
                              </span>
                            </div>
                            {entry.description && (
                              <p className="text-[10px] text-text-muted truncate">
                                {entry.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="-mx-4 -mb-4 px-4 py-3 border-t border-black/5">
          <Button
            onClick={() => { onClose(); onLogHours(); }}
            className="w-full bg-green-500 hover:bg-green-600 text-white"
          >
            + Log Your Hours
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
