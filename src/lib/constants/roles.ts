import type { UserRole } from "@/lib/types";

export const ROLES = {
  SUPER_ADMIN: "super_admin" as UserRole,
  GROUP_ADMIN: "group_admin" as UserRole,
  MEMBER: "member" as UserRole,
  SUPPORTER: "supporter" as UserRole,
} as const;

export const VALID_ROLES: UserRole[] = [
  ROLES.SUPER_ADMIN,
  ROLES.GROUP_ADMIN,
  ROLES.MEMBER,
  ROLES.SUPPORTER,
];

/** Returns true if the role is super_admin or group_admin */
export function isAdminRole(role: string | undefined): boolean {
  return role === ROLES.SUPER_ADMIN || role === ROLES.GROUP_ADMIN;
}

/** Returns true if the role is super_admin */
export function isSuperAdmin(role: string | undefined): boolean {
  return role === ROLES.SUPER_ADMIN;
}
