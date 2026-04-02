"use client";

import { useState, useEffect } from "react";
import { CALENDAR_COLORS } from "@/lib/design-tokens";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface CalendarSource {
  id: string;
  name: string;
  provider: string;
  feed_url: string;
  color: string;
  enabled: boolean;
  created_at: string;
}

const PROVIDER_OPTIONS = [
  { value: "ical", label: "iCal / ICS Feed", icon: "calendar_today" },
  { value: "google", label: "Google Calendar", icon: "event" },
  { value: "mobilize", label: "Mobilize", icon: "groups" },
];

export default function IntegrationsTab() {
  const [sources, setSources] = useState<CalendarSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [feedUrl, setFeedUrl] = useState("");
  const [provider, setProvider] = useState("ical");
  const [color, setColor] = useState<string>(CALENDAR_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSources();
  }, []);

  async function fetchSources() {
    try {
      const res = await fetch("/api/admin/calendars");
      const json = await res.json();
      if (json.sources) setSources(json.sources);
    } catch {
      // Failed
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!name.trim() || !feedUrl.trim()) {
      setError("Name and feed URL are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/calendars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), feedUrl: feedUrl.trim(), provider, color }),
      });
      if (res.ok) {
        setName("");
        setFeedUrl("");
        setProvider("ical");
        setColor(CALENDAR_COLORS[0]);
        setShowForm(false);
        await fetchSources();
      } else {
        const json = await res.json();
        setError(json.error || "Failed to add source");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string, enabled: boolean) {
    await fetch(`/api/admin/calendars/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled } : s))
    );
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/calendars/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSources((prev) => prev.filter((s) => s.id !== id));
    }
  }

  return (
    <div className="space-y-6">
      {/* Calendar Sources Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-text-primary">Calendar Sources</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Connect calendar feeds to show upcoming events in the dashboard.
              Supports any iCal/ICS feed (Google Calendar, Outlook, Apple Calendar, Mobilize, etc.)
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} size="sm">
            <span className="material-icons-two-tone text-[16px]">add</span>
            Add Calendar
          </Button>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4 space-y-3">
            {error && (
              <div className="px-3 py-2 text-xs text-red-700 bg-red-50 rounded-lg">{error}</div>
            )}

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Name</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Team Google Calendar"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Feed URL</label>
              <Input
                type="url"
                value={feedUrl}
                onChange={(e) => setFeedUrl(e.target.value)}
                placeholder="https://calendar.google.com/calendar/ical/...basic.ics"
                className="font-mono text-xs"
              />
              <p className="text-[10px] text-text-muted mt-1">
                Paste the public iCal/ICS feed URL from your calendar provider.
              </p>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-text-primary mb-1">Provider</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-black/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-purple"
                >
                  {PROVIDER_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">Color</label>
                <div className="flex gap-1.5">
                  {CALENDAR_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        color === c ? "border-text-primary scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button onClick={handleAdd} disabled={saving}>
                {saving ? "Adding..." : "Add Calendar"}
              </Button>
              <Button variant="ghost" onClick={() => { setShowForm(false); setError(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Sources list */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : sources.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <span className="material-icons-two-tone text-[40px] text-text-muted">
              calendar_today
            </span>
            <p className="text-sm text-text-muted mt-2">No calendar sources connected</p>
            <p className="text-xs text-text-muted mt-1">
              Add an iCal/ICS feed to show upcoming events in the dashboard
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sources.map((source) => (
              <div
                key={source.id}
                className="flex items-center gap-3 bg-white border border-black/5 rounded-xl px-4 py-3"
              >
                {/* Color dot */}
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: source.color }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">{source.name}</span>
                    <Badge variant="secondary" className="text-[10px] uppercase">
                      {source.provider}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-text-muted truncate mt-0.5">{source.feed_url}</p>
                </div>

                {/* Toggle */}
                <button
                  onClick={() => handleToggle(source.id, !source.enabled)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${
                    source.enabled ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      source.enabled ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>

                {/* Delete */}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDelete(source.id)}
                  className="hover:bg-red-50 text-text-muted hover:text-red-500"
                  title="Remove"
                >
                  <span className="material-icons-two-tone text-[18px]">delete_outline</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info about other integrations */}
      <div className="border-t border-black/5 pt-6">
        <h3 className="text-sm font-bold text-text-primary mb-2">Other Integrations</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-white border border-black/5 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <img src="/nb-icon.png" alt="" className="w-5 h-5" />
              <div>
                <span className="text-sm font-medium text-text-primary">NationBuilder</span>
                <p className="text-[10px] text-text-muted">Signup ingestion</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] bg-green-100 text-green-700 border-green-200">
              Connected
            </Badge>
          </div>
          <div className="flex items-center justify-between bg-white border border-black/5 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="material-icons-two-tone text-[20px] text-text-muted">hub</span>
              <div>
                <span className="text-sm font-medium text-text-primary">Action Network</span>
                <p className="text-[10px] text-text-muted">Coming soon</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-[10px]">
              Not Connected
            </Badge>
          </div>
          <div className="flex items-center justify-between bg-white border border-black/5 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="material-icons-two-tone text-[20px] text-text-muted">campaign</span>
              <div>
                <span className="text-sm font-medium text-text-primary">Mobilize</span>
                <p className="text-[10px] text-text-muted">Coming soon</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-[10px]">
              Not Connected
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
