"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { isSuperAdmin } from "@/lib/constants/roles";
import type { CalendarEvent } from "@/lib/types";
import type { UserRole } from "@/lib/types";

interface EventsWidgetProps {
  events: CalendarEvent[];
  eventsLoading: boolean;
  role: UserRole;
  onEventClick?: (event: CalendarEvent) => void;
}

const EVENT_ITEM_HEIGHT = 64; // approx height per event item
const HEADER_HEIGHT = 40; // title + margin
const BUTTON_HEIGHT = 48; // space for manage calendars button

export default function EventsWidget({ events, eventsLoading, role, onEventClick }: EventsWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(3);
  const showManageButton = isSuperAdmin(role);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(([entry]) => {
      const reserved = HEADER_HEIGHT + (showManageButton ? BUTTON_HEIGHT : 0);
      const available = entry.contentRect.height - reserved;
      setVisibleCount(Math.max(1, Math.floor(available / EVENT_ITEM_HEIGHT)));
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [showManageButton]);

  return (
    <div ref={containerRef} className="h-full overflow-hidden p-5 flex flex-col">
      <h3 className="font-bold mb-3" style={{ fontSize: "var(--widget-title-size)", color: "var(--widget-text-color)" }}>Upcoming Events</h3>
      {eventsLoading ? (
        <div className="text-center py-4">
          <Icon name="loading" size={28} className="animate-spin opacity-60" />
          <p className="text-sm text-text-muted mt-2">Loading events...</p>
        </div>
      ) : events.length > 0 ? (
        <div className="space-y-3 flex-1 min-h-0">
          {events.slice(0, visibleCount).map((event) => {
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
              <button
                key={event.id}
                type="button"
                className="flex items-start gap-3 w-full text-left cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => onEventClick?.(event)}
              >
                <div
                  className="w-1 self-stretch rounded-full shrink-0"
                  style={{ backgroundColor: "var(--widget-events-accent)" }}
                />
                <div className="min-w-0">
                  <p className="font-bold leading-snug truncate" style={{ fontSize: "var(--widget-list-primary-size)", color: "var(--widget-events-accent)" }}>
                    {event.title}
                  </p>
                  <p className="font-medium mt-0.5" style={{ fontSize: "var(--widget-list-secondary-size)", color: "var(--widget-text-muted)" }}>
                    {dayStr} &middot; {timeStr}
                  </p>
                  {event.location && (
                    <p className="font-medium truncate" style={{ fontSize: "var(--widget-list-secondary-size)", color: "var(--widget-text-muted)" }}>{event.location}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-4">
          <Icon name="calendar" size={28} className="opacity-60" />
          <p className="text-sm text-text-muted mt-2">No upcoming events</p>
        </div>
      )}
      {showManageButton && (
        <Link
          href="/admin?tab=integrations"
          className="widget-cta-btn mt-4 w-full rounded-sm text-white font-semibold cursor-pointer block text-center"
          style={{ backgroundColor: "var(--widget-btn-events, var(--accent-purple))", fontSize: "var(--widget-btn-label-size)", padding: "8px 0" }}
        >
          Manage Calendars
        </Link>
      )}
    </div>
  );
}
