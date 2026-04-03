"use client";

export default function ActionsWidget() {
  return (
    <div className="h-full overflow-auto p-6">
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
  );
}
