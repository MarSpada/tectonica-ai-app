"use client";

import { useRef, useState, useEffect } from "react";

const ACTIONS = [
  { label: "Call new supporters", time: "9 AM" },
  { label: "Distribute flyers at campus", time: "11 AM" },
  { label: "Host community meetup", time: "6 PM" },
];

const ACTION_ITEM_HEIGHT = 48; // approx height per action item
const HEADER_HEIGHT = 40; // title + margin

export default function ActionsWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(3);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(([entry]) => {
      const available = entry.contentRect.height - HEADER_HEIGHT;
      setVisibleCount(Math.max(1, Math.floor(available / ACTION_ITEM_HEIGHT)));
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="h-full overflow-hidden p-5">
      <h3 className="font-bold mb-3" style={{ fontSize: "var(--widget-title-size)", color: "var(--widget-text-color)" }}>
        Group Actions to Take
      </h3>
      <div className="space-y-2.5">
        {ACTIONS.slice(0, visibleCount).map((action) => (
          <div key={action.label} className="flex items-center justify-between rounded-lg px-4 py-2.5 cursor-pointer hover:opacity-80 transition-opacity" style={{ backgroundColor: "var(--widget-list-item-bg)" }}>
            <span className="font-bold" style={{ fontSize: "var(--widget-list-primary-size)", color: "var(--widget-actions-accent)" }}>
              {action.label}
            </span>
            <span className="font-medium" style={{ fontSize: "var(--widget-list-secondary-size)", color: "var(--widget-text-color)" }}>{action.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
