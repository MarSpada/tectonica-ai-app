"use client";

interface RequestApprovalWidgetProps {
  onStartApproval: () => void;
}

export default function RequestApprovalWidget({ onStartApproval }: RequestApprovalWidgetProps) {
  return (
    <div className="h-full overflow-auto p-5 flex flex-col">
      <h3 className="font-bold mb-1" style={{ fontSize: "var(--widget-title-size)", color: "var(--widget-text-color)" }}>Request Approvals</h3>
      <p className="font-semibold" style={{ fontSize: "var(--widget-metric-sm)", color: "var(--widget-text-muted)" }}>Send an idea or asset for approval</p>
      <button
        onClick={onStartApproval}
        className="widget-cta-btn mt-auto w-full rounded-sm text-white font-semibold cursor-pointer"
        style={{ backgroundColor: "var(--widget-btn-approval)", fontSize: "var(--widget-btn-label-size)", padding: "10px 0" }}
      >
        Start
      </button>
    </div>
  );
}
