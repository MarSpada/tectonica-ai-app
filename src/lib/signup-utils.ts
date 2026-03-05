export function formatSignupTime(dateStr: string): { text: string; urgent: boolean } {
  if (!dateStr) return { text: "Recently", urgent: false };
  const hours = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000);
  if (hours < 1) return { text: "Signed up just now", urgent: false };
  if (hours < 48) return { text: `Signed up ${hours} hrs. ago`, urgent: hours > 24 };
  const days = Math.floor(hours / 24);
  return { text: `Signed up ${days} days ago`, urgent: true };
}

export function isUrgent(createdAt: string): boolean {
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() > 24 * 3600000;
}
