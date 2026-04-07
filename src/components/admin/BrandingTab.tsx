"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { UserRole, GroupBranding } from "@/lib/types";
import { isSuperAdmin } from "@/lib/constants/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface BrandingTabProps {
  role: UserRole;
  groupId: string | null;
  orgId: string | null;
}

export default function BrandingTab({ role, groupId, orgId }: BrandingTabProps) {
  const [branding, setBranding] = useState<GroupBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const canEdit = isSuperAdmin(role);

  // Colors edit state
  const [editingColors, setEditingColors] = useState(false);
  const [primaryInput, setPrimaryInput] = useState("");
  const [secondaryInput, setSecondaryInput] = useState("");
  const [savingColors, setSavingColors] = useState(false);

  // CTA URL edit state
  const [editingCta, setEditingCta] = useState(false);
  const [ctaInput, setCtaInput] = useState("");
  const [savingCta, setSavingCta] = useState(false);

  // Font edit state
  const [editingFont, setEditingFont] = useState(false);
  const [fontInput, setFontInput] = useState("");
  const [savingFont, setSavingFont] = useState(false);

  // Social media edit state
  const [editingSocial, setEditingSocial] = useState(false);
  const [facebookInput, setFacebookInput] = useState("");
  const [instagramInput, setInstagramInput] = useState("");
  const [twitterInput, setTwitterInput] = useState("");
  const [blueskyInput, setBlueskyInput] = useState("");
  const [savingSocial, setSavingSocial] = useState(false);

  // Form embed edit state
  const [editingFormEmbed, setEditingFormEmbed] = useState(false);
  const [formEmbedInput, setFormEmbedInput] = useState("");
  const [savingFormEmbed, setSavingFormEmbed] = useState(false);

  // Upload state
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  const fetchBranding = useCallback(async () => {
    if (!groupId) return;
    try {
      const res = await fetch("/api/admin/branding");
      const json = await res.json();
      if (json.branding) setBranding(json.branding);
    } catch {
      // Branding unavailable
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  async function handleUploadLogo(file: File) {
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await fetch("/api/admin/branding/logo", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (res.ok && json.branding) {
        setBranding(json.branding);
        toast.success("Logo uploaded");
      } else {
        toast.error(json.error || "Failed to upload logo");
      }
    } catch {
      toast.error("Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleUploadHero(file: File) {
    setUploadingHero(true);
    try {
      const formData = new FormData();
      formData.append("hero", file);
      const res = await fetch("/api/admin/branding/hero", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (res.ok && json.branding) {
        setBranding(json.branding);
        toast.success("Hero image uploaded");
      } else {
        toast.error(json.error || "Failed to upload hero image");
      }
    } catch {
      toast.error("Failed to upload hero image");
    } finally {
      setUploadingHero(false);
    }
  }

  async function handleSaveColors() {
    setSavingColors(true);
    try {
      const res = await fetch("/api/admin/branding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primary_color: primaryInput || null,
          secondary_color: secondaryInput || null,
        }),
      });
      const json = await res.json();
      if (res.ok && json.branding) {
        setBranding(json.branding);
        setEditingColors(false);
        toast.success("Brand colors saved");
      } else {
        toast.error(json.error || "Failed to save");
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setSavingColors(false);
    }
  }

  async function handleSaveFont() {
    setSavingFont(true);
    try {
      const res = await fetch("/api/admin/branding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          font_family: fontInput || null,
        }),
      });
      const json = await res.json();
      if (res.ok && json.branding) {
        setBranding(json.branding);
        setEditingFont(false);
        toast.success("Font saved");
      } else {
        toast.error(json.error || "Failed to save");
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setSavingFont(false);
    }
  }

  async function handleSaveCta() {
    setSavingCta(true);
    try {
      const res = await fetch("/api/admin/branding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          default_cta_url: ctaInput || null,
        }),
      });
      const json = await res.json();
      if (res.ok && json.branding) {
        setBranding(json.branding);
        setEditingCta(false);
        toast.success("Default CTA URL saved");
      } else {
        toast.error(json.error || "Failed to save");
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setSavingCta(false);
    }
  }

  async function handleSaveSocial() {
    setSavingSocial(true);
    try {
      const res = await fetch("/api/admin/branding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          social_facebook: facebookInput || null,
          social_instagram: instagramInput || null,
          social_twitter: twitterInput || null,
          social_bluesky: blueskyInput || null,
        }),
      });
      const json = await res.json();
      if (res.ok && json.branding) {
        setBranding(json.branding);
        setEditingSocial(false);
        toast.success("Social media links saved");
      } else {
        toast.error(json.error || "Failed to save");
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setSavingSocial(false);
    }
  }

  async function handleSaveFormEmbed() {
    setSavingFormEmbed(true);
    try {
      const res = await fetch("/api/admin/branding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form_embed_html: formEmbedInput || null,
        }),
      });
      const json = await res.json();
      if (res.ok && json.branding) {
        setBranding(json.branding);
        setEditingFormEmbed(false);
        toast.success("Form embed saved");
      } else {
        toast.error(json.error || "Failed to save");
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setSavingFormEmbed(false);
    }
  }

  async function handleClearFormEmbed() {
    if (!confirm("Remove the form embed? The CTA button will be used instead.")) return;
    setSavingFormEmbed(true);
    try {
      const res = await fetch("/api/admin/branding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form_embed_html: null }),
      });
      const json = await res.json();
      if (res.ok && json.branding) {
        setBranding(json.branding);
        toast.success("Form embed removed");
      } else {
        toast.error(json.error || "Failed to remove");
      }
    } catch {
      toast.error("Failed to remove");
    } finally {
      setSavingFormEmbed(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-8 max-w-3xl">
        <div className="bg-card-bg rounded-xl border border-card-stroke p-5 space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-20 w-40" />
        </div>
        <div className="bg-card-bg rounded-xl border border-card-stroke p-5 space-y-3">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Logo */}
      <section className="bg-card-bg rounded-xl border border-card-stroke p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary">Logo</h2>
        </div>
        {branding?.logo_url ? (
          <div className="mb-3">
            <img
              src={branding.logo_url}
              alt="Group logo"
              className="max-h-20 rounded object-contain"
            />
          </div>
        ) : (
          <p className="text-xs text-text-muted mb-3">No logo uploaded</p>
        )}
        {canEdit && (
          <>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadLogo(file);
                e.target.value = "";
              }}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={uploadingLogo}
              onClick={() => logoInputRef.current?.click()}
            >
              {uploadingLogo ? "Uploading..." : branding?.logo_url ? "Replace Logo" : "Upload Logo"}
            </Button>
          </>
        )}
      </section>

      {/* Hero Image */}
      <section className="bg-card-bg rounded-xl border border-card-stroke p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary">Hero Image</h2>
        </div>
        {branding?.hero_image_url ? (
          <div className="mb-3">
            <img
              src={branding.hero_image_url}
              alt="Hero image"
              className="max-h-30 w-full rounded object-cover"
            />
          </div>
        ) : (
          <p className="text-xs text-text-muted mb-3">No hero image uploaded</p>
        )}
        {canEdit && (
          <>
            <input
              ref={heroInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadHero(file);
                e.target.value = "";
              }}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={uploadingHero}
              onClick={() => heroInputRef.current?.click()}
            >
              {uploadingHero ? "Uploading..." : branding?.hero_image_url ? "Replace Hero Image" : "Upload Hero Image"}
            </Button>
          </>
        )}
      </section>

      {/* Colors */}
      <section className="bg-card-bg rounded-xl border border-card-stroke p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary">Brand Colors</h2>
          {canEdit && !editingColors && (
            <Button
              variant="link"
              onClick={() => {
                setPrimaryInput(branding?.primary_color || "");
                setSecondaryInput(branding?.secondary_color || "");
                setEditingColors(true);
              }}
            >
              Edit
            </Button>
          )}
        </div>

        {editingColors ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-text-muted mb-1 block">
                Primary Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryInput || "#422D8F"}
                  onChange={(e) => setPrimaryInput(e.target.value)}
                  className="h-9 w-12 rounded border border-black/10 cursor-pointer"
                />
                <Input
                  type="text"
                  placeholder="#422D8F"
                  value={primaryInput}
                  onChange={(e) => setPrimaryInput(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setEditingColors(false);
                  }}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-text-muted mb-1 block">
                Secondary Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={secondaryInput || "#159EC1"}
                  onChange={(e) => setSecondaryInput(e.target.value)}
                  className="h-9 w-12 rounded border border-black/10 cursor-pointer"
                />
                <Input
                  type="text"
                  placeholder="#159EC1"
                  value={secondaryInput}
                  onChange={(e) => setSecondaryInput(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleSaveColors} disabled={savingColors}>
                {savingColors ? "Saving..." : "Save"}
              </Button>
              <Button variant="ghost" onClick={() => setEditingColors(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-black/[0.02] border border-black/5">
              <span className="text-xs text-text-muted">Primary Color</span>
              <div className="flex items-center gap-2">
                {branding?.primary_color && (
                  <span
                    className="inline-block w-4 h-4 rounded-full border border-black/10"
                    style={{ backgroundColor: branding.primary_color }}
                  />
                )}
                <span className="text-sm font-medium text-text-primary">
                  {branding?.primary_color || "Not set"}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-black/[0.02] border border-black/5">
              <span className="text-xs text-text-muted">Secondary Color</span>
              <div className="flex items-center gap-2">
                {branding?.secondary_color && (
                  <span
                    className="inline-block w-4 h-4 rounded-full border border-black/10"
                    style={{ backgroundColor: branding.secondary_color }}
                  />
                )}
                <span className="text-sm font-medium text-text-primary">
                  {branding?.secondary_color || "Not set"}
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Font */}
      <section className="bg-card-bg rounded-xl border border-card-stroke p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary">Font</h2>
          {canEdit && !editingFont && (
            <Button
              variant="link"
              onClick={() => {
                setFontInput(branding?.font_family || "");
                setEditingFont(true);
              }}
            >
              Edit
            </Button>
          )}
        </div>

        {editingFont ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-text-muted mb-1 block">
                Font Family
              </label>
              <select
                value={fontInput}
                onChange={(e) => setFontInput(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Default (system font)</option>
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Lato">Lato</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Oswald">Oswald</option>
                <option value="Raleway">Raleway</option>
                <option value="Source Sans Pro">Source Sans Pro</option>
                <option value="Playfair Display">Playfair Display</option>
              </select>
              <p className="text-xs text-text-muted mt-1">
                This font will be applied to all generated landing pages.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleSaveFont} disabled={savingFont}>
                {savingFont ? "Saving..." : "Save"}
              </Button>
              <Button variant="ghost" onClick={() => setEditingFont(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-black/[0.02] border border-black/5">
              <span className="text-xs text-text-muted">Font Family</span>
              <span
                className="text-sm font-medium text-text-primary"
                style={branding?.font_family ? { fontFamily: branding.font_family } : undefined}
              >
                {branding?.font_family || "Default font"}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Default CTA URL */}
      <section className="bg-card-bg rounded-xl border border-card-stroke p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary">Default CTA URL</h2>
          {canEdit && !editingCta && (
            <Button
              variant="link"
              onClick={() => {
                setCtaInput(branding?.default_cta_url || "");
                setEditingCta(true);
              }}
            >
              Edit
            </Button>
          )}
        </div>

        {editingCta ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-text-muted mb-1 block">
                URL
              </label>
              <Input
                type="url"
                placeholder="https://example.com/signup"
                value={ctaInput}
                onChange={(e) => setCtaInput(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Escape") setEditingCta(false);
                }}
              />
              <p className="text-xs text-text-muted mt-1">
                This URL will be used as the default button link on generated landing pages.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleSaveCta} disabled={savingCta}>
                {savingCta ? "Saving..." : "Save"}
              </Button>
              <Button variant="ghost" onClick={() => setEditingCta(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-black/[0.02] border border-black/5">
              <span className="text-xs text-text-muted">URL</span>
              <span className="text-sm font-medium text-text-primary truncate max-w-[60%] text-right">
                {branding?.default_cta_url || "Not set"}
              </span>
            </div>
            <p className="text-xs text-text-muted">
              This URL will be used as the default button link on generated landing pages.
            </p>
          </div>
        )}
      </section>

      {/* Social Media */}
      <section className="bg-card-bg rounded-xl border border-card-stroke p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary">Social Media</h2>
          {canEdit && !editingSocial && (
            <Button
              variant="link"
              onClick={() => {
                setFacebookInput(branding?.social_facebook || "");
                setInstagramInput(branding?.social_instagram || "");
                setTwitterInput(branding?.social_twitter || "");
                setBlueskyInput(branding?.social_bluesky || "");
                setEditingSocial(true);
              }}
            >
              Edit
            </Button>
          )}
        </div>

        <p className="text-xs text-text-muted mb-3">
          Only filled-in links will appear on generated landing pages.
        </p>

        {editingSocial ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-text-muted mb-1 block">
                Facebook
              </label>
              <Input
                type="url"
                placeholder="https://facebook.com/yourpage"
                value={facebookInput}
                onChange={(e) => setFacebookInput(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Escape") setEditingSocial(false);
                }}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-muted mb-1 block">
                Instagram
              </label>
              <Input
                type="url"
                placeholder="https://instagram.com/yourpage"
                value={instagramInput}
                onChange={(e) => setInstagramInput(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-muted mb-1 block">
                Twitter / X
              </label>
              <Input
                type="url"
                placeholder="https://x.com/yourhandle"
                value={twitterInput}
                onChange={(e) => setTwitterInput(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-muted mb-1 block">
                Bluesky
              </label>
              <Input
                type="url"
                placeholder="https://bsky.app/profile/yourhandle"
                value={blueskyInput}
                onChange={(e) => setBlueskyInput(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleSaveSocial} disabled={savingSocial}>
                {savingSocial ? "Saving..." : "Save"}
              </Button>
              <Button variant="ghost" onClick={() => setEditingSocial(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {[
              { label: "Facebook", value: branding?.social_facebook },
              { label: "Instagram", value: branding?.social_instagram },
              { label: "Twitter / X", value: branding?.social_twitter },
              { label: "Bluesky", value: branding?.social_bluesky },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-black/[0.02] border border-black/5"
              >
                <span className="text-xs text-text-muted">{label}</span>
                <span className="text-sm font-medium text-text-primary truncate max-w-[60%] text-right">
                  {value || "Not set"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Form Embed */}
      <section className="bg-card-bg rounded-xl border border-card-stroke p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary">Form Embed</h2>
          {canEdit && !editingFormEmbed && (
            <div className="flex items-center gap-2">
              {branding?.form_embed_html && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-text-muted hover:text-red-600"
                  disabled={savingFormEmbed}
                  onClick={handleClearFormEmbed}
                >
                  Clear
                </Button>
              )}
              <Button
                variant="link"
                onClick={() => {
                  setFormEmbedInput(branding?.form_embed_html || "");
                  setEditingFormEmbed(true);
                }}
              >
                Edit
              </Button>
            </div>
          )}
        </div>

        {editingFormEmbed ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-text-muted mb-1 block">
                Embed Code
              </label>
              <textarea
                value={formEmbedInput}
                onChange={(e) => setFormEmbedInput(e.target.value)}
                rows={6}
                className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
                placeholder='<script charset="utf-8" type="text/javascript" src="//js.hsforms.net/forms/embed/v2.js"></script>...'
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Escape") setEditingFormEmbed(false);
                }}
              />
              <p className="text-xs text-text-muted mt-1">
                Paste your HubSpot, Typeform, or other form embed code here. When set, this replaces the CTA button on generated landing pages.
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Only paste embed code from trusted sources. This HTML will be injected directly into your landing pages.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleSaveFormEmbed} disabled={savingFormEmbed}>
                {savingFormEmbed ? "Saving..." : "Save"}
              </Button>
              <Button variant="ghost" onClick={() => setEditingFormEmbed(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-black/[0.02] border border-black/5">
              <span className="text-xs text-text-muted">Embed Code</span>
              <span className="text-sm font-medium text-text-primary truncate max-w-[60%] text-right font-mono">
                {branding?.form_embed_html
                  ? branding.form_embed_html.length > 80
                    ? branding.form_embed_html.slice(0, 80) + "..."
                    : branding.form_embed_html
                  : "No form embed configured"}
              </span>
            </div>
            <p className="text-xs text-text-muted">
              Paste your HubSpot, Typeform, or other form embed code here. When set, this replaces the CTA button on generated landing pages.
            </p>
          </div>
        )}
      </section>

      {/* Last updated info */}
      {branding?.updated_at && (
        <p className="text-xs text-text-muted">
          Last updated: {new Date(branding.updated_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      )}
    </div>
  );
}
