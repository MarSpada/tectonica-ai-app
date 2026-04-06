"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Icon } from "@/components/ui/icon";
import type { CalendarEvent } from "@/lib/types";

interface EventDetailSheetProps {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EventDetailSheet({ event, open, onOpenChange }: EventDetailSheetProps) {
  if (!event) return null;

  const startDate = new Date(event.start);
  const endDate = event.end ? new Date(event.end) : null;

  const dateStr = startDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const startTimeStr = startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const endTimeStr = endDate
    ? endDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{event.title}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 mt-6">
          {/* Date and time */}
          <div className="flex items-start gap-3">
            <Icon name="calendar" size={20} className="mt-0.5 shrink-0 opacity-60" />
            <div>
              <p className="font-medium text-sm text-foreground">{dateStr}</p>
              <p className="text-sm text-muted-foreground">
                {startTimeStr}
                {endTimeStr && ` – ${endTimeStr}`}
              </p>
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-start gap-3">
              <Icon name="location-pin" size={20} className="mt-0.5 shrink-0 opacity-60" />
              <p className="text-sm text-foreground">{event.location}</p>
            </div>
          )}

          {/* Source */}
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: event.sourceColor }}
            />
            <p className="text-sm text-muted-foreground">{event.sourceName}</p>
          </div>

          {/* Description */}
          {event.description && (
            <div className="pt-2 border-t border-border">
              <p className="text-sm text-foreground whitespace-pre-line">{event.description}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
