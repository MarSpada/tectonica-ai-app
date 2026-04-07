/**
 * Org chart hierarchy builder.
 *
 * This is the ONLY file that knows about the hierarchy logic.
 * When a `recruited_by` FK is added to profiles in a future session,
 * only this function needs to change — not OrgChartView.tsx or MemberDirectory.tsx.
 */

import type { Member, OrgChartNode, OrgChartLink } from "@/lib/types";

const GROUP_CENTER_ID = "group-center";

/**
 * Build a nodes/links structure for the radial org chart.
 *
 * Option A (current): Role-based hierarchy.
 *   Center → admins → members → supporters
 *
 * Option B (future): Replace role-based parentId assignment below
 * with `member.recruited_by` when the FK is added to profiles.
 * The rest of the pipeline (OrgChartView, MemberDirectory) stays unchanged.
 */
export function buildOrgChartData(
  members: Member[],
  groupName: string
): { nodes: OrgChartNode[]; links: OrgChartLink[] } {
  const nodes: OrgChartNode[] = [];
  const links: OrgChartLink[] = [];

  // Center node: the group itself
  nodes.push({
    id: GROUP_CENTER_ID,
    name: groupName,
    role: "group",
    avatarUrl: null,
    parentId: null,
  });

  // Partition members by role
  const admins = members.filter(
    (m) => m.role === "super_admin" || m.role === "group_admin"
  );
  const regularMembers = members.filter((m) => m.role === "member");
  const supporters = members.filter((m) => m.role === "supporter");

  // ── FUTURE: Replace the parentId logic below with recruited_by FK ──
  // When `recruited_by` is available on each member, use:
  //   parentId: member.recruited_by ?? GROUP_CENTER_ID
  // and remove the role-based partitioning above.

  // Ring 1: Admins → parent is center
  for (const admin of admins) {
    nodes.push({
      id: admin.id,
      name: admin.full_name || "Unknown",
      role: admin.role,
      avatarUrl: admin.avatar_url,
      parentId: GROUP_CENTER_ID,
    });
    links.push({ source: GROUP_CENTER_ID, target: admin.id });
  }

  // Ring 2: Members → parent is first group_admin (or center if none)
  const memberParent = admins.length > 0 ? admins[0].id : GROUP_CENTER_ID;
  for (const member of regularMembers) {
    nodes.push({
      id: member.id,
      name: member.full_name || "Unknown",
      role: member.role,
      avatarUrl: member.avatar_url,
      parentId: memberParent,
    });
    links.push({ source: memberParent, target: member.id });
  }

  // Ring 3: Supporters → parent is first member (or center if none)
  const supporterParent =
    regularMembers.length > 0
      ? regularMembers[0].id
      : admins.length > 0
        ? admins[0].id
        : GROUP_CENTER_ID;
  for (const supporter of supporters) {
    nodes.push({
      id: supporter.id,
      name: supporter.full_name || "Unknown",
      role: supporter.role,
      avatarUrl: supporter.avatar_url,
      parentId: supporterParent,
    });
    links.push({ source: supporterParent, target: supporter.id });
  }

  return { nodes, links };
}

export { GROUP_CENTER_ID };
