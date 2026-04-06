"use client";

import { Responsive, WidthProvider } from "react-grid-layout/legacy";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import type { Layout as RGLLayout } from "react-grid-layout/legacy";
import {
  WIDGET_CONSTRAINTS,
  WIDGET_LABELS,
  getVisibleWidgets,
} from "@/lib/dashboard-widgets";
import type { WidgetId } from "@/lib/dashboard-widgets";
import type {
  Action,
  Member,
  GroupMessage,
  NbSignup,
  SignupAssignment,
  CalendarEvent,
  FundraisingGoal,
  FundraisingHistory,
  HoursWeekBucket,
  LayoutItem,
  GroupGoals,
  UserRole,
} from "@/lib/types";
import { Icon } from "@/components/ui/icon";

import SignupsWidget from "./SignupsWidget";
import RecruitWidget from "./RecruitWidget";
import ConversationsWidget from "./ConversationsWidget";
import ActionsWidget from "./ActionsWidget";
import FundraisingWidget from "./FundraisingWidget";
import RecruitmentGoalWidget from "./RecruitmentGoalWidget";
import RequestApprovalWidget from "./RequestApprovalWidget";
import ConnectedSystemsWidget from "./ConnectedSystemsWidget";
import HoursWidget from "./HoursWidget";
import EventsWidget from "./EventsWidget";
import DirectoryWidget from "./DirectoryWidget";

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

interface WidgetGridProps {
  layout: LayoutItem[];
  role: UserRole;
  isEditMode: boolean;
  layoutLoading: boolean;
  onLayoutChange: (layout: LayoutItem[]) => void;
  onResizeStop: () => void;
  // Widget data
  signups: NbSignup[];
  nbStatus: "connected" | "error" | "not_configured" | "loading";
  assignments: SignupAssignment[];
  groupMessages: GroupMessage[];
  actions: Action[];
  allMembers: Member[];
  memberCount: number;
  supporterCount: number;
  events: CalendarEvent[];
  eventsLoading: boolean;
  calendarSourceCount: number;
  totalHours: number;
  weekHours: number;
  prevWeekHours: number;
  hoursHistory: HoursWeekBucket[];
  fundraising: FundraisingGoal | null;
  groupGoals: GroupGoals | null;
  fundraisingHistory: FundraisingHistory[];
  // Callbacks
  onSignupClick: (signup: NbSignup) => void;
  onOpenConversation?: () => void;
  onActionClick: (actionId: string) => void;
  onStartApproval: () => void;
  onLogHours: () => void;
  onShowHoursDetail: () => void;
  onRequestReimbursement: () => void;
  runpodStatus?: "connected" | "error" | "not_configured" | "loading";
  imageApiStatus?: "connected" | "error" | "not_configured" | "loading";
}

export default function WidgetGrid({
  layout,
  role,
  isEditMode,
  layoutLoading,
  onLayoutChange,
  onResizeStop,
  signups,
  nbStatus,
  assignments,
  groupMessages,
  actions,
  allMembers,
  memberCount,
  supporterCount,
  events,
  eventsLoading,
  calendarSourceCount,
  totalHours,
  weekHours,
  prevWeekHours,
  hoursHistory,
  fundraising,
  groupGoals,
  fundraisingHistory,
  onSignupClick,
  onOpenConversation,
  onActionClick,
  onStartApproval,
  onLogHours,
  onShowHoursDetail,
  onRequestReimbursement,
  runpodStatus,
  imageApiStatus,
}: WidgetGridProps) {
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

  function handleLayoutChange(newLayout: RGLLayout) {
    const mapped: LayoutItem[] = newLayout.map((item) => ({
      i: item.i,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
    }));
    onLayoutChange(mapped);
  }

  function renderWidget(widgetId: WidgetId) {
    switch (widgetId) {
      case "signups":
        return (
          <SignupsWidget
            signups={signups}
            nbStatus={nbStatus}
            assignments={assignments}
            onSignupClick={onSignupClick}
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
        return <ActionsWidget actions={actions} onActionClick={onActionClick} />;
      case "fundraising":
        return (
          <FundraisingWidget
            fundraising={fundraising}
            groupGoals={groupGoals}
            fundraisingHistory={fundraisingHistory}
            onRequestReimbursement={onRequestReimbursement}
          />
        );
      case "recruitment_goal":
        return (
          <RecruitmentGoalWidget
            memberCount={memberCount}
            supporterCount={supporterCount}
            membersGoal={groupGoals?.members_goal || 0}
            supportersGoal={groupGoals?.supporters_goal || 0}
          />
        );
      case "request_approval":
        return <RequestApprovalWidget onStartApproval={onStartApproval} />;
      case "connected_systems":
        return (
          <ConnectedSystemsWidget
            nbStatus={nbStatus}
            calendarSourceCount={calendarSourceCount}
            eventsCount={events.length}
            runpodStatus={runpodStatus}
            imageApiStatus={imageApiStatus}
          />
        );
      case "hours_volunteered":
        return (
          <HoursWidget
            totalHours={totalHours}
            weekHours={weekHours}
            prevWeekHours={prevWeekHours}
            hoursHistory={hoursHistory}
            onLogHours={onLogHours}
            onShowDetail={onShowHoursDetail}
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

  if (layoutLoading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-gray-50 animate-pulse"
            style={{ height: `${80 + i * 20}px` }}
          />
        ))}
      </div>
    );
  }

  return (
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
        isResizable={isEditMode}
        isDraggable={isEditMode}
        onResizeStop={onResizeStop}
        onLayoutChange={handleLayoutChange}
        useCSSTransforms={true}
      >
        {visibleLayout.map((item) => {
          const widgetId = item.i as WidgetId;
          return (
            <div
              key={widgetId}
              className={`rounded-lg overflow-hidden ${
                isEditMode
                  ? "border-2 border-dashed border-border shadow-xs"
                  : ""
              }`}
              style={{ backgroundColor: WIDGET_BG[widgetId] || "var(--card-bg)" }}
            >
              {isEditMode && (
                <div className="widget-drag-handle flex items-center justify-between px-4 pt-2 cursor-grab active:cursor-grabbing">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted opacity-60 select-none">
                    {WIDGET_LABELS[widgetId]}
                  </span>
                  <Icon name="drag-handle" size={14} className="opacity-40" />
                </div>
              )}
              {renderWidget(widgetId)}
            </div>
          );
        })}
      </ResponsiveGridLayout>
    </div>
  );
}
