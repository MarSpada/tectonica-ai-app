"use client";

import type { ApprovalStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<ApprovalStatus, { className: string; label: string }> = {
  pending: { className: "bg-amber-100 text-amber-700 border-amber-200", label: "Pending" },
  approved: { className: "bg-green-100 text-green-700 border-green-200", label: "Approved" },
  changes_requested: { className: "bg-orange-100 text-orange-700 border-orange-200", label: "Changes Requested" },
};

export default function StatusBadge({ status }: { status: ApprovalStatus }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <Badge variant="outline" className={`text-[10px] ${config.className}`}>
      {config.label}
    </Badge>
  );
}
