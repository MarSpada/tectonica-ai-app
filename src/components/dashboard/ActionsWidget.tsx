"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import type { Action } from "@/lib/types";

interface ActionsWidgetProps {
  actions: Action[];
  onActionClick?: (actionId: string) => void;
}

const ACTION_ITEM_HEIGHT = 48;
const HEADER_HEIGHT = 40;
const FOOTER_HEIGHT = 36;

export default function ActionsWidget({ actions, onActionClick }: ActionsWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(3);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(([entry]) => {
      const available = entry.contentRect.height - HEADER_HEIGHT - FOOTER_HEIGHT;
      setVisibleCount(Math.max(1, Math.floor(available / ACTION_ITEM_HEIGHT)));
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="h-full overflow-hidden p-5 flex flex-col">
      <h3 className="font-bold mb-3" style={{ fontSize: "var(--widget-title-size)", color: "var(--widget-text-color)" }}>
        Group Actions to Take
      </h3>

      {actions.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-text-muted">No active actions</p>
        </div>
      ) : (
        <div className="space-y-2.5 flex-1">
          {actions.slice(0, visibleCount).map((action) => (
            <div
              key={action.id}
              onClick={() => onActionClick?.(action.id)}
              className={`flex items-center justify-between rounded-lg px-4 py-2.5 cursor-pointer hover:opacity-80 transition-opacity ${
                action.is_completed_by_me ? "opacity-50" : ""
              }`}
              style={{ backgroundColor: "var(--widget-list-item-bg)" }}
            >
              <span className={`font-bold truncate mr-2 ${action.is_completed_by_me ? "line-through" : ""}`} style={{ fontSize: "var(--widget-list-primary-size)", color: "var(--widget-actions-accent)" }}>
                {action.is_completed_by_me && (
                  <Icon name="check-circle" size={12} className="inline mr-1 text-green-600" />
                )}
                {action.title}
              </span>
              {action.points_value > 0 && (
                <span className="text-[10px] font-medium text-amber-600 whitespace-nowrap">
                  {action.points_value} pts
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <Link
        href="/actions"
        className="mt-2 flex items-center justify-center text-xs font-medium rounded-lg py-2 transition-colors hover:opacity-80 text-white"
        style={{ backgroundColor: "rgb(66, 45, 143)" }}
      >
        All Actions
      </Link>
    </div>
  );
}
