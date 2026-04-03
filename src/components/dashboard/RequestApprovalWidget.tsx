"use client";

import { Button } from "@/components/ui/button";

interface RequestApprovalWidgetProps {
  onStartApproval: () => void;
}

export default function RequestApprovalWidget({ onStartApproval }: RequestApprovalWidgetProps) {
  return (
    <div className="h-full overflow-auto p-6 flex flex-col">
      <h3 className="text-sm font-semibold text-text-primary mb-1">Request Approval</h3>
      <p className="text-sm text-text-muted">Send an idea or asset for approval</p>
      <Button
        variant="outline"
        onClick={onStartApproval}
        className="mt-auto self-stretch"
      >
        Start
      </Button>
    </div>
  );
}
