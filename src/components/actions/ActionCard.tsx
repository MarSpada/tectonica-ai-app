"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/lib/icon-map";
import type { Action, ActionType, UserRole } from "@/lib/types";

interface ActionCardProps {
  action: Action;
  userRole: UserRole;
  onSelect: (action: Action) => void;
  onEdit?: (action: Action) => void;
  onArchive?: (action: Action) => void;
}

const typeLabels: Record<ActionType, string> = {
  petition: "Petition",
  donation: "Donation",
  event_rsvp: "Event RSVP",
  letter: "Letter",
  phone_bank: "Phone Bank",
  canvass: "Canvass",
  social_share: "Social Share",
  custom: "Custom",
};

const typeIcons: Record<ActionType, IconName> = {
  petition: "bot-targeted-advocacy",
  donation: "bot-group-fundraising",
  event_rsvp: "widget-events",
  letter: "email-action",
  phone_bank: "phone-call",
  canvass: "bot-canvassing",
  social_share: "share",
  custom: "bot-action-planning",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function ActionCard({
  action,
  userRole,
  onSelect,
  onEdit,
  onArchive,
}: ActionCardProps) {
  const isAdmin = userRole === "super_admin" || userRole === "group_admin";
  const isCompleted = action.is_completed_by_me;

  return (
    <div
      onClick={() => onSelect(action)}
      className={`bg-white border border-black/5 rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow ${
        isCompleted ? "opacity-60" : ""
      }`}
    >
      {/* Top row: type badge + source badge + points */}
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="secondary" className="text-[10px] uppercase flex items-center gap-1">
          <Icon name={typeIcons[action.type]} size={12} />
          {typeLabels[action.type]}
        </Badge>
        {action.source !== "internal" && (
          <Badge variant="outline" className="text-[10px]">
            via {action.source.replace("_", " ")}
          </Badge>
        )}
        {action.points_value > 0 && (
          <Badge className="text-[10px] bg-amber-100 text-amber-800 border-amber-200 ml-auto">
            {action.points_value} pts
          </Badge>
        )}
      </div>

      {/* Title */}
      <h3 className={`text-sm font-semibold text-text-primary mb-1 ${isCompleted ? "line-through" : ""}`}>
        {isCompleted && (
          <Icon name="check-circle" size={14} className="inline mr-1 text-green-600" />
        )}
        {action.title}
      </h3>

      {/* Description */}
      {action.description && (
        <p className="text-xs text-text-muted line-clamp-2 mb-2">
          {action.description}
        </p>
      )}

      {/* Bottom row: deadline + scope + admin controls */}
      <div className="flex items-center gap-2 mt-2">
        {action.ends_at && (
          <span className="text-[10px] text-text-muted flex items-center gap-1">
            <Icon name="widget-events" size={12} />
            Due {formatDate(action.ends_at)}
          </span>
        )}
        <Badge variant="outline" className="text-[10px]">
          {action.assignment_scope === "all"
            ? "Everyone"
            : action.assignment_scope === "self_assign"
            ? "Self-assign"
            : "Targeted"}
        </Badge>
        {action.completion_count !== undefined && action.completion_count > 0 && (
          <span className="text-[10px] text-text-muted ml-auto">
            {action.completion_count} completed
          </span>
        )}
      </div>

      {/* Admin controls */}
      {isAdmin && (onEdit || onArchive) && (
        <div className="flex gap-1 mt-3 pt-2 border-t border-black/5">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(action);
              }}
            >
              <Icon name="edit" size={14} />
              Edit
            </Button>
          )}
          {onArchive && action.status !== "archived" && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 text-red-500 hover:text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                onArchive(action);
              }}
            >
              <Icon name="delete" size={14} />
              Archive
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
