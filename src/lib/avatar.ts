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
  admin: { bg: "bg-red-100", text: "text-red-700" },
  organizer: { bg: "bg-purple-100", text: "text-purple-700" },
  leader: { bg: "bg-blue-100", text: "text-blue-700" },
  member: { bg: "bg-green-100", text: "text-green-700" },
  supporter: { bg: "bg-amber-100", text: "text-amber-700" },
};

export function getRoleBadgeStyle(role: string) {
  return ROLE_BADGE_STYLES[role] ?? { bg: "bg-gray-100", text: "text-gray-700" };
}

export function getRoleLabel(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}
