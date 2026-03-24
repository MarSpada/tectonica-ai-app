"use client";

import { useState } from "react";

interface LogHoursModalProps {
  onClose: () => void;
  onLogged: () => void;
}

export default function LogHoursModal({ onClose, onLogged }: LogHoursModalProps) {
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [activityDate, setActivityDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    const h = parseFloat(hours);
    if (!h || h <= 0 || h > 24) {
      setError("Enter a valid number of hours (0.25 – 24)");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hours: h,
          description: description.trim() || null,
          activityDate,
        }),
      });

      if (res.ok) {
        onLogged();
        onClose();
      } else {
        const json = await res.json();
        setError(json.error || "Failed to log hours");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm mx-4 bg-white rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/5">
          <h2 className="text-base font-bold text-text-primary">Log Volunteer Hours</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/5 transition-colors">
            <span className="material-icons-two-tone text-[20px] text-text-muted">close</span>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="px-3 py-2 text-xs text-red-700 bg-red-50 rounded-lg">{error}</div>
          )}

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Hours <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="e.g., 2.5"
              min="0.25"
              max="24"
              step="0.25"
              className="w-full px-3 py-2 text-sm border border-black/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-purple"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">Date</label>
            <input
              type="date"
              value={activityDate}
              onChange={(e) => setActivityDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2 text-sm border border-black/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-purple"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              What did you do?
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Door knocking, phone banking..."
              maxLength={200}
              className="w-full px-3 py-2 text-sm border border-black/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-purple"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-black/5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-text-secondary hover:bg-black/5 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !hours}
            className="px-5 py-2 text-xs font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Logging..." : "Log Hours"}
          </button>
        </div>
      </div>
    </div>
  );
}
