"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { createClient } from "@/lib/supabase/client";
import { getAvatarColor, getInitials, getRoleLabel } from "@/lib/avatar";
import { formatSignupTime } from "@/lib/signup-utils";
import NbSignupModal from "./signups/NbSignupModal";
import CreateApprovalModal from "./approvals/CreateApprovalModal";
import ReimbursementModal from "./ReimbursementModal";
import LogHoursModal from "./hours/LogHoursModal";
import HoursDetailOverlay from "./hours/HoursDetailOverlay";
import { ProgressCircle } from "@/components/tremor/ProgressCircle";
import { SparkAreaChart } from "@/components/tremor/SparkChart";
import { BadgeDelta } from "@/components/tremor/BadgeDelta";
import type { Member, GroupMessage, NbSignup, SignupAssignment, HourEntry, CalendarEvent, FundraisingGoal } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FundraisingHistory {
  month: string;
  raised: number;
  goal: number;
}

interface HoursWeekBucket {
  week: string;
  hours: number;
}

interface RightSidebarProps {
  groupMessages?: GroupMessage[];
  onOpenConversation?: () => void;
}

export default function RightSidebar({ groupMessages = [], onOpenConversation }: RightSidebarProps) {
  const widgetGridRef = useRef<HTMLDivElement>(null);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [signups, setSignups] = useState<NbSignup[]>([]);
  const [assignments, setAssignments] = useState<SignupAssignment[]>([]);
  const [nbStatus, setNbStatus] = useState<"connected" | "error" | "not_configured" | "loading">("loading");
  const [selectedSignup, setSelectedSignup] = useState<NbSignup | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [calendarSourceCount, setCalendarSourceCount] = useState(0);
  const [hourEntries, setHourEntries] = useState<HourEntry[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [weekHours, setWeekHours] = useState(0);
  const [prevWeekHours, setPrevWeekHours] = useState(0);
  const [showLogHoursModal, setShowLogHoursModal] = useState(false);
  const [showHoursDetail, setShowHoursDetail] = useState(false);
  const [fundraising, setFundraising] = useState<FundraisingGoal | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [budgetInput, setBudgetInput] = useState("");
  const [showReimbursementModal, setShowReimbursementModal] = useState(false);
  const [fundraisingHistory, setFundraisingHistory] = useState<FundraisingHistory[]>([]);
  const [hoursHistory, setHoursHistory] = useState<HoursWeekBucket[]>([]);
  const directoryMembers = allMembers.slice(0, 6);

  const memberCount = allMembers.filter((m) =>
    ["super_admin", "group_admin", "member"].includes(m.role)
  ).length;
  const supporterCount = allMembers.filter((m) => m.role === "supporter").length;

  useEffect(() => {
    async function fetchMembers() {
      const supabase = createClient();
      const { data } = await supabase.rpc("get_group_members");
      if (data) setAllMembers(data as Member[]);
    }
    async function fetchSignups() {
      try {
        const res = await fetch("/api/nationbuilder/signups");
        const json = await res.json();
        if (json.signups) setSignups(json.signups);
        if (json.assignments) setAssignments(json.assignments);
        if (json.status) setNbStatus(json.status);
        else setNbStatus("connected");
      } catch {
        setNbStatus("error");
      }
    }
    async function fetchEvents() {
      try {
        const res = await fetch("/api/events");
        const json = await res.json();
        if (json.events) setEvents(json.events);
      } catch {
        // Events unavailable
      } finally {
        setEventsLoading(false);
      }
    }
    async function fetchCalendarSources() {
      try {
        const res = await fetch("/api/admin/calendars");
        const json = await res.json();
        if (json.sources) setCalendarSourceCount(json.sources.filter((s: { enabled: boolean }) => s.enabled).length);
      } catch {
        // Not admin or unavailable
      }
    }
    async function fetchHours() {
      try {
        const res = await fetch("/api/hours");
        const json = await res.json();
        if (json.entries) setHourEntries(json.entries);
        setTotalHours(json.total || 0);
        setWeekHours(json.thisWeek || 0);
      } catch {
        // Hours unavailable
      }
    }
    async function fetchFundraising() {
      try {
        const res = await fetch("/api/fundraising");
        const json = await res.json();
        if (json.goal) setFundraising(json.goal);
        if (json.isAdmin) setIsAdmin(json.isAdmin);
      } catch {
        // Fundraising unavailable
      }
    }
    async function fetchFundraisingHistory() {
      try {
        const res = await fetch("/api/fundraising/history");
        const json = await res.json();
        if (json.history) setFundraisingHistory(json.history);
      } catch {
        // History unavailable
      }
    }
    async function fetchHoursHistory() {
      try {
        const res = await fetch("/api/hours/history");
        const json = await res.json();
        if (json.weeks) {
          setHoursHistory(json.weeks);
          // Calculate previous week hours for delta
          if (json.weeks.length >= 2) {
            setPrevWeekHours(json.weeks[json.weeks.length - 2].hours);
          }
        }
      } catch {
        // History unavailable
      }
    }
    fetchMembers();
    fetchSignups();
    fetchEvents();
    fetchCalendarSources();
    fetchHours();
    fetchFundraising();
    fetchFundraisingHistory();
    fetchHoursHistory();
  }, []);

  useEffect(() => {
    const el = widgetGridRef.current;
    if (!el) return;

    const children = Array.from(el.children);
    gsap.fromTo(children,
      { x: 20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.5, stagger: 0.08, delay: 0.3, ease: "power2.out" }
    );
  }, []);

  function getAssignment(signupId: string): SignupAssignment | null {
    return assignments.find((a) => a.nb_signup_id === signupId) || null;
  }

  async function refreshHours() {
    try {
      const res = await fetch("/api/hours");
      const json = await res.json();
      if (json.entries) setHourEntries(json.entries);
      setTotalHours(json.total || 0);
      setWeekHours(json.thisWeek || 0);
    } catch {
      // ignore
    }
  }

  function handleAssigned(newAssignment: SignupAssignment) {
    setAssignments((prev) => {
      const filtered = prev.filter((a) => a.nb_signup_id !== newAssignment.nb_signup_id);
      return [...filtered, newAssignment];
    });
    setSelectedSignup(null);
  }

  // Computed values for widgets
  const fundraisingPct = (fundraising?.fundraising_goal || 0) > 0
    ? Math.round(((fundraising?.amount_raised || 0) / (fundraising?.fundraising_goal || 1)) * 100)
    : 0;
  const memberPct = Math.round((memberCount / 18) * 100);
  const supporterPct = Math.round((supporterCount / 25) * 100);
  const hoursDelta = weekHours - prevWeekHours;

  return (
    <aside className="right-sidebar-responsive w-[var(--right-sidebar)] bg-bg border-l border-black/5 overflow-y-auto p-4">
      <h2 className="text-lg font-bold text-text-primary mb-4">
        Group Dashboard
      </h2>

      <div
        ref={widgetGridRef}
        className="widget-grid-responsive grid gap-3"
        style={{
          gridTemplateColumns: "repeat(12, 1fr)",
          gridAutoRows: "minmax(40px, auto)",
        }}
      >
        {/* ═══ New Sign-Ups ═══ */}
        <div
          className="rounded-lg border border-gray-200 shadow-xs p-6"
          style={{ gridColumn: "1 / 10", gridRow: "1 / 3", backgroundColor: "var(--widget-bg-signups)" }}
        >
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            New Sign-Ups
          </h3>
          <div className="space-y-2.5">
            {nbStatus === "loading" ? (
              <div className="flex items-center gap-2">
                <span className="material-icons-two-tone text-[16px] text-text-muted animate-spin">autorenew</span>
                <p className="text-sm text-text-muted">Loading...</p>
              </div>
            ) : nbStatus === "error" ? (
              <div className="flex items-center gap-2">
                <span className="material-icons-two-tone text-[16px] text-orange-500">warning</span>
                <p className="text-sm text-orange-600 font-medium">Error connecting with source</p>
              </div>
            ) : nbStatus === "not_configured" ? (
              <p className="text-sm text-text-muted">No source connected</p>
            ) : signups.length > 0 ? (
              signups.map((s) => {
                const time = formatSignupTime(s.created_at);
                const assignment = getAssignment(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSignup(s)}
                    className="w-full flex items-center justify-between hover:bg-amber-100/50 rounded-lg px-2 -mx-2 py-1.5 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-full shrink-0 ${getAvatarColor(s.id)} flex items-center justify-center text-xs font-bold text-white`}
                      >
                        {getInitials(s.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary truncate">{s.name}</span>
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 shrink-0">
                            <img src="/nb-icon.png" alt="" className="w-4 h-4" />
                            via NB
                          </span>
                        </div>
                        {assignment && (
                          <span className="text-xs text-text-muted block truncate">
                            Assigned to {assignment.assignee_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-xs shrink-0 ml-2 ${
                        time.urgent ? "font-semibold text-red-500" : "text-text-muted"
                      }`}
                    >
                      {time.text}
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="text-sm text-text-muted">No recent sign-ups</p>
            )}
          </div>
          {signups.length > 0 && (
            <p className="text-xs text-text-muted mt-3">
              Click a sign-up to view details and assign to a team member.
            </p>
          )}
        </div>

        {/* ═══ Recruit More People ═══ */}
        <div
          className="rounded-lg border border-gray-200 shadow-xs p-6 flex flex-col items-center justify-center text-center text-white"
          style={{ gridColumn: "10 / 13", gridRow: "1 / 3", backgroundColor: "var(--accent-purple)" }}
        >
          <span className="material-icons-two-tone text-[40px] mb-2">
            person_add
          </span>
          <span className="text-sm font-bold leading-tight uppercase">
            Recruit More People
          </span>
        </div>

        {/* ═══ Group Conversations ═══ */}
        <div
          className="rounded-lg border border-gray-200 shadow-xs p-6 flex flex-col"
          style={{ gridColumn: "1 / 7", gridRow: "3 / 8", backgroundColor: "var(--widget-bg-conversations)" }}
        >
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Group Conversations
          </h3>
          <div className="space-y-2 flex-1">
            {groupMessages.length > 0 ? (
              groupMessages.slice(-3).map((msg) => (
                <p key={msg.id} className="text-sm text-text-primary truncate">
                  <span className="font-semibold text-accent-purple">
                    @{msg.sender_name || "Unknown"}
                  </span>{" "}
                  {msg.content}
                </p>
              ))
            ) : (
              <p className="text-sm text-text-muted">No messages yet</p>
            )}
          </div>
          <Button
            variant="outline"
            onClick={onOpenConversation}
            className="mt-auto self-start"
          >
            Open Conversation
          </Button>
        </div>

        {/* ═══ Group Actions ═══ */}
        <div
          className="rounded-lg border border-gray-200 shadow-xs p-6"
          style={{ gridColumn: "7 / 13", gridRow: "3 / 8", backgroundColor: "var(--widget-bg-actions)" }}
        >
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Group Actions to Take Today
          </h3>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5">
              <span className="text-sm font-medium text-accent-purple cursor-pointer hover:underline">
                Call New Supporters
              </span>
              <span className="text-xs text-text-muted">9 AM</span>
            </div>
            <div className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5">
              <span className="text-sm font-medium text-accent-purple cursor-pointer hover:underline">
                Distribute Flyers at Campus
              </span>
              <span className="text-xs text-text-muted">11 AM</span>
            </div>
            <div className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5">
              <span className="text-sm font-medium text-accent-purple cursor-pointer hover:underline">
                Host Community Meetup
              </span>
              <span className="text-xs text-text-muted">12 PM</span>
            </div>
          </div>
        </div>

        {/* ═══ Fundraising (Tremor KPI) ═══ */}
        <div
          className="rounded-lg border border-gray-200 shadow-xs p-6 flex flex-col"
          style={{ gridColumn: "1 / 7", gridRow: "8 / 14", backgroundColor: "var(--widget-bg-fundraising)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">
              Current Month Goal
            </h3>
            {isAdmin && !editingGoal && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => {
                  setGoalInput(String(fundraising?.fundraising_goal || 0));
                  setBudgetInput(String(fundraising?.print_budget || 0));
                  setEditingGoal(true);
                }}
                title="Edit goals"
              >
                <span className="material-icons-two-tone text-[18px] text-text-muted">edit</span>
              </Button>
            )}
          </div>

          {editingGoal ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-text-muted">Fundraising Goal ($)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted">Print Budget ($)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/fundraising", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          fundraising_goal: parseFloat(goalInput) || 0,
                          print_budget: parseFloat(budgetInput) || 0,
                        }),
                      });
                      const json = await res.json();
                      if (json.goal) setFundraising(json.goal);
                    } catch { /* silent */ }
                    setEditingGoal(false);
                  }}
                  className="flex-1"
                >
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingGoal(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <ProgressCircle
                  value={fundraisingPct}
                  radius={36}
                  strokeWidth={6}
                  variant="neutral"
                >
                  <span className="text-xs font-semibold text-text-primary">
                    {fundraisingPct}%
                  </span>
                </ProgressCircle>
                <div>
                  <p className="text-3xl font-semibold text-text-primary">
                    ${fundraising?.amount_raised || 0}
                  </p>
                  {(fundraising?.fundraising_goal || 0) > 0 && (
                    <p className="text-sm text-text-muted mt-0.5">
                      of ${fundraising?.fundraising_goal || 0}
                    </p>
                  )}
                </div>
              </div>

              {fundraisingHistory.length > 1 && (
                <div className="mt-4">
                  <SparkAreaChart
                    data={fundraisingHistory}
                    categories={["raised"]}
                    index="month"
                    colors={["blue"]}
                    className="h-12 w-full"
                  />
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-black/5">
                <p className="text-sm text-text-muted">Print Budget</p>
                <p className="text-2xl font-semibold text-text-primary mt-1">${fundraising?.print_budget || 0}</p>
              </div>
            </>
          )}

          <Button
            variant="outline"
            onClick={() => setShowReimbursementModal(true)}
            className="mt-auto self-stretch"
          >
            Request Reimbursement
          </Button>
        </div>

        {/* ═══ Recruitment Goal (Tremor KPI) ═══ */}
        <div
          className="rounded-lg border border-gray-200 shadow-xs p-6"
          style={{ gridColumn: "7 / 13", gridRow: "8 / 11", backgroundColor: "var(--widget-bg-recruitment-goal)" }}
        >
          <h3 className="text-sm font-semibold text-text-primary mb-4">
            Recruitment Goal
          </h3>
          <div className="flex gap-8 justify-center">
            <div className="flex flex-col items-center">
              <ProgressCircle
                value={memberPct}
                radius={36}
                strokeWidth={6}
                variant="default"
              >
                <span className="text-base font-semibold text-text-primary">{memberCount}</span>
              </ProgressCircle>
              <p className="text-sm font-medium text-text-primary mt-2">Members</p>
              <p className="text-xs text-text-muted">of 18</p>
            </div>
            <div className="flex flex-col items-center">
              <ProgressCircle
                value={supporterPct}
                radius={36}
                strokeWidth={6}
                variant="success"
              >
                <span className="text-base font-semibold text-text-primary">{supporterCount}</span>
              </ProgressCircle>
              <p className="text-sm font-medium text-text-primary mt-2">Supporters</p>
              <p className="text-xs text-text-muted">of 25</p>
            </div>
          </div>
        </div>

        {/* ═══ Request Approval ═══ */}
        <div
          className="rounded-lg border border-gray-200 shadow-xs p-6 flex flex-col"
          style={{ gridColumn: "7 / 13", gridRow: "11 / 13", backgroundColor: "var(--widget-bg-request-approval)" }}
        >
          <h3 className="text-sm font-semibold text-text-primary mb-1">
            Request Approval
          </h3>
          <p className="text-sm text-text-muted">
            Send an idea or asset for approval
          </p>
          <Button
            variant="outline"
            onClick={() => setShowApprovalModal(true)}
            className="mt-auto self-stretch"
          >
            Start
          </Button>
        </div>

        {/* ═══ Connected Systems (Tremor Status) ═══ */}
        <div
          className="rounded-lg border border-gray-200 shadow-xs p-6"
          style={{ gridColumn: "1 / 7", gridRow: "14 / 18", backgroundColor: "var(--widget-bg-connected-systems)" }}
        >
          <h3 className="text-sm font-semibold text-text-primary mb-4">
            Connected Systems
          </h3>
          <div className="space-y-3">
            <SystemBadge name="Action Network" status="not_connected" />
            <SystemBadge
              name="NationBuilder"
              status={nbStatus === "connected" ? "functional" : nbStatus === "error" ? "error" : "not_connected"}
            />
            <SystemBadge name="Mobilize" status="not_connected" />
            <SystemBadge
              name="Calendar"
              status={calendarSourceCount > 0 || events.length > 0 ? "functional" : "not_connected"}
              detail={calendarSourceCount > 0 ? `${calendarSourceCount} feed${calendarSourceCount > 1 ? "s" : ""}` : events.length > 0 ? "Connected" : undefined}
            />
          </div>
        </div>

        {/* ═══ Hours Volunteered (Tremor KPI) ═══ */}
        <div
          className="rounded-lg border border-gray-200 shadow-xs p-6 cursor-pointer hover:ring-2 hover:ring-gray-300 transition-all flex flex-col"
          style={{ gridColumn: "7 / 13", gridRow: "13 / 18", backgroundColor: "var(--widget-bg-hours)" }}
          onClick={() => setShowHoursDetail(true)}
          title="Click to see details"
        >
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Hours Volunteered
          </h3>
          <div className="flex items-baseline gap-2.5">
            <span className="text-3xl font-semibold text-text-primary">{totalHours}</span>
            <span className="text-sm text-text-muted">hrs</span>
            {weekHours > 0 && (
              <BadgeDelta value={hoursDelta} suffix=" this wk" />
            )}
          </div>

          {hoursHistory.length > 1 && (
            <div className="mt-4">
              <SparkAreaChart
                data={hoursHistory}
                categories={["hours"]}
                index="week"
                colors={["emerald"]}
                className="h-12 w-full"
              />
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setShowLogHoursModal(true); }}
            className="mt-auto self-start text-green-600 hover:text-green-700 px-0"
          >
            + Log hours
          </Button>
        </div>

        {/* ═══ Upcoming Events (Tremor List) ═══ */}
        <div
          className="rounded-lg border border-gray-200 shadow-xs p-6"
          style={{ gridColumn: "1 / 7", gridRow: "18 / 24", backgroundColor: "var(--widget-bg-events)" }}
        >
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Upcoming Events
          </h3>
          {eventsLoading ? (
            <div className="text-center py-4">
              <span className="material-icons-two-tone text-[28px] text-text-muted animate-spin">
                autorenew
              </span>
              <p className="text-sm text-text-muted mt-2">Loading events...</p>
            </div>
          ) : events.length > 0 ? (
            <div className="space-y-3">
              {events.slice(0, 4).map((event) => {
                const date = new Date(event.start);
                const dayStr = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
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
                        {dayStr} · {timeStr}
                      </p>
                      {event.location && (
                        <p className="text-xs text-text-muted truncate">
                          {event.location}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4">
              <span className="material-icons-two-tone text-[28px] text-text-muted">
                event
              </span>
              <p className="text-sm text-text-muted mt-2">
                No upcoming events
              </p>
            </div>
          )}
        </div>

        {/* ═══ Group Directory ═══ */}
        <div
          className="rounded-lg border border-gray-200 shadow-xs p-6"
          style={{ gridColumn: "7 / 13", gridRow: "18 / 24" }}
        >
          <Link href="/members">
            <h3 className="text-sm font-semibold text-text-primary mb-4 hover:underline cursor-pointer">
              Group Directory
            </h3>
          </Link>
          <div className="space-y-3">
            {directoryMembers.length > 0
              ? directoryMembers.map((person) => (
                  <Link key={person.id} href={`/members/${person.id}`} className="flex items-center justify-between hover:bg-black/[0.03] -mx-2 px-2 py-1 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      {person.avatar_url ? (
                        <img
                          src={person.avatar_url}
                          alt={person.full_name || ""}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className={`w-9 h-9 rounded-full ${getAvatarColor(person.id)} flex items-center justify-center text-xs font-bold text-white`}
                        >
                          {getInitials(person.full_name)}
                        </div>
                      )}
                      <span className="text-sm font-medium text-text-primary">
                        {person.full_name || "Unknown"}
                      </span>
                    </div>
                    <span className="text-xs text-text-muted">
                      {getRoleLabel(person.role)}
                    </span>
                  </Link>
                ))
              : (
                <p className="text-sm text-text-muted">Loading members...</p>
              )}
          </div>
        </div>
      </div>

      {/* Signup Detail Modal */}
      <NbSignupModal
        signup={selectedSignup}
        assignment={selectedSignup ? getAssignment(selectedSignup.id) : null}
        members={allMembers}
        onClose={() => setSelectedSignup(null)}
        onAssigned={handleAssigned}
      />

      {/* Create Approval Modal */}
      {showApprovalModal && (
        <CreateApprovalModal
          onClose={() => setShowApprovalModal(false)}
          onCreated={() => setShowApprovalModal(false)}
        />
      )}

      {/* Log Hours Modal */}
      {showLogHoursModal && (
        <LogHoursModal
          onClose={() => setShowLogHoursModal(false)}
          onLogged={refreshHours}
        />
      )}

      {/* Hours Detail Overlay */}
      {showHoursDetail && (
        <HoursDetailOverlay
          entries={hourEntries}
          total={totalHours}
          thisWeek={weekHours}
          onClose={() => setShowHoursDetail(false)}
          onLogHours={() => setShowLogHoursModal(true)}
        />
      )}

      {/* Reimbursement Modal */}
      {showReimbursementModal && (
        <ReimbursementModal
          onClose={() => setShowReimbursementModal(false)}
          onCreated={() => {
            // Optionally refresh fundraising data
          }}
        />
      )}
    </aside>
  );
}

function SystemBadge({
  name,
  status = "functional",
  detail,
}: {
  name: string;
  status?: "functional" | "issues" | "error" | "not_connected";
  detail?: string;
}) {
  const dotColor =
    status === "functional" ? "bg-green-400" :
    status === "error" ? "bg-red-400" :
    status === "issues" ? "bg-orange-400" : "bg-gray-300";
  const badgeClass =
    status === "functional" ? "text-green-700 bg-green-100" :
    status === "error" ? "text-red-700 bg-red-100" :
    status === "issues" ? "text-orange-700 bg-orange-100" :
    "text-gray-500 bg-gray-100";
  const badgeLabel =
    status === "functional" ? (detail || "Functional") :
    status === "error" ? "Error" :
    status === "issues" ? "Issues Found" : "Not Connected";

  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2.5">
        <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
        <span className="text-sm text-text-primary">{name}</span>
      </div>
      <span className={`text-xs font-medium px-2.5 py-1 rounded ${badgeClass}`}>
        {badgeLabel}
      </span>
    </div>
  );
}
