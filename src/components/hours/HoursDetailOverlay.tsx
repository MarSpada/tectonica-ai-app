"use client";

import { getAvatarColor, getInitials } from "@/lib/avatar";
import type { HourEntry } from "@/lib/types";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 shrink-0">
          <div>
            <h2 className="text-base font-bold text-text-primary">Volunteer Hours</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Total: <span className="font-semibold text-text-primary">{total}h</span>
              {" · "}This week: <span className="font-semibold text-green-600">{thisWeek}h</span>
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/5 transition-colors">
            <span className="material-icons-two-tone text-[20px] text-text-muted">close</span>
          </button>
        </div>

        {/* Entries */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {entries.length === 0 ? (
            <div className="text-center py-8">
              <span className="material-icons-two-tone text-[40px] text-text-muted">
                schedule
              </span>
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
        <div className="px-5 py-3 border-t border-black/5 shrink-0">
          <button
            onClick={() => { onClose(); onLogHours(); }}
            className="w-full px-4 py-2 text-xs font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
          >
            + Log Your Hours
          </button>
        </div>
      </div>
    </div>
  );
}
