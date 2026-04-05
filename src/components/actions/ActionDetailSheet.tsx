"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import type { Action, ActionCompletion, ActionType, UserRole } from "@/lib/types";
import type { IconName } from "@/lib/icon-map";
import { getAvatarColor, getInitials } from "@/lib/avatar";

interface ActionDetailSheetProps {
  actionId: string | null;
  userRole: UserRole;
  onClose: () => void;
  onUpdated: () => void;
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
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ActionDetailSheet({
  actionId,
  userRole,
  onClose,
  onUpdated,
}: ActionDetailSheetProps) {
  const isAdmin = userRole === "super_admin" || userRole === "group_admin";

  const [action, setAction] = useState<Action | null>(null);
  const [completions, setCompletions] = useState<ActionCompletion[]>([]);
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [selfAssigning, setSelfAssigning] = useState(false);
  const [ctaClicked, setCtaClicked] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!actionId) return;
    setLoading(true);
    setError("");
    setCtaClicked(false);

    fetch(`/api/actions/${actionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.action) {
          setAction(data.action);
          setCompletions(data.completions || []);
          setNotes(data.action.my_completion?.notes || "");
        }
      })
      .catch(() => setError("Failed to load action"))
      .finally(() => setLoading(false));
  }, [actionId]);

  async function handleComplete() {
    if (!actionId) return;
    setCompleting(true);
    setError("");

    try {
      const res = await fetch(`/api/actions/${actionId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notes.trim() || null }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to complete action");
        return;
      }

      onUpdated();
      // Refresh detail
      const refreshRes = await fetch(`/api/actions/${actionId}`);
      const refreshData = await refreshRes.json();
      if (refreshData.action) {
        setAction(refreshData.action);
        setCompletions(refreshData.completions || []);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setCompleting(false);
    }
  }

  async function handleSelfAssign() {
    if (!actionId) return;
    setSelfAssigning(true);
    setError("");

    try {
      const res = await fetch(`/api/actions/${actionId}/self-assign`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to self-assign");
        return;
      }

      onUpdated();
    } catch {
      setError("Something went wrong");
    } finally {
      setSelfAssigning(false);
    }
  }

  return (
    <Sheet open={!!actionId} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-sm text-text-muted">Loading...</div>
          </div>
        ) : !action ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-sm text-text-muted">Action not found</div>
          </div>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle className="text-lg">{action.title}</SheetTitle>
            </SheetHeader>

            <div className="space-y-5 mt-4">
              {error && (
                <div className="px-3 py-2 text-xs text-red-700 bg-red-50 rounded-lg">{error}</div>
              )}

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
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
                  <Badge className="text-[10px] bg-amber-100 text-amber-800 border-amber-200">
                    {action.points_value} pts
                  </Badge>
                )}
                {action.is_completed_by_me && (
                  <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200">
                    <Icon name="check-circle" size={12} className="mr-1" />
                    Completed
                  </Badge>
                )}
              </div>

              {/* Description */}
              {action.description && (
                <div>
                  <h4 className="text-xs font-semibold text-text-primary mb-1">Description</h4>
                  <p className="text-sm text-text-secondary whitespace-pre-wrap">{action.description}</p>
                </div>
              )}

              {/* Source data summary (external actions) */}
              {action.source !== "internal" && action.source_data && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-text-primary mb-1">Source Data</h4>
                  <p className="text-[10px] text-text-muted">
                    Imported from {action.source.replace("_", " ")}
                    {action.source_id && ` (ID: ${action.source_id})`}
                  </p>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                {action.starts_at && (
                  <div>
                    <span className="font-semibold text-text-primary">Starts:</span>{" "}
                    <span className="text-text-secondary">{formatDate(action.starts_at)}</span>
                  </div>
                )}
                {action.ends_at && (
                  <div>
                    <span className="font-semibold text-text-primary">Due:</span>{" "}
                    <span className="text-text-secondary">{formatDate(action.ends_at)}</span>
                  </div>
                )}
              </div>

              {/* Bot suggestion chip */}
              {action.suggested_bot_slug && (
                <a
                  href={`/chat/${action.suggested_bot_slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent-purple bg-purple-50 rounded-full hover:bg-purple-100 transition-colors"
                >
                  <Icon name="bot-action-planning" size={14} />
                  Get help from bot
                </a>
              )}

              {/* CTA + completion */}
              {!action.is_completed_by_me && action.status === "active" && (
                <div className="space-y-3">
                  {action.url ? (
                    <a
                      href={action.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setCtaClicked(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-accent-purple rounded-lg hover:opacity-90 transition-opacity"
                    >
                      {action.call_to_action || "Take Action"}
                      <Icon name="link" size={14} />
                    </a>
                  ) : null}

                  {/* Notes field */}
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Completion Notes (optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-black/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-purple resize-none"
                      placeholder="Add any notes about how you completed this..."
                    />
                  </div>

                  <Button
                    onClick={handleComplete}
                    disabled={completing || (!!action.url && !ctaClicked)}
                    className="max-w-[230px]"
                  >
                    {completing ? "Completing..." : (
                      <>
                        <Icon name="check" size={16} />
                        Mark as Complete
                        {action.points_value > 0 && ` (+${action.points_value} pts)`}
                      </>
                    )}
                  </Button>
                  {!!action.url && !ctaClicked && (
                    <p className="text-[10px] text-muted-foreground">
                      Complete the action above before marking as done.
                    </p>
                  )}
                </div>
              )}

              {/* Self-assign button */}
              {action.assignment_scope === "self_assign" && action.status === "active" && (
                <Button
                  variant="outline"
                  onClick={handleSelfAssign}
                  disabled={selfAssigning}
                  className="max-w-[230px]"
                >
                  {selfAssigning ? "Assigning..." : "Sign Up for This Action"}
                </Button>
              )}

              {/* Completion list (admins only) */}
              {isAdmin && completions.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-text-primary mb-2">
                    Completions ({completions.length})
                  </h4>
                  <div className="space-y-2">
                    {completions.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2"
                      >
                        {c.member_avatar ? (
                          <img
                            src={c.member_avatar}
                            alt=""
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                            style={{ backgroundColor: getAvatarColor(c.member_name || "") }}
                          >
                            {getInitials(c.member_name || "?")}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium text-text-primary">
                            {c.member_name}
                          </span>
                          {c.notes && (
                            <p className="text-[10px] text-text-muted truncate">{c.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-text-muted">
                            {formatDate(c.completed_at)}
                          </span>
                          {c.points_earned > 0 && (
                            <span className="text-[10px] text-amber-600 ml-2">
                              +{c.points_earned} pts
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Meta info */}
              <div className="text-[10px] text-text-muted border-t border-black/5 pt-3 space-y-1">
                {action.creator_name && (
                  <div>Created by {action.creator_name}</div>
                )}
                <div>Created {formatDate(action.created_at)}</div>
                {action.completion_count !== undefined && (
                  <div>{action.completion_count} total completions</div>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
