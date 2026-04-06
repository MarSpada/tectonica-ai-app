"use client";

import { useState, useEffect } from "react";
import { CALENDAR_COLORS } from "@/lib/design-tokens";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@/components/ui/icon";
import type { RunPodStatus } from "@/lib/types";

interface CalendarSource {
  id: string;
  name: string;
  provider: string;
  feed_url: string;
  color: string;
  enabled: boolean;
  created_at: string;
}

interface RunPodModel {
  id: string;
  name: string;
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

  // RunPod state
  const [rpEndpointUrl, setRpEndpointUrl] = useState("");
  const [rpBearerToken, setRpBearerToken] = useState("");
  const [rpStatus, setRpStatus] = useState<RunPodStatus>("not_configured");
  const [rpHasToken, setRpHasToken] = useState(false);
  const [rpModels, setRpModels] = useState<RunPodModel[]>([]);
  const [rpSaving, setRpSaving] = useState(false);
  const [rpError, setRpError] = useState("");
  const [rpLoading, setRpLoading] = useState(true);

  // Image API state
  const [imgEndpoint, setImgEndpoint] = useState("");
  const [imgBearerToken, setImgBearerToken] = useState("");
  const [imgConfigured, setImgConfigured] = useState(false);
  const [imgHasToken, setImgHasToken] = useState(false);
  const [imgCreditsAllocated, setImgCreditsAllocated] = useState(0);
  const [imgCreditsUsed, setImgCreditsUsed] = useState(0);
  const [imgSaving, setImgSaving] = useState(false);
  const [imgError, setImgError] = useState("");
  const [imgLoading, setImgLoading] = useState(true);
  const [imgWarningDismissed, setImgWarningDismissed] = useState(false);

  useEffect(() => {
    fetchSources();
    fetchRunPodConfig();
    fetchImageApiConfig();
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

  // RunPod functions
  async function fetchRunPodConfig() {
    try {
      const res = await fetch("/api/admin/integrations/runpod");
      if (!res.ok) return;
      const json = await res.json();
      if (json.endpointUrl) {
        setRpEndpointUrl(json.endpointUrl);
        setRpHasToken(true);
      }
      setRpStatus(json.status || "not_configured");
      if (json.status === "connected") {
        fetchRunPodModels();
      }
    } catch {
      // Failed to load
    } finally {
      setRpLoading(false);
    }
  }

  async function fetchRunPodModels() {
    try {
      const res = await fetch("/api/admin/integrations/runpod/models");
      if (!res.ok) return;
      const json = await res.json();
      if (json.models) setRpModels(json.models);
    } catch {
      // Failed
    }
  }

  async function handleSaveRunPod() {
    if (!rpEndpointUrl.trim()) {
      setRpError("Endpoint URL is required");
      return;
    }
    if (!rpHasToken && !rpBearerToken.trim()) {
      setRpError("Bearer token is required");
      return;
    }
    setRpSaving(true);
    setRpError("");
    try {
      const body: Record<string, string> = { endpointUrl: rpEndpointUrl.trim() };
      if (rpBearerToken.trim()) {
        body.bearerToken = rpBearerToken.trim();
      }
      const res = await fetch("/api/admin/integrations/runpod", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (res.ok) {
        setRpStatus(json.status || "error");
        setRpModels(json.models || []);
        setRpBearerToken("");
        setRpHasToken(true);
      } else {
        setRpError(json.error || "Failed to save");
        setRpStatus("error");
      }
    } catch {
      setRpError("Something went wrong");
    } finally {
      setRpSaving(false);
    }
  }

  // Image API functions
  async function fetchImageApiConfig() {
    try {
      const res = await fetch("/api/admin/integrations/image-api");
      if (!res.ok) return;
      const json = await res.json();
      if (json.endpoint) {
        setImgEndpoint(json.endpoint);
        setImgHasToken(true);
      }
      setImgConfigured(json.configured ?? false);
      setImgCreditsAllocated(json.creditsAllocated ?? 0);
      setImgCreditsUsed(json.creditsUsed ?? 0);
    } catch {
      // Failed to load
    } finally {
      setImgLoading(false);
    }
  }

  async function handleSaveImageApi() {
    if (!imgEndpoint.trim()) {
      setImgError("Endpoint URL is required");
      return;
    }
    if (!imgHasToken && !imgBearerToken.trim()) {
      setImgError("Bearer token is required");
      return;
    }
    setImgSaving(true);
    setImgError("");
    try {
      const body: Record<string, string> = { endpoint: imgEndpoint.trim() };
      if (imgBearerToken.trim()) {
        body.bearerToken = imgBearerToken.trim();
      }
      const res = await fetch("/api/admin/integrations/image-api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (res.ok) {
        setImgConfigured(true);
        setImgBearerToken("");
        setImgHasToken(true);
      } else {
        setImgError(json.error || "Failed to save");
      }
    } catch {
      setImgError("Something went wrong");
    } finally {
      setImgSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* AI Model Connection (RunPod) */}
      <div>
        <div className="mb-4">
          <h3 className="text-sm font-bold text-text-primary">AI Model Connection</h3>
          <p className="text-xs text-text-muted mt-0.5">
            Connect to your AI model provider (Open WebUI, RunPod, or any OpenAI-compatible endpoint). All bots will use models from this endpoint.
          </p>
        </div>

        {rpLoading ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : (
          <div className="bg-white border border-black/5 rounded-xl p-5 space-y-4">
            {rpError && (
              <div className="px-3 py-2 text-xs text-red-700 bg-red-50 rounded-lg">{rpError}</div>
            )}

            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  rpStatus === "connected"
                    ? "bg-green-500"
                    : rpStatus === "error"
                      ? "bg-red-500"
                      : "bg-gray-300"
                }`}
              />
              <span className="text-sm font-medium text-text-primary">
                {rpStatus === "connected"
                  ? `Connected — ${rpModels.length} model${rpModels.length !== 1 ? "s" : ""} available`
                  : rpStatus === "error"
                    ? "Connection failed — check your endpoint URL and token"
                    : "Not configured"}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Endpoint URL
              </label>
              <Input
                type="url"
                value={rpEndpointUrl}
                onChange={(e) => setRpEndpointUrl(e.target.value)}
                placeholder="https://api.runpod.ai/v2/your-endpoint-id"
                className="font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Bearer Token
              </label>
              <Input
                type="password"
                value={rpBearerToken}
                onChange={(e) => setRpBearerToken(e.target.value)}
                placeholder={rpHasToken ? "••••••••" : "Enter your RunPod API key"}
              />
              {rpHasToken && (
                <p className="text-[10px] text-text-muted mt-0.5">
                  Token is stored encrypted. Leave blank to keep the existing token.
                </p>
              )}
            </div>

            <Button onClick={handleSaveRunPod} disabled={rpSaving} size="sm">
              {rpSaving ? "Testing connection..." : "Save & Test Connection"}
            </Button>

            {/* Available models list */}
            {rpStatus === "connected" && rpModels.length > 0 && (
              <div className="border-t border-black/5 pt-3 mt-3">
                <p className="text-xs font-semibold text-text-primary mb-2">Available Models</p>
                <div className="space-y-1">
                  {rpModels.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-2 text-xs text-text-secondary bg-gray-50 rounded-lg px-3 py-1.5"
                    >
                      <Icon name="bot-welcome" size={14} className="opacity-40" />
                      <span className="font-mono">{m.id}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image Generation */}
      <div>
        <div className="mb-4">
          <h3 className="text-sm font-bold text-text-primary">Image Generation</h3>
          <p className="text-xs text-text-muted mt-0.5">
            Connect to the image generation API for the Graphics Creation bot. Powers AI image creation, editing, fusion, and branding.
          </p>
        </div>

        {imgLoading ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : (
          <div className="bg-white border border-black/5 rounded-xl p-5 space-y-4">
            {/* Token rotation warning */}
            {!imgWarningDismissed && (
              <div className="flex items-start gap-2 px-3 py-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg">
                <span className="mt-0.5 shrink-0">⚠️</span>
                <div className="flex-1">
                  The current bearer token must be rotated before production use. Contact the Tectonica team to issue a new token.
                </div>
                <button
                  onClick={() => setImgWarningDismissed(true)}
                  className="text-amber-600 hover:text-amber-800 shrink-0"
                >
                  <Icon name="close" size={14} />
                </button>
              </div>
            )}

            {imgError && (
              <div className="px-3 py-2 text-xs text-red-700 bg-red-50 rounded-lg">{imgError}</div>
            )}

            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  imgConfigured ? "bg-green-500" : "bg-gray-300"
                }`}
              />
              <span className="text-sm font-medium text-text-primary">
                {imgConfigured ? "Configured" : "Not configured"}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Endpoint URL
              </label>
              <Input
                type="url"
                value={imgEndpoint}
                onChange={(e) => setImgEndpoint(e.target.value)}
                placeholder="https://qwen-image-editor-production-49d4.up.railway.app"
                className="font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Bearer Token
              </label>
              <Input
                type="password"
                value={imgBearerToken}
                onChange={(e) => setImgBearerToken(e.target.value)}
                placeholder={imgHasToken ? "••••••••" : "Enter your image API token"}
              />
              {imgHasToken && (
                <p className="text-[10px] text-text-muted mt-0.5">
                  Token is stored encrypted. Leave blank to keep the existing token.
                </p>
              )}
            </div>

            <Button onClick={handleSaveImageApi} disabled={imgSaving} size="sm">
              {imgSaving ? "Saving..." : "Save Configuration"}
            </Button>

            {/* Credits display */}
            {imgConfigured && (
              <div className="border-t border-black/5 pt-3 mt-3">
                <p className="text-xs font-semibold text-text-primary mb-2">Image Credits</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-text-secondary">
                    <span>{imgCreditsUsed} used</span>
                    <span>{imgCreditsAllocated} allocated</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{
                        width: imgCreditsAllocated > 0
                          ? `${Math.min(100, (imgCreditsUsed / imgCreditsAllocated) * 100)}%`
                          : "0%",
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-text-muted">
                    To allocate additional credits, contact the Tectonica team.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

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
            <Icon name="add" size={16} />
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
            <Icon name="calendar" size={40} className="opacity-60" />
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
                  <Icon name="delete" size={18} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Sources */}
      <div className="border-t border-black/5 pt-6">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-text-primary">Action Sources</h3>
          <p className="text-xs text-text-muted mt-0.5">
            Connect external platforms to automatically import actions for your group members.
            Each source uses an adapter that converts external data into actions.
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-white border border-black/5 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <img src="/nb-icon.png" alt="" className="w-5 h-5" />
              <div>
                <span className="text-sm font-medium text-text-primary">NationBuilder Actions</span>
                <p className="text-[10px] text-text-muted">Import petitions, calls to action, and volunteer opportunities</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">Not Connected</Badge>
              <Button variant="outline" size="sm" disabled className="text-xs">Configure</Button>
            </div>
          </div>
          <div className="flex items-center justify-between bg-white border border-black/5 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Icon name="bot-networks" size={20} className="opacity-60" />
              <div>
                <span className="text-sm font-medium text-text-primary">Action Network</span>
                <p className="text-[10px] text-text-muted">Import petitions, events, fundraising pages, and advocacy campaigns</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">Not Connected</Badge>
              <Button variant="outline" size="sm" disabled className="text-xs">Configure</Button>
            </div>
          </div>
          <div className="flex items-center justify-between bg-white border border-black/5 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Icon name="bot-group-fundraising" size={20} className="opacity-60" />
              <div>
                <span className="text-sm font-medium text-text-primary">ActBlue</span>
                <p className="text-[10px] text-text-muted">Import donation drives and fundraising actions</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">Not Connected</Badge>
              <Button variant="outline" size="sm" disabled className="text-xs">Configure</Button>
            </div>
          </div>
          <div className="flex items-center justify-between bg-white border border-black/5 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Icon name="share" size={20} className="opacity-60" />
              <div>
                <span className="text-sm font-medium text-text-primary">Sosha</span>
                <p className="text-[10px] text-text-muted">Import social sharing campaigns and engagement actions</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">Not Connected</Badge>
              <Button variant="outline" size="sm" disabled className="text-xs">Configure</Button>
            </div>
          </div>
        </div>
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
              <Icon name="bot-networks" size={20} className="opacity-60" />
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
              <Icon name="bot-targeted-advocacy" size={20} className="opacity-60" />
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
