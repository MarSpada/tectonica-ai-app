"use client";

interface ConnectedSystemsWidgetProps {
  nbStatus: "connected" | "error" | "not_configured" | "loading";
  calendarSourceCount: number;
  eventsCount: number;
}

export default function ConnectedSystemsWidget({
  nbStatus,
  calendarSourceCount,
  eventsCount,
}: ConnectedSystemsWidgetProps) {
  return (
    <div className="h-full overflow-auto p-6">
      <h3 className="text-sm font-semibold text-text-primary mb-4">Connected Systems</h3>
      <div className="space-y-3">
        <SystemBadge name="Action Network" status="not_connected" />
        <SystemBadge
          name="NationBuilder"
          status={nbStatus === "connected" ? "functional" : nbStatus === "error" ? "error" : "not_connected"}
        />
        <SystemBadge name="Mobilize" status="not_connected" />
        <SystemBadge
          name="Calendar"
          status={calendarSourceCount > 0 || eventsCount > 0 ? "functional" : "not_connected"}
          detail={
            calendarSourceCount > 0
              ? `${calendarSourceCount} feed${calendarSourceCount > 1 ? "s" : ""}`
              : eventsCount > 0
                ? "Connected"
                : undefined
          }
        />
      </div>
    </div>
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
    status === "functional"
      ? "bg-green-400"
      : status === "error"
        ? "bg-red-400"
        : status === "issues"
          ? "bg-orange-400"
          : "bg-gray-300";
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
      ? detail || "Functional"
      : status === "error"
        ? "Error"
        : status === "issues"
          ? "Issues Found"
          : "Not Connected";

  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2.5">
        <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
        <span className="text-sm text-text-primary">{name}</span>
      </div>
      <span className={`text-xs font-medium px-2.5 py-1 rounded ${badgeClass}`}>{badgeLabel}</span>
    </div>
  );
}
