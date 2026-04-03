import type { UserRole } from './types'

export const WIDGETS = [
  'signups',
  'recruit',
  'conversations',
  'actions',
  'fundraising',
  'recruitment_goal',
  'request_approval',
  'connected_systems',
  'hours_volunteered',
  'upcoming_events',
  'group_directory',
] as const

export type WidgetId = typeof WIDGETS[number]

export const WIDGET_LABELS: Record<WidgetId, string> = {
  signups:           'New Sign-Ups',
  recruit:           'Recruit More People',
  conversations:     'Group Conversations',
  actions:           'Group Actions',
  fundraising:       'Fundraising',
  recruitment_goal:  'Recruitment Goal',
  request_approval:  'Request Approval',
  connected_systems: 'Connected Systems',
  hours_volunteered: 'Hours Volunteered',
  upcoming_events:   'Upcoming Events',
  group_directory:   'Group Directory',
}

export const WIDGET_PERMISSIONS: Record<WidgetId,
  UserRole[]> = {
  signups:           ['super_admin', 'group_admin'],
  recruit:           ['super_admin', 'group_admin',
                      'member'],
  conversations:     ['super_admin', 'group_admin',
                      'member', 'supporter'],
  actions:           ['super_admin', 'group_admin',
                      'member', 'supporter'],
  fundraising:       ['super_admin', 'group_admin',
                      'member'],
  recruitment_goal:  ['super_admin', 'group_admin',
                      'member'],
  request_approval:  ['super_admin', 'group_admin',
                      'member'],
  connected_systems: ['super_admin', 'group_admin'],
  hours_volunteered: ['super_admin', 'group_admin',
                      'member', 'supporter'],
  upcoming_events:   ['super_admin', 'group_admin',
                      'member', 'supporter'],
  group_directory:   ['super_admin', 'group_admin',
                      'member', 'supporter'],
}

export const WIDGET_CONSTRAINTS: Record<WidgetId, {
  minW: number, maxW: number,
  minH: number, maxH: number
}> = {
  signups:           { minW: 6, maxW: 12,
                       minH: 2, maxH: 4  },
  recruit:           { minW: 2, maxW: 4,
                       minH: 2, maxH: 4  },
  conversations:     { minW: 4, maxW: 8,
                       minH: 3, maxH: 8  },
  actions:           { minW: 4, maxW: 8,
                       minH: 3, maxH: 8  },
  fundraising:       { minW: 3, maxW: 6,
                       minH: 4, maxH: 8  },
  recruitment_goal:  { minW: 3, maxW: 6,
                       minH: 3, maxH: 6  },
  request_approval:  { minW: 3, maxW: 6,
                       minH: 2, maxH: 4  },
  connected_systems: { minW: 3, maxW: 6,
                       minH: 3, maxH: 6  },
  hours_volunteered: { minW: 3, maxW: 6,
                       minH: 2, maxH: 4  },
  upcoming_events:   { minW: 3, maxW: 6,
                       minH: 3, maxH: 8  },
  group_directory:   { minW: 6, maxW: 12,
                       minH: 4, maxH: 10 },
}

export const SYSTEM_DEFAULT_LAYOUT = [
  { i: 'signups',          x: 0, y: 0,  w: 9, h: 2 },
  { i: 'recruit',          x: 9, y: 0,  w: 3, h: 2 },
  { i: 'conversations',    x: 0, y: 2,  w: 6, h: 4 },
  { i: 'actions',          x: 6, y: 2,  w: 6, h: 4 },
  { i: 'fundraising',      x: 0, y: 6,  w: 4, h: 6 },
  { i: 'recruitment_goal', x: 4, y: 6,  w: 4, h: 3 },
  { i: 'request_approval', x: 8, y: 6,  w: 4, h: 3 },
  { i: 'connected_systems',x: 8, y: 9,  w: 4, h: 4 },
  { i: 'hours_volunteered',x: 4, y: 9,  w: 4, h: 2 },
  { i: 'upcoming_events',  x: 8, y: 13, w: 4, h: 5 },
  { i: 'group_directory',  x: 0, y: 12, w: 8, h: 5 },
]

export function getVisibleWidgets(
  role: UserRole
): WidgetId[] {
  return WIDGETS.filter(id =>
    WIDGET_PERMISSIONS[id].includes(role))
}

export function filterLayoutToRole(
  layout: typeof SYSTEM_DEFAULT_LAYOUT,
  role: UserRole
): typeof SYSTEM_DEFAULT_LAYOUT {
  const visible = new Set(getVisibleWidgets(role))
  return layout.filter(item =>
    visible.has(item.i as WidgetId))
}

export function mergeLayoutWithDefaults(
  savedLayout: typeof SYSTEM_DEFAULT_LAYOUT,
  role: UserRole
): typeof SYSTEM_DEFAULT_LAYOUT {
  const visible = new Set(getVisibleWidgets(role))
  const savedIds = new Set(
    savedLayout.map(item => item.i))
  const base = savedLayout.filter(item =>
    visible.has(item.i as WidgetId))
  const missing = SYSTEM_DEFAULT_LAYOUT.filter(
    item => visible.has(item.i as WidgetId) &&
    !savedIds.has(item.i)
  )
  return [...base, ...missing]
}
