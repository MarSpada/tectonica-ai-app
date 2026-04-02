"use client";

const goals: { label: string; current: number; target: number; pct: number; color: string; isCurrency?: boolean }[] = [];

const strategyNotes: { date: string; color: string; text: string }[] = [];

const upcomingEvents: { name: string; date: string; color: string }[] = [];

export default function CampaignStats() {
  return (
    <aside className="w-[280px] border-l border-card-stroke bg-card-bg flex flex-col h-full overflow-y-auto">
      {/* Campaign Goals */}
      <div className="px-4 pt-4 pb-3">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">
          Campaign Goals
        </h3>
        <div className="space-y-3">
          {goals.map((goal) => (
            <div key={goal.label}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-medium text-text-primary">{goal.label}</span>
                <span className="text-xs font-bold" style={{ color: goal.color }}>
                  {goal.pct}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-black/5 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${goal.pct}%`, backgroundColor: goal.color }}
                />
              </div>
              <p className="text-[10px] text-text-muted mt-0.5">
                {goal.isCurrency
                  ? `$${(goal.current / 1000).toFixed(0)}K / $${(goal.target / 1000).toFixed(0)}K`
                  : `${goal.current.toLocaleString()} / ${goal.target.toLocaleString()}`}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Strategy Notes */}
      <div className="px-4 pt-3 pb-3 border-t border-card-stroke">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">
          Strategy Notes
        </h3>
        <div className="space-y-3">
          {strategyNotes.map((note) => (
            <div key={note.date} className="bg-black/[.02] rounded-lg p-2.5">
              <span className={`inline-block text-[9px] font-bold text-white px-1.5 py-0.5 rounded ${note.color} mb-1.5`}>
                {note.date}
              </span>
              <p className="text-[11px] text-text-primary leading-relaxed">{note.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming */}
      <div className="px-4 pt-3 pb-4 border-t border-card-stroke">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">
          Upcoming
        </h3>
        <div className="space-y-2.5">
          {upcomingEvents.map((event) => (
            <div key={event.name} className="flex items-start gap-2.5">
              <div className={`w-2 h-2 rounded-full ${event.color} mt-1.5 flex-shrink-0`} />
              <div>
                <p className="text-xs font-semibold text-text-primary">{event.name}</p>
                <p className="text-[10px] text-text-muted">{event.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
