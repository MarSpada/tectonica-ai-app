const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-pink-500",
  "bg-green-500",
  "bg-amber-500",
  "bg-purple-500",
  "bg-teal-500",
  "bg-red-500",
  "bg-indigo-500",
  "bg-orange-500",
  "bg-cyan-500",
];

export function getAvatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const ROLE_BADGE_STYLES: Record<string, { bg: string; text: string }> = {
  super_admin: { bg: "bg-red-100", text: "text-red-700" },
  group_admin: { bg: "bg-purple-100", text: "text-purple-700" },
  member: { bg: "bg-green-100", text: "text-green-700" },
  supporter: { bg: "bg-amber-100", text: "text-amber-700" },
};

export function getRoleBadgeStyle(role: string) {
  return ROLE_BADGE_STYLES[role] ?? { bg: "bg-gray-100", text: "text-gray-700" };
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  group_admin: "Group Admin",
  member: "Member",
  supporter: "Supporter",
};

export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role] || role.charAt(0).toUpperCase() + role.slice(1);
}
