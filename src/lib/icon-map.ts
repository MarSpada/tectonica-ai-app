/**
 * Streamline icon map — maps semantic icon names to SVG file paths
 * in public/streamline-vectors-main/ultimate/regular/
 */

const ICON_BASE = '/streamline-vectors-main/ultimate/bold';

export const ICON_MAP = {
  // ── Navigation ──
  'group-coach': `${ICON_BASE}/users/single-neutral-monitor.svg`,
  'group-media': `${ICON_BASE}/images-photography/picture-stack-landscape.svg`,
  'members': `${ICON_BASE}/users/multiple-users-1.svg`,
  'admin': `${ICON_BASE}/interface-essential/lock-shield.svg`,
  'leaders-organizers': `${ICON_BASE}/users/multiple-actions-chat.svg`,

  // ── Bot Categories ──
  'cat-advisors': `${ICON_BASE}/work-office-companies/human-resources-rating-woman.svg`,
  'cat-create': `${ICON_BASE}/design/design-tool-magic-wand-1.svg`,
  'cat-tools': `${ICON_BASE}/interface-essential/tool-box.svg`,
  'cat-analyze': `${ICON_BASE}/interface-essential/graph-stats-circle.svg`,

  // ── Bots ──
  'bot-getting-started': `${ICON_BASE}/interface-essential/information-circle.svg`,
  'bot-local-strategy': `${ICON_BASE}/business-products/maze-strategy.svg`,
  'bot-recruitment-planning': `${ICON_BASE}/users/single-neutral-actions-check-1.svg`,
  'bot-action-planning': `${ICON_BASE}/work-office-companies/task-list-pin.svg`,
  'bot-events-planning': `${ICON_BASE}/interface-essential/calendar-edit-1.svg`,
  'bot-relationship-contact': `${ICON_BASE}/business-products/customer-relationship-management-lead-management-1.svg`,
  'bot-group-leadership': `${ICON_BASE}/users/single-neutral-monitor.svg`,
  'bot-group-fundraising': `${ICON_BASE}/money-payments-finance/money-bag-dollar.svg`,
  'bot-canvassing': `${ICON_BASE}/wayfinding/walking-1.svg`,
  'bot-graphics': `${ICON_BASE}/design/color-bucket-brush.svg`,
  'bot-written-content': `${ICON_BASE}/content/content-paper-edit.svg`,
  'bot-email': `${ICON_BASE}/emails/send-email-envelope.svg`,
  'bot-webpage': `${ICON_BASE}/programing-apps-websites/programming-apps-websites/coding-apps-website-browser-image.svg`,
  'bot-video': `${ICON_BASE}/video-movies-tv/video-edit-magic-wand.svg`,
  'bot-ad-placement': `${ICON_BASE}/business-products/shopping-broadcast-advertising-monitor-megaphone.svg`,
  'bot-social-media': `${ICON_BASE}/social-medias-rewards-rating/like-chat.svg`,
  'bot-tech-tools': `${ICON_BASE}/interface-essential/tool-box.svg`,
  'bot-targeted-advocacy': `${ICON_BASE}/interface-essential/megaphone.svg`,
  'bot-people-power': `${ICON_BASE}/work-office-companies/workflow-teamwork-fistbump-2.svg`,
  'bot-recruitment-progress': `${ICON_BASE}/business-products/performance-increase.svg`,
  'bot-email-performance': `${ICON_BASE}/business-products/analytics-graph-lines-2.svg`,
  'bot-networks': `${ICON_BASE}/internet-networks-servers/network-users.svg`,
  'bot-group-decision': `${ICON_BASE}/interface-essential/hierarchy-5-organize.svg`,
  'bot-welcome': `${ICON_BASE}/computers-devices-electronics/laptop-smiley-1.svg`,

  // ── Admin Navigation ──
  'nav-goals': `${ICON_BASE}/business-products/target-center-monitor.svg`,
  'nav-organization': `${ICON_BASE}/work-office-companies/office-building-tall-2.svg`,
  'nav-bots': `${ICON_BASE}/computers-devices-electronics/computer-chip-core.svg`,
  'nav-branding': `${ICON_BASE}/design/color-palette.svg`,

  // ── UI Actions ──
  'search': `${ICON_BASE}/interface-essential/search-circle-alternate.svg`,
  'settings': `${ICON_BASE}/interface-essential/cog.svg`,
  'notifications': `${ICON_BASE}/interface-essential/alert-bell-notification-2.svg`,
  'menu': `${ICON_BASE}/interface-essential/navigation-menu.svg`,
  'favorite': `${ICON_BASE}/interface-essential/tags-favorite.svg`,
  'send': `${ICON_BASE}/arrows-diagrams/arrow-button-right-1.svg`,
  'filter': `${ICON_BASE}/interface-essential/filter-1.svg`,
  'edit': `${ICON_BASE}/interface-essential/pencil-1.svg`,
  'delete': `${ICON_BASE}/interface-essential/bin-1.svg`,
  'add': `${ICON_BASE}/interface-essential/add-circle-bold.svg`,
  'close': `${ICON_BASE}/interface-essential/remove-bold.svg`,
  'back': `${ICON_BASE}/arrows-diagrams/arrow-thick-left-3.svg`,
  'upload': `${ICON_BASE}/internet-networks-servers/upload-circle.svg`,
  'download': `${ICON_BASE}/internet-networks-servers/download-bottom.svg`,
  'share': `${ICON_BASE}/interface-essential/share-2.svg`,
  'duplicate': `${ICON_BASE}/interface-essential/duplicate.svg`,
  'check': `${ICON_BASE}/interface-essential/check-square.svg`,
  'warning': `${ICON_BASE}/interface-essential/alert-octagon-1.svg`,
  'info': `${ICON_BASE}/interface-essential/information-circle.svg`,
  'lock': `${ICON_BASE}/interface-essential/lock-5.svg`,
  'user-profile': `${ICON_BASE}/users/single-neutral-circle.svg`,
  'change-role': `${ICON_BASE}/users/switch-account-1.svg`,
  'reassign-group': `${ICON_BASE}/users/network-users.svg`,
  'remove-member': `${ICON_BASE}/users/single-neutral-actions-remove.svg`,
  'log-hours': `${ICON_BASE}/interface-essential/time-clock-hand-1.svg`,
  'calendar': `${ICON_BASE}/interface-essential/calendar-3.svg`,
  'loading': `${ICON_BASE}/interface-essential/loading-circle.svg`,
  'drag-handle': `${ICON_BASE}/interface-essential/hand-drag.svg`,
  'view-grid': `${ICON_BASE}/interface-essential/layout-dashboard.svg`,
  'view-list': `${ICON_BASE}/interface-essential/layout-content.svg`,
  'view-org-chart': `${ICON_BASE}/interface-essential/hierarchy-5-organize.svg`,
  'expand': `${ICON_BASE}/interface-essential/expand-2.svg`,
  'refresh': `${ICON_BASE}/interface-essential/synchronize-refresh-arrow.svg`,

  // ── Dashboard Widgets ──
  'widget-signups': `${ICON_BASE}/users/single-neutral-actions-check-1.svg`,
  'widget-recruit': `${ICON_BASE}/work-office-companies/human-resources-search-employees.svg`,
  'widget-conversations': `${ICON_BASE}/messages-chat-smileys/messages-bubble-text.svg`,
  'widget-actions': `${ICON_BASE}/work-office-companies/task-list-approve.svg`,
  'widget-fundraising': `${ICON_BASE}/money-payments-finance/money-bag-dollar.svg`,
  'widget-recruitment-goal': `${ICON_BASE}/business-products/performance-increase.svg`,
  'widget-approval': `${ICON_BASE}/interface-essential/check-badge.svg`,
  'widget-connected-systems': `${ICON_BASE}/internet-networks-servers/connector-1.svg`,
  'widget-ai-models': `${ICON_BASE}/internet-networks-servers/server-star-1.svg`,
  'widget-hours': `${ICON_BASE}/interface-essential/time-clock-circle.svg`,
  'widget-events': `${ICON_BASE}/interface-essential/calendar-3.svg`,
  'widget-directory': `${ICON_BASE}/users/multiple-users-1.svg`,

  // ── Status ──
  'status-connected': `${ICON_BASE}/interface-essential/check-badge.svg`,
  'status-disconnected': `${ICON_BASE}/interface-essential/link-disconnected.svg`,
  'status-nationbuilder': `${ICON_BASE}/internet-networks-servers/network-pin.svg`,
  'status-calendar': `${ICON_BASE}/interface-essential/rss-feed.svg`,

  // ── File Types ──
  'file-image': `${ICON_BASE}/images-photography/picture-double-landscape.svg`,
  'file-video': `${ICON_BASE}/video-movies-tv/video-player-movie.svg`,
  'file-document': `${ICON_BASE}/files-folders/office-file-text.svg`,
  'file-pdf': `${ICON_BASE}/files-folders/common-file-text-add.svg`,

  // ── Additional (semantic matches for Material Icons not in original mapping) ──
  'microphone': `${ICON_BASE}/music-audio/microphone-1.svg`,
  'empty-members': `${ICON_BASE}/users/multiple-users-1.svg`,
  'chevron-right': `${ICON_BASE}/arrows-diagrams/arrow-right.svg`,
  'arrow-forward': `${ICON_BASE}/arrows-diagrams/arrow-right.svg`,
  'attachment': `${ICON_BASE}/interface-essential/attachment.svg`,
  'file-attachment': `${ICON_BASE}/interface-essential/attachment.svg`,
  'phone-call': `${ICON_BASE}/phones-mobile-devices/phone-circle.svg`,
  'email-action': `${ICON_BASE}/emails/envelope-letter.svg`,
  'check-circle': `${ICON_BASE}/interface-essential/check-badge.svg`,
  'history': `${ICON_BASE}/interface-essential/time-clock-circle.svg`,
  'empty-folder': `${ICON_BASE}/files-folders/folder-hold.svg`,
  'confirm': `${ICON_BASE}/interface-essential/check-square.svg`,
  'cancel': `${ICON_BASE}/interface-essential/remove-bold.svg`,
  'chat-bubble': `${ICON_BASE}/messages-chat-smileys/messages-bubble-text.svg`,
  'person-add': `${ICON_BASE}/work-office-companies/human-resources-search-employees.svg`,
  'minimize': `${ICON_BASE}/interface-essential/subtract-circle.svg`,
  'arrow-up': `${ICON_BASE}/arrows-diagrams/arrow-button-up.svg`,
  'arrow-down': `${ICON_BASE}/arrows-diagrams/arrow-down-2.svg`,
  'dash': `${ICON_BASE}/interface-essential/subtract-circle.svg`,
  'media': `${ICON_BASE}/images-photography/picture-stack-landscape.svg`,
  'expand-down': `${ICON_BASE}/arrows-diagrams/arrow-button-up.svg`,
  'link': `${ICON_BASE}/internet-networks-servers/network-browser.svg`,
  'trash': `${ICON_BASE}/interface-essential/bin-1.svg`,
  'location-pin': `${ICON_BASE}/maps-navigation/pin-2.svg`,
  'external-link': `${ICON_BASE}/business-products/launch-go.svg`,
  'bot-landing-page': `${ICON_BASE}/programing-apps-websites/programming-apps-websites/programming-browser-1.svg`,
} as const;

export type IconName = keyof typeof ICON_MAP;
