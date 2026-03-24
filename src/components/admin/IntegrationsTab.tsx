"use client";

import { useState, useEffect } from "react";

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

const COLOR_OPTIONS = [
  "#7C3AED", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#6366F1", "#14B8A6",
];

export default function IntegrationsTab() {
  const [sources, setSources] = useState<CalendarSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [feedUrl, setFeedUrl] = useState("");
  const [provider, setProvider] = useState("ical");
  const [color, setColor] = useState("#7C3AED");
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
        setColor("#7C3AED");
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
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-accent-purple rounded-lg hover:bg-purple-700 transition-colors"
          >
            <span className="material-icons-two-tone text-[16px]">add</span>
            Add Calendar
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4 space-y-3">
            {error && (
              <div className="px-3 py-2 text-xs text-red-700 bg-red-50 rounded-lg">{error}</div>
            )}

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Team Google Calendar"
                className="w-full px-3 py-2 text-sm border border-black/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-purple"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Feed URL</label>
              <input
                type="url"
                value={feedUrl}
                onChange={(e) => setFeedUrl(e.target.value)}
                placeholder="https://calendar.google.com/calendar/ical/...basic.ics"
                className="w-full px-3 py-2 text-sm border border-black/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-purple font-mono text-xs"
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
                  {COLOR_OPTIONS.map((c) => (
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
              <button
                onClick={handleAdd}
                disabled={saving}
                className="px-4 py-2 text-xs font-semibold text-white bg-accent-purple rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Adding..." : "Add Calendar"}
              </button>
              <button
                onClick={() => { setShowForm(false); setError(""); }}
                className="px-4 py-2 text-xs font-medium text-text-secondary hover:bg-black/5 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Sources list */}
        {loading ? (
          <p className="text-xs text-text-muted">Loading...</p>
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
                    <span className="text-[10px] font-medium px-1.5 py-0.5 bg-gray-100 rounded text-text-muted uppercase">
                      {source.provider}
                    </span>
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
                <button
                  onClick={() => handleDelete(source.id)}
                  className="p-1 rounded-lg hover:bg-red-50 text-text-muted hover:text-red-500 transition-colors"
                  title="Remove"
                >
                  <span className="material-icons-two-tone text-[18px]">delete_outline</span>
                </button>
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
            <span className="text-[10px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded">
              Connected
            </span>
          </div>
          <div className="flex items-center justify-between bg-white border border-black/5 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="material-icons-two-tone text-[20px] text-text-muted">hub</span>
              <div>
                <span className="text-sm font-medium text-text-primary">Action Network</span>
                <p className="text-[10px] text-text-muted">Coming soon</p>
              </div>
            </div>
            <span className="text-[10px] font-medium text-text-muted bg-gray-100 px-2 py-0.5 rounded">
              Not Connected
            </span>
          </div>
          <div className="flex items-center justify-between bg-white border border-black/5 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="material-icons-two-tone text-[20px] text-text-muted">campaign</span>
              <div>
                <span className="text-sm font-medium text-text-primary">Mobilize</span>
                <p className="text-[10px] text-text-muted">Coming soon</p>
              </div>
            </div>
            <span className="text-[10px] font-medium text-text-muted bg-gray-100 px-2 py-0.5 rounded">
              Not Connected
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
