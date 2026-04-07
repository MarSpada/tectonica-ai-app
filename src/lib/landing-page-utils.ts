// Template is intentionally self-contained — no external JS dependencies.
// Pages must render correctly when served as static HTML files.
// Google Fonts is the only external CSS dependency (loaded when a custom font is selected).

export interface LandingPageBrief {
  headline: string;
  type: "signup" | "donate";
  cta_label: string;
  cta_url: string;
  key_messages: string[]; // 1-3 items
  urgency?: string;
  branding: {
    logo_url?: string | null;
    hero_image_url?: string | null;
    primary_color?: string | null;
    secondary_color?: string | null;
    social_facebook?: string | null;
    social_instagram?: string | null;
    social_twitter?: string | null;
    social_bluesky?: string | null;
    font_family?: string | null;
    form_embed_html?: string | null;
  };
}

const DEFAULT_PRIMARY = "#422D8F";
const DEFAULT_SECONDARY = "#159EC1";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Inline SVG social icons — only rendered when the corresponding URL is non-empty
const SOCIAL_ICONS: Record<string, string> = {
  facebook: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
  instagram: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>`,
  twitter: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  bluesky: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.785 2.627 3.6 3.502 6.204 3.172-4.363.63-5.796 2.614-3.265 5.527C6.648 22.322 10.108 20.274 12 16.5c1.892 3.774 5.352 5.822 8.437 2.446 2.531-2.913 1.098-4.897-3.265-5.527 2.604.33 5.419-.545 6.204-3.172.246-.828.624-5.788.624-6.479 0-.688-.139-1.86-.902-2.203-.659-.3-1.664-.621-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z"/></svg>`,
};

/**
 * Generates a complete, self-contained HTML string for a landing page.
 * Mobile responsive, no external dependencies.
 * All optional fields are truly conditional — omitted entirely when null/empty.
 */
export function renderLandingPage(brief: LandingPageBrief): string {
  const primary = brief.branding.primary_color || DEFAULT_PRIMARY;
  const secondary = brief.branding.secondary_color || DEFAULT_SECONDARY;
  const logoUrl = brief.branding.logo_url || null;
  const heroUrl = brief.branding.hero_image_url || null;
  const fontFamily = brief.branding.font_family?.trim() || null;
  const formEmbedHtml = brief.branding.form_embed_html?.trim() || null;
  const messages = brief.key_messages.filter((m) => m && m.trim().length > 0);

  // Build social links array — only include non-empty URLs
  const socialLinks: { platform: string; url: string; icon: string }[] = [];
  if (brief.branding.social_facebook?.trim()) {
    socialLinks.push({ platform: "Facebook", url: brief.branding.social_facebook.trim(), icon: SOCIAL_ICONS.facebook });
  }
  if (brief.branding.social_instagram?.trim()) {
    socialLinks.push({ platform: "Instagram", url: brief.branding.social_instagram.trim(), icon: SOCIAL_ICONS.instagram });
  }
  if (brief.branding.social_twitter?.trim()) {
    socialLinks.push({ platform: "Twitter", url: brief.branding.social_twitter.trim(), icon: SOCIAL_ICONS.twitter });
  }
  if (brief.branding.social_bluesky?.trim()) {
    socialLinks.push({ platform: "Bluesky", url: brief.branding.social_bluesky.trim(), icon: SOCIAL_ICONS.bluesky });
  }

  const logoHtml = logoUrl
    ? `<div class="logo"><img src="${escapeHtml(logoUrl)}" alt="Logo" /></div>`
    : "";

  const heroHtml = heroUrl
    ? `<div class="hero"><img src="${escapeHtml(heroUrl)}" alt="" /></div>`
    : "";

  const urgencyHtml = brief.urgency?.trim()
    ? `<div class="urgency">${escapeHtml(brief.urgency.trim())}</div>`
    : "";

  const messagesHtml = messages.length > 0
    ? `<ul class="messages">${messages.map((m) => `<li>${escapeHtml(m)}</li>`).join("")}</ul>`
    : "";

  const socialHtml = socialLinks.length > 0
    ? `<div class="social">${socialLinks.map((s) => `<a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(s.platform)}">${s.icon}</a>`).join("")}</div>`
    : "";

  const footerHtml = `<footer>${socialHtml}<p class="built-with">Built with <a href="https://www.tectonica.co" target="_blank" rel="noopener noreferrer">Tectonica.AI</a></p></footer>`;

  // Google Fonts import — only when a custom font is selected
  const fontImportHtml = fontFamily
    ? `<link href="https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, "+")}:wght@400;600;700&display=swap" rel="stylesheet">`
    : "";
  const fontCss = fontFamily
    ? `'${escapeHtml(fontFamily)}', `
    : "";

  // Form embed replaces CTA button when configured
  const ctaOrFormHtml = formEmbedHtml
    ? `<div class="form-embed">${formEmbedHtml}</div>`
    : `<a href="${escapeHtml(brief.cta_url)}" class="cta-button">${escapeHtml(brief.cta_label)}</a>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(brief.headline)}</title>
${fontImportHtml}<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --primary: ${primary};
    --secondary: ${secondary};
    --text: #1a1a2e;
    --text-muted: #4a4a6a;
    --bg: #ffffff;
    --surface: #f8f7ff;
  }
  body {
    font-family: ${fontCss}-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: var(--text);
    background: var(--bg);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  .page {
    max-width: 680px;
    margin: 0 auto;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  .logo {
    padding: 24px 24px 0;
    text-align: center;
  }
  .logo img {
    max-height: 60px;
    width: auto;
  }
  .hero img {
    width: 100%;
    height: auto;
    display: block;
  }
  .content {
    flex: 1;
    padding: 40px 24px;
    text-align: center;
  }
  h1 {
    font-size: clamp(1.75rem, 5vw, 2.5rem);
    font-weight: 800;
    color: var(--primary);
    margin-bottom: 24px;
    line-height: 1.2;
  }
  .messages {
    list-style: none;
    margin: 0 auto 32px;
    max-width: 520px;
    text-align: left;
  }
  .messages li {
    position: relative;
    padding: 12px 16px 12px 32px;
    margin-bottom: 12px;
    background: var(--surface);
    border-radius: 8px;
    font-size: 1.05rem;
    color: var(--text);
  }
  .messages li::before {
    content: "";
    position: absolute;
    left: 12px;
    top: 18px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--secondary);
  }
  .urgency {
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fcd34d;
    border-radius: 8px;
    padding: 14px 20px;
    margin: 0 auto 28px;
    max-width: 520px;
    font-weight: 600;
    font-size: 0.95rem;
  }
  .cta-button {
    display: inline-block;
    background: var(--primary);
    color: #ffffff;
    text-decoration: none;
    padding: 16px 48px;
    border-radius: 8px;
    font-size: 1.15rem;
    font-weight: 700;
    transition: opacity 0.2s;
  }
  .cta-button:hover { opacity: 0.9; }
  footer {
    border-top: 1px solid #e5e7eb;
    padding: 24px;
    text-align: center;
  }
  .social {
    display: flex;
    justify-content: center;
    gap: 20px;
  }
  .social a {
    color: var(--text-muted);
    transition: color 0.2s;
  }
  .social a:hover { color: var(--primary); }
  .built-with {
    margin-top: 16px;
    font-size: 0.75rem;
    color: var(--text-muted);
  }
  .built-with a {
    color: var(--text-muted);
    text-decoration: underline;
    transition: color 0.2s;
  }
  .built-with a:hover { color: var(--primary); }
  .form-embed {
    margin: 0 auto;
    max-width: 520px;
    text-align: left;
  }
  @media (max-width: 480px) {
    .content { padding: 28px 16px; }
    .messages li { font-size: 0.95rem; }
    .cta-button { padding: 14px 32px; font-size: 1.05rem; width: 100%; text-align: center; }
  }
</style>
</head>
<body>
<div class="page">
${logoHtml}${heroHtml}<div class="content">
<h1>${escapeHtml(brief.headline)}</h1>
${messagesHtml}${urgencyHtml}${ctaOrFormHtml}
</div>
${footerHtml}</div>
</body>
</html>`;
}
