"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { ROLES, isSuperAdmin as isSuperAdminRole } from "@/lib/constants/roles";
import { useUserProfile } from "@/lib/UserProfileContext";
import {
  SYSTEM_DEFAULT_LAYOUT,
  filterLayoutToRole,
} from "@/lib/dashboard-widgets";
import type {
  Action,
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
  GroupGoals,
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
import ActionDetailSheet from "./actions/ActionDetailSheet";
import WidgetGrid from "./dashboard/WidgetGrid";

interface RightSidebarProps {
  groupMessages?: GroupMessage[];
  onOpenConversation?: () => void;
}

export default function RightSidebar({
  groupMessages = [],
  onOpenConversation,
}: RightSidebarProps) {
  const { profile } = useUserProfile();
  const role = (profile?.role || ROLES.MEMBER) as UserRole;
  const isSuperAdmin = isSuperAdminRole(role);

  // Layout state
  const [layout, setLayout] = useState<LayoutItem[]>([]);
  const [layoutLoading, setLayoutLoading] = useState(true);
  const [layoutSource, setLayoutSource] = useState<"user" | "org" | "system">("system");
  const [isEditMode, setIsEditMode] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const layoutRef = useRef<LayoutItem[]>([]);

  // Keep ref in sync for unmount save
  useEffect(() => {
    layoutRef.current = layout;
  }, [layout]);

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
  const [groupGoals, setGroupGoals] = useState<GroupGoals | null>(null);
  const [showReimbursementModal, setShowReimbursementModal] = useState(false);
  const [fundraisingHistory, setFundraisingHistory] = useState<FundraisingHistory[]>([]);
  const [hoursHistory, setHoursHistory] = useState<HoursWeekBucket[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [runpodStatus, setRunpodStatus] = useState<"connected" | "error" | "not_configured" | "loading">("loading");
  const [imageApiStatus, setImageApiStatus] = useState<"connected" | "error" | "not_configured" | "loading">("loading");

  const memberCount = allMembers.filter((m) => m.role !== ROLES.SUPPORTER).length;
  const supporterCount = allMembers.filter((m) => m.role === ROLES.SUPPORTER).length;

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
      } catch {
        // Fundraising unavailable
      }
    }
    async function fetchGoals() {
      try {
        const res = await fetch("/api/goals");
        const json = await res.json();
        if (json.goals) setGroupGoals(json.goals);
      } catch {
        // Goals unavailable
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
    async function fetchActions() {
      try {
        const res = await fetch("/api/actions?status=active&limit=3");
        const json = await res.json();
        if (json.actions) setActions(json.actions);
      } catch {
        // Actions unavailable
      }
    }
    async function fetchRunpodStatus() {
      try {
        const res = await fetch("/api/admin/integrations/runpod");
        if (res.ok) {
          const json = await res.json();
          setRunpodStatus(json.status || "not_configured");
        } else {
          // Non-admin users get 403 — show not_configured gracefully
          setRunpodStatus("not_configured");
        }
      } catch {
        setRunpodStatus("not_configured");
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
    fetchGoals();
    fetchActions();
    fetchRunpodStatus();
    async function fetchImageApiStatus() {
      try {
        const res = await fetch("/api/image-tools/credentials-status");
        if (res.ok) {
          const json = await res.json();
          setImageApiStatus(json.configured ? "connected" : "not_configured");
        } else {
          setImageApiStatus("not_configured");
        }
      } catch {
        setImageApiStatus("not_configured");
      }
    }
    fetchImageApiStatus();
  }, []);

  // Auto-save on unmount if in edit mode
  const isEditModeRef = useRef(false);
  useEffect(() => {
    isEditModeRef.current = isEditMode;
  }, [isEditMode]);

  useEffect(() => {
    return () => {
      if (isEditModeRef.current) {
        fetch("/api/dashboard/layout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ layout: layoutRef.current }),
        }).catch(() => {});
      }
    };
  }, []);

  // Force recompaction after resize
  function handleResizeStop() {
    setLayout((prev) => [...prev]);
  }

  // Save to user layout
  async function saveUserLayout() {
    try {
      const res = await fetch("/api/dashboard/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layout }),
      });
      if (res.ok) {
        setLayoutSource("user");
        toast.success("Layout saved");
      } else {
        toast.error("Failed to save layout");
      }
    } catch {
      toast.error("Failed to save layout");
    }
  }

  // Save as org default + user layout
  async function saveOrgDefault() {
    try {
      const [orgRes, userRes] = await Promise.all([
        fetch("/api/admin/dashboard/layout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ layout }),
        }),
        fetch("/api/dashboard/layout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ layout }),
        }),
      ]);
      if (orgRes.ok && userRes.ok) {
        setLayoutSource("user");
        toast.success("Org default updated");
      } else {
        toast.error("Failed to save org default");
      }
    } catch {
      toast.error("Failed to save org default");
    }
  }

  // Handle save button click
  function handleSave() {
    if (isSuperAdmin) {
      setShowSaveDialog(true);
    } else {
      saveUserLayout();
      setIsEditMode(false);
    }
  }

  // Reset to default
  async function handleReset() {
    setShowResetDialog(false);
    try {
      const res = await fetch("/api/dashboard/layout", { method: "DELETE" });
      if (res.ok) {
        const layoutRes = await fetch("/api/dashboard/layout");
        const json = await layoutRes.json();
        if (json.layout) {
          setLayout(json.layout);
          setLayoutSource(json.source || "system");
        }
        setIsEditMode(false);
        toast.success("Layout reset");
      } else {
        toast.error("Failed to reset layout");
      }
    } catch {
      toast.error("Failed to reset layout");
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

  return (
    <aside className="right-sidebar-responsive w-[var(--right-sidebar)] bg-bg border-l border-black/5 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-0">
        <h2 className="font-bold text-text-primary" style={{ fontSize: "1.2em" }}>Group Dashboard</h2>
        <div className="flex items-center gap-1">
          {isEditMode ? (
            <Button variant="outline" size="sm" onClick={handleSave}>
              <Icon name="check" size={14} className="mr-1" />
              Save
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setIsEditMode(true)}>
              <Icon name="edit" size={14} className="mr-1" />
              Edit layout
            </Button>
          )}
          {!isSuperAdmin && layoutSource === "user" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowResetDialog(true)}
              className="text-xs text-text-muted"
            >
              <Icon name="refresh" size={14} className="mr-1" />
              Reset to default
            </Button>
          )}
        </div>
      </div>

      {/* Widget Grid */}
      <WidgetGrid
        layout={layout}
        role={role}
        isEditMode={isEditMode}
        layoutLoading={layoutLoading}
        onLayoutChange={setLayout}
        onResizeStop={handleResizeStop}
        signups={signups}
        nbStatus={nbStatus}
        assignments={assignments}
        groupMessages={groupMessages}
        actions={actions}
        allMembers={allMembers}
        memberCount={memberCount}
        supporterCount={supporterCount}
        events={events}
        eventsLoading={eventsLoading}
        calendarSourceCount={calendarSourceCount}
        totalHours={totalHours}
        weekHours={weekHours}
        prevWeekHours={prevWeekHours}
        hoursHistory={hoursHistory}
        fundraising={fundraising}
        groupGoals={groupGoals}
        fundraisingHistory={fundraisingHistory}
        onSignupClick={setSelectedSignup}
        onOpenConversation={onOpenConversation}
        onActionClick={setSelectedActionId}
        onStartApproval={() => setShowApprovalModal(true)}
        onLogHours={() => setShowLogHoursModal(true)}
        onShowHoursDetail={() => setShowHoursDetail(true)}
        onRequestReimbursement={() => setShowReimbursementModal(true)}
        runpodStatus={runpodStatus}
        imageApiStatus={imageApiStatus}
      />

      {/* Reset Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset to default layout?</DialogTitle>
            <DialogDescription>
              Your personal arrangement will be lost. The dashboard will use the
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

      {/* Super Admin Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save layout</DialogTitle>
            <DialogDescription>
              Choose where to save your dashboard arrangement.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                saveUserLayout();
                setIsEditMode(false);
                setShowSaveDialog(false);
              }}
            >
              Save for me only
            </Button>
            <Button
              onClick={() => {
                saveOrgDefault();
                setIsEditMode(false);
                setShowSaveDialog(false);
              }}
            >
              Save as org default
            </Button>
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
      <ActionDetailSheet
        actionId={selectedActionId}
        userRole={role}
        onClose={() => setSelectedActionId(null)}
        onUpdated={async () => {
          try {
            const res = await fetch("/api/actions?status=active&limit=3");
            const json = await res.json();
            if (json.actions) setActions(json.actions);
          } catch {}
        }}
      />
    </aside>
  );
}
