"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { isSuperAdmin } from "@/lib/constants/roles";
import type { UserRole } from "@/lib/types";

interface ConnectedSystemsWidgetProps {
  nbStatus: "connected" | "error" | "not_configured" | "loading";
  nbEnabled?: boolean;
  calendarSourceCount: number;
  eventsCount: number;
  runpodStatus?: "connected" | "error" | "not_configured" | "loading";
  imageApiStatus?: "connected" | "error" | "not_configured" | "loading";
  role: UserRole;
}

export default function ConnectedSystemsWidget({
  nbStatus,
  nbEnabled,
  calendarSourceCount,
  eventsCount,
  runpodStatus,
  imageApiStatus,
  role,
}: ConnectedSystemsWidgetProps) {
  const showAdminRows = isSuperAdmin(role);

  return (
    <div className="p-5 flex flex-col h-full">
      <h3 className="font-bold mb-4" style={{ fontSize: "var(--widget-title-size)", color: "var(--widget-text-color)" }}>Connected Systems</h3>
      <div className="space-y-3 flex-1">
        {showAdminRows && (
          <div className="flex items-center justify-between rounded-lg px-4 py-2.5" style={{ backgroundColor: "var(--widget-list-item-bg)" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center">
                <Icon name="widget-ai-models" size={16} />
              </div>
              <span className="font-medium" style={{ fontSize: "var(--widget-list-primary-size)", color: "var(--widget-text-color)" }}>AI Models</span>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              runpodStatus === "connected"
                ? "text-green-700 bg-green-100"
                : runpodStatus === "error"
                  ? "text-red-700 bg-red-100"
                  : "text-gray-500 bg-gray-100"
            }`}>
              {runpodStatus === "connected" ? "RunPod" : runpodStatus === "error" ? "Error" : "Not connected"}
            </span>
          </div>
        )}
        {showAdminRows && (
          <div className="flex items-center justify-between rounded-lg px-4 py-2.5" style={{ backgroundColor: "var(--widget-list-item-bg)" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                <Icon name="bot-graphics" size={16} />
              </div>
              <span className="font-medium" style={{ fontSize: "var(--widget-list-primary-size)", color: "var(--widget-text-color)" }}>Image API</span>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              imageApiStatus === "connected"
                ? "text-green-700 bg-green-100"
                : imageApiStatus === "error"
                  ? "text-red-700 bg-red-100"
                  : "text-gray-500 bg-gray-100"
            }`}>
              {imageApiStatus === "connected" ? "Configured" : imageApiStatus === "error" ? "Error" : "Not connected"}
            </span>
          </div>
        )}
        <SystemBadge name="Action Network" icon="/systems-icon-action-network.png" status="not_connected" />
        {nbEnabled && (
          <SystemBadge
            name="NationBuilder"
            icon="/systems-icon-nation-builder.png"
            status={nbStatus === "connected" ? "functional" : nbStatus === "error" ? "error" : "not_connected"}
          />
        )}
        <SystemBadge name="Calendar" icon="/systems-icon-google-calendar.png"
          status={calendarSourceCount > 0 || eventsCount > 0 ? "functional" : "not_connected"}
          detail={
            calendarSourceCount > 0
              ? `${calendarSourceCount} feed${calendarSourceCount > 1 ? "s" : ""}`
              : eventsCount > 0
                ? "Connected"
                : undefined
          }
        />
        <SystemBadge name="Mobilize" icon="/systems-icon-mobilize.png" status="not_connected" />
      </div>
      {showAdminRows && (
        <Link
          href="/admin?tab=integrations"
          className="widget-cta-btn mt-4 w-full rounded-sm text-white font-semibold cursor-pointer block text-center"
          style={{ backgroundColor: "var(--widget-btn-connected, var(--accent-purple))", fontSize: "var(--widget-btn-label-size)", padding: "8px 0" }}
        >
          Manage Integrations
        </Link>
      )}
    </div>
  );
}

function SystemBadge({
  name,
  icon,
  status = "functional",
  detail,
}: {
  name: string;
  icon?: string;
  status?: "functional" | "issues" | "error" | "not_connected";
  detail?: string;
}) {
  const badgeClass =
    status === "functional"
      ? "text-green-700 bg-green-100"
      : status === "error"
        ? "text-red-700 bg-red-100"
        : status === "issues"
          ? "text-orange-700 bg-orange-100"
          : "text-gray-500 bg-gray-100";
  const badgeLabel =
    status === "functional"
      ? detail || "Connected"
      : status === "error"
        ? "Error"
        : status === "issues"
          ? "Issues Found"
          : "Not connected";

  return (
    <div className="flex items-center justify-between rounded-lg px-4 py-2.5" style={{ backgroundColor: "var(--widget-list-item-bg)" }}>
      <div className="flex items-center gap-2.5">
        {icon && <img src={icon} alt="" className="w-7 h-7 rounded-full object-cover" />}
        <span className="font-medium" style={{ fontSize: "var(--widget-list-primary-size)", color: "var(--widget-text-color)" }}>{name}</span>
      </div>
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badgeClass}`}>{badgeLabel}</span>
    </div>
  );
}
