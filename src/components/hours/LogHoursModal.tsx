"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Volunteer Hours</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="px-3 py-2 text-xs text-red-700 bg-red-50 rounded-lg">{error}</div>
          )}

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Hours <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="e.g., 2.5"
              min="0.25"
              max="24"
              step="0.25"
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
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Door knocking, phone banking..."
              maxLength={200}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !hours}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            {submitting ? "Logging..." : "Log Hours"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
