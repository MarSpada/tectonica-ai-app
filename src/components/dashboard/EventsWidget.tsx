"use client";

import { Icon } from "@/components/ui/icon";
import type { CalendarEvent } from "@/lib/types";

interface EventsWidgetProps {
  events: CalendarEvent[];
  eventsLoading: boolean;
}

export default function EventsWidget({ events, eventsLoading }: EventsWidgetProps) {
  return (
    <div className="h-full overflow-auto p-6">
      <h3 className="text-sm font-semibold text-text-primary mb-3">Upcoming Events</h3>
      {eventsLoading ? (
        <div className="text-center py-4">
          <Icon name="loading" size={28} className="animate-spin opacity-60" />
          <p className="text-sm text-text-muted mt-2">Loading events...</p>
        </div>
      ) : events.length > 0 ? (
        <div className="space-y-3">
          {events.slice(0, 4).map((event) => {
            const date = new Date(event.start);
            const dayStr = date.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            });
            const timeStr = date.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            });
            return (
              <div key={event.id} className="flex items-start gap-3">
                <div
                  className="w-1 self-stretch rounded-full shrink-0"
                  style={{ backgroundColor: event.sourceColor || "var(--accent-purple)" }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary leading-snug truncate">
                    {event.title}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {dayStr} &middot; {timeStr}
                  </p>
                  {event.location && (
                    <p className="text-xs text-text-muted truncate">{event.location}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-4">
          <Icon name="calendar" size={28} className="opacity-60" />
          <p className="text-sm text-text-muted mt-2">No upcoming events</p>
        </div>
      )}
    </div>
  );
}
