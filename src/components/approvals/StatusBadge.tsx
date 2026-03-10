"use client";

import type { ApprovalStatus } from "@/lib/types";

const STATUS_STYLES: Record<ApprovalStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-amber-100", text: "text-amber-700", label: "Pending" },
  approved: { bg: "bg-green-100", text: "text-green-700", label: "Approved" },
  changes_requested: { bg: "bg-orange-100", text: "text-orange-700", label: "Changes Requested" },
};

export default function StatusBadge({ status }: { status: ApprovalStatus }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  );
}
