"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Responsive, WidthProvider } from "react-grid-layout/legacy";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import type { Layout as RGLLayout } from "react-grid-layout/legacy";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useUserProfile } from "@/lib/UserProfileContext";
import {
  WIDGET_CONSTRAINTS,
  WIDGET_LABELS,
  SYSTEM_DEFAULT_LAYOUT,
  getVisibleWidgets,
  filterLayoutToRole,
} from "@/lib/dashboard-widgets";
import type { WidgetId } from "@/lib/dashboard-widgets";
import type {
  Member,
  GroupMessage,
  NbSignup,
  SignupAssignment,
  HourEntry,
  CalendarEvent,
  FundraisingGoal,
  FundraisingHistory,
  HoursWeekBucket,
  LayoutItem,
} from "@/lib/types";
import type { UserRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import NbSignupModal from "./signups/NbSignupModal";
import CreateApprovalModal from "./approvals/CreateApprovalModal";
import ReimbursementModal from "./ReimbursementModal";
import LogHoursModal from "./hours/LogHoursModal";
import HoursDetailOverlay from "./hours/HoursDetailOverlay";

import SignupsWidget from "./dashboard/SignupsWidget";
import RecruitWidget from "./dashboard/RecruitWidget";
import ConversationsWidget from "./dashboard/ConversationsWidget";
import ActionsWidget from "./dashboard/ActionsWidget";
import FundraisingWidget from "./dashboard/FundraisingWidget";
import RecruitmentGoalWidget from "./dashboard/RecruitmentGoalWidget";
import RequestApprovalWidget from "./dashboard/RequestApprovalWidget";
import ConnectedSystemsWidget from "./dashboard/ConnectedSystemsWidget";
import HoursWidget from "./dashboard/HoursWidget";
import EventsWidget from "./dashboard/EventsWidget";
import DirectoryWidget from "./dashboard/DirectoryWidget";

const ResponsiveGridLayout = WidthProvider(Responsive);

const WIDGET_BG: Record<WidgetId, string> = {
  signups: "var(--widget-bg-signups)",
  recruit: "var(--widget-bg-recruit)",
  conversations: "var(--widget-bg-conversations)",
  actions: "var(--widget-bg-actions)",
  fundraising: "var(--widget-bg-fundraising)",
  recruitment_goal: "var(--widget-bg-recruitment-goal)",
  request_approval: "var(--widget-bg-request-approval)",
  connected_systems: "var(--widget-bg-connected-systems)",
  hours_volunteered: "var(--widget-bg-hours)",
  upcoming_events: "var(--widget-bg-events)",
  group_directory: "var(--widget-bg-directory, #fff)",
};

interface RightSidebarProps {
  groupMessages?: GroupMessage[];
  onOpenConversation?: () => void;
}

export default function RightSidebar({
  groupMessages = [],
  onOpenConversation,
}: RightSidebarProps) {
  const { profile } = useUserProfile();
  const role = (profile?.role || "member") as UserRole;
  const isSuperAdmin = role === "super_admin";

  // Layout state
  const [layout, setLayout] = useState<LayoutItem[]>([]);
  const [layoutLoading, setLayoutLoading] = useState(true);
  const [layoutSource, setLayoutSource] = useState<"user" | "org" | "system">("system");
  const [showResetDialog, setShowResetDialog] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasUserInteracted = useRef(false);

  // Data state
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
  const [showReimbursementModal, setShowReimbursementModal] = useState(false);
  const [fundraisingHistory, setFundraisingHistory] = useState<FundraisingHistory[]>([]);
  const [hoursHistory, setHoursHistory] = useState<HoursWeekBucket[]>([]);

  const memberCount = allMembers.filter((m) =>
    ["super_admin", "group_admin", "member"].includes(m.role)
  ).length;
  const supporterCount = allMembers.filter((m) => m.role === "supporter").length;

  // Fetch layout
  useEffect(() => {
    async function fetchLayout() {
      try {
        const res = await fetch("/api/dashboard/layout");
        const json = await res.json();
        if (json.layout) {
          setLayout(json.layout);
          setLayoutSource(json.source || "system");
        } else {
          // Fallback to system default filtered by role
          setLayout(filterLayoutToRole(SYSTEM_DEFAULT_LAYOUT, role));
          setLayoutSource("system");
        }
      } catch {
        setLayout(filterLayoutToRole(SYSTEM_DEFAULT_LAYOUT, role));
        setLayoutSource("system");
      } finally {
        setLayoutLoading(false);
      }
    }
    fetchLayout();
  }, [role]);

  // Fetch all widget data
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
        if (json.sources)
          setCalendarSourceCount(json.sources.filter((s: { enabled: boolean }) => s.enabled).length);
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

  // Auto-save layout (debounced)
  const saveLayout = useCallback(
    (newLayout: LayoutItem[]) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch("/api/dashboard/layout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ layout: newLayout }),
          });
          if (res.ok) {
            toast.success("Layout saved");
            setLayoutSource("user");
          } else {
            toast.error("Failed to save layout");
          }
        } catch {
          toast.error("Failed to save layout");
        }
      }, 1000);
    },
    []
  );

  function handleLayoutChange(newLayout: RGLLayout) {
    if (!hasUserInteracted.current) return;
    const mapped: LayoutItem[] = newLayout.map((item) => ({
      i: item.i,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
    }));
    setLayout(mapped);
    saveLayout(mapped);
  }

  // Reset to default
  async function handleReset() {
    setShowResetDialog(false);
    try {
      const res = await fetch("/api/dashboard/layout", { method: "DELETE" });
      if (res.ok) {
        // Reload layout
        const layoutRes = await fetch("/api/dashboard/layout");
        const json = await layoutRes.json();
        if (json.layout) {
          setLayout(json.layout);
          setLayoutSource(json.source || "system");
        }
        toast.success("Layout reset");
      } else {
        toast.error("Failed to reset layout");
      }
    } catch {
      toast.error("Failed to reset layout");
    }
  }

  // Save as org default (super_admin)
  async function handleSaveAsOrgDefault() {
    try {
      const res = await fetch("/api/admin/dashboard/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layout }),
      });
      if (res.ok) {
        toast.success("Saved as org default");
      } else {
        toast.error("Failed to save org default");
      }
    } catch {
      toast.error("Failed to save org default");
    }
  }

  function handleAssigned(newAssignment: SignupAssignment) {
    setAssignments((prev) => {
      const filtered = prev.filter((a) => a.nb_signup_id !== newAssignment.nb_signup_id);
      return [...filtered, newAssignment];
    });
    setSelectedSignup(null);
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

  // Visible widgets for current role
  const visibleWidgetIds = new Set(getVisibleWidgets(role));

  // Filter layout to only visible widgets
  const visibleLayout = layout.filter((item) => visibleWidgetIds.has(item.i as WidgetId));

  // Build RGL layout with constraints
  const rglLayout = visibleLayout.map((item) => {
    const constraints = WIDGET_CONSTRAINTS[item.i as WidgetId];
    return {
      ...item,
      ...(constraints && {
        minW: constraints.minW,
        maxW: constraints.maxW,
        minH: constraints.minH,
        maxH: constraints.maxH,
      }),
    };
  });

  // Render widget by ID
  function renderWidget(widgetId: WidgetId) {
    switch (widgetId) {
      case "signups":
        return (
          <SignupsWidget
            signups={signups}
            nbStatus={nbStatus}
            assignments={assignments}
            onSignupClick={setSelectedSignup}
          />
        );
      case "recruit":
        return <RecruitWidget />;
      case "conversations":
        return (
          <ConversationsWidget
            groupMessages={groupMessages}
            onOpenConversation={onOpenConversation}
          />
        );
      case "actions":
        return <ActionsWidget />;
      case "fundraising":
        return (
          <FundraisingWidget
            fundraising={fundraising}
            fundraisingHistory={fundraisingHistory}
            isAdmin={isAdmin}
            onFundraisingUpdate={setFundraising}
            onRequestReimbursement={() => setShowReimbursementModal(true)}
          />
        );
      case "recruitment_goal":
        return (
          <RecruitmentGoalWidget
            memberCount={memberCount}
            supporterCount={supporterCount}
          />
        );
      case "request_approval":
        return (
          <RequestApprovalWidget onStartApproval={() => setShowApprovalModal(true)} />
        );
      case "connected_systems":
        return (
          <ConnectedSystemsWidget
            nbStatus={nbStatus}
            calendarSourceCount={calendarSourceCount}
            eventsCount={events.length}
          />
        );
      case "hours_volunteered":
        return (
          <HoursWidget
            totalHours={totalHours}
            weekHours={weekHours}
            prevWeekHours={prevWeekHours}
            hoursHistory={hoursHistory}
            onLogHours={() => setShowLogHoursModal(true)}
            onShowDetail={() => setShowHoursDetail(true)}
          />
        );
      case "upcoming_events":
        return <EventsWidget events={events} eventsLoading={eventsLoading} />;
      case "group_directory":
        return <DirectoryWidget members={allMembers} />;
      default:
        return null;
    }
  }

  return (
    <aside className="right-sidebar-responsive w-[var(--right-sidebar)] bg-bg border-l border-black/5 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-0">
        <h2 className="text-lg font-bold text-text-primary">Group Dashboard</h2>
        <div className="flex items-center gap-1">
          {isSuperAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveAsOrgDefault}
              className="text-xs text-text-muted"
              title="Save current layout as default for your organization"
            >
              <Icon name="check" size={14} className="mr-1" />
              Save as default
            </Button>
          )}
          {layoutSource === "user" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowResetDialog(true)}
              className="text-xs text-text-muted"
              title="Reset to default layout"
            >
              <Icon name="refresh" size={14} className="mr-1" />
              Reset layout
            </Button>
          )}
        </div>
      </div>

      {/* Grid */}
      {layoutLoading ? (
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-gray-200 bg-gray-50 animate-pulse"
              style={{ height: `${80 + i * 20}px` }}
            />
          ))}
        </div>
      ) : (
        <div className="px-2 animate-fade-in">
          <ResponsiveGridLayout
            layouts={{ lg: rglLayout }}
            breakpoints={{ lg: 0 }}
            cols={{ lg: 3 }}
            rowHeight={50}
            margin={[12, 12]}
            containerPadding={[8, 12]}
            compactType="vertical"
            preventCollision={false}
            draggableHandle=".widget-drag-handle"
            isResizable={true}
            isDraggable={true}
            onDragStart={() => { hasUserInteracted.current = true; }}
            onResizeStart={() => { hasUserInteracted.current = true; }}
            onLayoutChange={handleLayoutChange}
            useCSSTransforms={true}
          >
            {visibleLayout.map((item) => {
              const widgetId = item.i as WidgetId;
              return (
                <div
                  key={widgetId}
                  className="group/widget rounded-lg border border-gray-200 shadow-xs overflow-hidden"
                  style={{ backgroundColor: WIDGET_BG[widgetId] || "var(--card-bg)" }}
                >
                  {/* Drag handle */}
                  <div className="widget-drag-handle flex items-center justify-between px-4 pt-2 cursor-grab active:cursor-grabbing">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted opacity-0 group-hover/widget:opacity-60 transition-opacity select-none">
                      {WIDGET_LABELS[widgetId]}
                    </span>
                    <div className="opacity-0 group-hover/widget:opacity-40 hover:!opacity-100 transition-opacity">
                      <Icon name="drag-handle" size={14} />
                    </div>
                  </div>
                  {renderWidget(widgetId)}
                </div>
              );
            })}
          </ResponsiveGridLayout>
        </div>
      )}

      {/* Reset Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset to default layout?</DialogTitle>
            <DialogDescription>
              Your current arrangement will be lost. The dashboard will use the
              organization default or system default layout.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleReset}>Reset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modals */}
      <NbSignupModal
        signup={selectedSignup}
        assignment={
          selectedSignup
            ? assignments.find((a) => a.nb_signup_id === selectedSignup.id) || null
            : null
        }
        members={allMembers}
        onClose={() => setSelectedSignup(null)}
        onAssigned={handleAssigned}
      />
      {showApprovalModal && (
        <CreateApprovalModal
          onClose={() => setShowApprovalModal(false)}
          onCreated={() => setShowApprovalModal(false)}
        />
      )}
      {showLogHoursModal && (
        <LogHoursModal
          onClose={() => setShowLogHoursModal(false)}
          onLogged={refreshHours}
        />
      )}
      {showHoursDetail && (
        <HoursDetailOverlay
          entries={hourEntries}
          total={totalHours}
          thisWeek={weekHours}
          onClose={() => setShowHoursDetail(false)}
          onLogHours={() => setShowLogHoursModal(true)}
        />
      )}
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
