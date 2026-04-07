"use client";

import { useState, useEffect, useCallback } from "react";
import { getAvatarColor, getInitials, getRoleBadgeStyle, getRoleLabel } from "@/lib/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@/components/ui/icon";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

/* ── Types ── */

interface MemberHours {
  user_id: string;
  name: string;
  avatar_url: string | null;
  role: string;
  total_hours: number;
  this_month_hours: number;
  last_logged: string | null;
}

interface HoursEntry {
  id: string;
  hours: number;
  description: string | null;
  activity_date: string;
  created_at: string;
}

interface DetailData {
  entries: HoursEntry[];
  total_hours: number;
  this_month_hours: number;
  user_name: string;
}

/* ── Helpers ── */

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatHours(h: number): string {
  return h % 1 === 0 ? String(h) : h.toFixed(1);
}

/* ── Component ── */

interface HoursTabProps {
  groupId: string | null;
}

export default function HoursTab({ groupId }: HoursTabProps) {
  const [members, setMembers] = useState<MemberHours[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [thisMonthHours, setThisMonthHours] = useState(0);
  const [activeThisMonth, setActiveThisMonth] = useState(0);
  const [loading, setLoading] = useState(true);

  // Detail sheet state
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<DetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  /* ── Data fetching ── */
  const fetchMembers = useCallback(async () => {
    if (!groupId) return;
    try {
      const res = await fetch("/api/admin/hours");
      const data = await res.json();
      if (!data.error) {
        setMembers(data.members || []);
        setTotalHours(data.total_hours || 0);
        setThisMonthHours(data.this_month_hours || 0);
        setActiveThisMonth(data.active_this_month || 0);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const openDetail = async (userId: string) => {
    setDetailUserId(userId);
    setDetailData(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/hours/${userId}`);
      const data = await res.json();
      if (!data.error) {
        setDetailData(data);
      }
    } catch {
      // silently fail
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailUserId(null);
    setDetailData(null);
  };

  /* ── Null guard ── */
  if (!groupId) {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted text-sm">
        No group assigned
      </div>
    );
  }

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5">
              <Skeleton className="h-3 w-24 mb-3" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-b-0">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-12 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── Render ── */
  return (
    <div className="space-y-6">
      {/* Summary KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Total Hours</p>
          <p className="text-2xl font-bold text-foreground">{formatHours(totalHours)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">This Month</p>
          <p className="text-2xl font-bold text-foreground">{formatHours(thisMonthHours)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Active Volunteers</p>
          <p className="text-2xl font-bold text-foreground">{activeThisMonth}</p>
          <p className="text-xs text-muted-foreground mt-0.5">this month</p>
        </div>
      </div>

      {/* Member hours table */}
      {members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-border bg-card">
          <Icon name="log-hours" size={48} className="opacity-40" />
          <p className="text-sm font-medium text-foreground mt-3">No hours logged yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Members can log hours from the dashboard widget.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Member</TableHead>
                <TableHead className="text-right">This Month</TableHead>
                <TableHead className="text-right">All Time</TableHead>
                <TableHead className="text-right">Last Logged</TableHead>
                <TableHead className="text-right pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const badge = getRoleBadgeStyle(member.role);
                return (
                  <TableRow key={member.user_id}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={member.name}
                            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div
                            className={`w-9 h-9 rounded-full ${getAvatarColor(member.user_id)} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}
                          >
                            {getInitials(member.name)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                          <Badge
                            variant="secondary"
                            className="text-[10px] mt-0.5"
                            style={{ backgroundColor: badge.bg, color: badge.text }}
                          >
                            {getRoleLabel(member.role)}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-semibold text-foreground">
                        {member.this_month_hours > 0 ? formatHours(member.this_month_hours) : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm text-muted-foreground">
                        {member.total_hours > 0 ? formatHours(member.total_hours) : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm text-muted-foreground">
                        {member.last_logged ? formatDate(member.last_logged) : "Never"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetail(member.user_id)}
                        className="text-xs"
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Detail sheet */}
      <Sheet open={!!detailUserId} onOpenChange={(open) => { if (!open) closeDetail(); }}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>
              {detailData?.user_name || "Member"} — Hours
            </SheetTitle>
          </SheetHeader>

          {detailLoading ? (
            <div className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-16 rounded-lg" />
                <Skeleton className="h-16 rounded-lg" />
              </div>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : detailData ? (
            <div className="mt-6 space-y-6">
              {/* KPI row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">This Month</p>
                  <p className="text-xl font-bold text-foreground">{formatHours(detailData.this_month_hours)}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">All Time</p>
                  <p className="text-xl font-bold text-foreground">{formatHours(detailData.total_hours)}</p>
                </div>
              </div>

              {/* Entries list */}
              {detailData.entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Icon name="log-hours" size={36} className="opacity-40" />
                  <p className="text-sm text-muted-foreground mt-2">No entries logged</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Log Entries</p>
                  {detailData.entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
                    >
                      <span className="text-sm text-muted-foreground min-w-[100px]">
                        {formatDate(entry.activity_date)}
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {formatHours(Number(entry.hours))}h
                      </span>
                      {entry.description && (
                        <span className="text-sm text-muted-foreground italic truncate ml-auto">
                          {entry.description}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
