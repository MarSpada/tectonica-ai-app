"use client";

import { useRef, useEffect, useCallback } from "react";
import * as d3 from "d3";
import type { OrgChartNode, OrgChartLink } from "@/lib/types";
import { GROUP_CENTER_ID } from "@/lib/org-chart-utils";
import { getInitials, AVATAR_HEX_COLORS } from "@/lib/avatar";

interface OrgChartViewProps {
  nodes: OrgChartNode[];
  links: OrgChartLink[];
  onMemberClick: (memberId: string) => void;
}

// Node radius by role
const NODE_RADIUS: Record<string, number> = {
  group: 40,
  super_admin: 28,
  group_admin: 28,
  member: 22,
  supporter: 18,
};

// Roles whose pills are always visible (not hover-only)
const ALWAYS_SHOW_PILL: Set<string> = new Set([
  "group",
  "super_admin",
  "group_admin",
]);

function getAvatarHexColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_HEX_COLORS[Math.abs(hash) % AVATAR_HEX_COLORS.length];
}

// Role color from CSS vars (read at render time)
function getRoleStrokeColor(role: string, rootEl: HTMLElement): string {
  const styles = getComputedStyle(rootEl);
  switch (role) {
    case "super_admin":
    case "group_admin":
      return styles.getPropertyValue("--sidebar-active").trim() || "#18181B";
    case "member":
      return styles.getPropertyValue("--widget-chart-members").trim() || "#422D8F";
    case "supporter":
      return styles.getPropertyValue("--widget-chart-supporters").trim() || "#159EC1";
    case "group":
      return styles.getPropertyValue("--border").trim() || "#e5e7eb";
    default:
      return "#888";
  }
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  group_admin: "Group Admin",
  member: "Member",
  supporter: "Supporter",
  group: "Group",
};

/** Truncate text to maxLen chars with ellipsis */
function truncateName(name: string, maxLen: number): string {
  return name.length > maxLen ? name.slice(0, maxLen - 1) + "\u2026" : name;
}

export default function OrgChartView({
  nodes,
  links,
  onMemberClick,
}: OrgChartViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const renderChart = useCallback(() => {
    const container = containerRef.current;
    const svgEl = svgRef.current;
    if (!container || !svgEl || nodes.length === 0) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const rootEl = document.documentElement;

    // Clear previous render
    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();

    svg.attr("viewBox", `${-width / 2} ${-height / 2} ${width} ${height}`);

    // Build hierarchy from nodes/links
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const rootNode = nodeMap.get(GROUP_CENTER_ID);
    if (!rootNode) return;

    interface HierarchyDatum {
      id: string;
      node: OrgChartNode;
      children: HierarchyDatum[];
    }

    function buildTree(parentId: string): HierarchyDatum {
      const parent = nodeMap.get(parentId)!;
      const childLinks = links.filter((l) => l.source === parentId);
      return {
        id: parentId,
        node: parent,
        children: childLinks.map((l) => buildTree(l.target)),
      };
    }

    const treeData = buildTree(GROUP_CENTER_ID);
    const root = d3.hierarchy(treeData);

    // Count nodes per depth to compute ring radii
    const depthCounts = new Map<number, number>();
    root.each((d) => {
      depthCounts.set(d.depth, (depthCounts.get(d.depth) || 0) + 1);
    });

    // Dynamic ring radius: wider rings when more nodes at that level
    const maxDepth = root.height;
    const minRadius = Math.min(width, height) * 0.12;
    const maxRadius = Math.min(width, height) * 0.42;

    const treeLayout = d3
      .tree<HierarchyDatum>()
      .size([2 * Math.PI, maxRadius])
      .separation((a, b) => {
        const depthCount = depthCounts.get(a.depth) || 1;
        const baseSep = a.parent === b.parent ? 1 : 2;
        return baseSep / Math.max(1, depthCount * 0.15);
      });

    treeLayout(root);

    // Recompute radial positions with dynamic ring radii
    root.each((d) => {
      if (d.depth === 0) {
        (d as d3.HierarchyPointNode<HierarchyDatum>).y = 0;
      } else {
        const nodesAtLevel = depthCounts.get(d.depth) || 1;
        const baseR = minRadius + (maxRadius - minRadius) * (d.depth / Math.max(maxDepth, 1));
        const crowdFactor = Math.max(1, nodesAtLevel / 8);
        (d as d3.HierarchyPointNode<HierarchyDatum>).y = Math.min(
          baseR * crowdFactor,
          maxRadius
        );
      }
    });

    const treeRoot = root as d3.HierarchyPointNode<HierarchyDatum>;

    // Zoom behavior
    const g = svg.append("g");
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    svg.call(zoom);

    // Links
    g.append("g")
      .attr("fill", "none")
      .attr("stroke", "var(--border, #e5e7eb)")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 1.5)
      .selectAll("path")
      .data(treeRoot.links())
      .join("path")
      .attr(
        "d",
        d3
          .linkRadial<
            d3.HierarchyPointLink<HierarchyDatum>,
            d3.HierarchyPointNode<HierarchyDatum>
          >()
          .angle((d) => d.x)
          .radius((d) => d.y)
      );

    // Node groups
    const nodeGroups = g
      .append("g")
      .selectAll("g")
      .data(treeRoot.descendants())
      .join("g")
      .attr(
        "transform",
        (d) => `translate(${d.y * Math.sin(d.x)},${-d.y * Math.cos(d.x)})`
      )
      .style("cursor", (d) =>
        d.data.node.id === GROUP_CENTER_ID ? "default" : "pointer"
      )
      .on("click", (_event, d) => {
        if (d.data.node.id !== GROUP_CENTER_ID) {
          onMemberClick(d.data.node.id);
        }
      });

    // Defs for clip paths
    const defs = svg.append("defs");

    treeRoot.descendants().forEach((d) => {
      const r = NODE_RADIUS[d.data.node.role] || 20;
      defs
        .append("clipPath")
        .attr("id", `clip-${d.data.id}`)
        .append("circle")
        .attr("r", r);
    });

    // Node circles (background fill)
    nodeGroups
      .append("circle")
      .attr("r", (d) => NODE_RADIUS[d.data.node.role] || 20)
      .attr("fill", (d) => {
        if (d.data.node.role === "group") return "#ffffff";
        if (d.data.node.avatarUrl) return "#ffffff";
        return getAvatarHexColor(d.data.id);
      })
      .attr("stroke", (d) => getRoleStrokeColor(d.data.node.role, rootEl))
      .attr("stroke-width", (d) => (d.data.node.role === "group" ? 3 : 2));

    // Avatar images (where available)
    nodeGroups
      .filter((d) => !!d.data.node.avatarUrl)
      .append("image")
      .attr("href", (d) => d.data.node.avatarUrl!)
      .attr("x", (d) => -(NODE_RADIUS[d.data.node.role] || 20))
      .attr("y", (d) => -(NODE_RADIUS[d.data.node.role] || 20))
      .attr("width", (d) => (NODE_RADIUS[d.data.node.role] || 20) * 2)
      .attr("height", (d) => (NODE_RADIUS[d.data.node.role] || 20) * 2)
      .attr("clip-path", (d) => `url(#clip-${d.data.id})`)
      .attr("preserveAspectRatio", "xMidYMid slice");

    // Initials text (where no avatar)
    nodeGroups
      .filter((d) => !d.data.node.avatarUrl)
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("fill", (d) => (d.data.node.role === "group" ? "#1a1a2e" : "#ffffff"))
      .attr("font-size", (d) => {
        const r = NODE_RADIUS[d.data.node.role] || 20;
        return `${Math.round(r * 0.7)}px`;
      })
      .attr("font-weight", 600)
      .attr("pointer-events", "none")
      .text((d) => getInitials(d.data.node.name));

    // ── Pill labels below nodes ──
    // Measure text widths using a temporary SVG text element
    const measureText = svg.append("text")
      .attr("font-size", "11px")
      .attr("font-weight", 500)
      .attr("visibility", "hidden");

    const pillGroups = nodeGroups.append("g").attr("class", "pill-label");

    pillGroups.each(function (d) {
      const pillG = d3.select(this);
      const role = d.data.node.role;
      const isAlwaysVisible = ALWAYS_SHOW_PILL.has(role);
      const nodeR = NODE_RADIUS[role] || 20;

      // Full name for pill (truncated at 20 chars)
      const displayName = truncateName(d.data.node.name, 20);

      // Measure text width
      measureText.text(displayName);
      const textWidth = (measureText.node() as SVGTextElement).getComputedTextLength();

      const paddingX = 8;
      const paddingY = 4;
      const pillW = textWidth + paddingX * 2;
      const pillH = 11 + paddingY * 2; // 11px font + vertical padding
      const pillY = nodeR + 8; // gap below circle
      const pillRadius = pillH / 2; // rounded-full

      // Pill background rect
      pillG
        .append("rect")
        .attr("x", -pillW / 2)
        .attr("y", pillY)
        .attr("width", pillW)
        .attr("height", pillH)
        .attr("rx", pillRadius)
        .attr("ry", pillRadius)
        .attr("fill", "var(--card-bg, #ffffff)")
        .attr("stroke", "var(--card-stroke, rgba(0,0,0,0.08))")
        .attr("stroke-width", 1);

      // Pill text
      pillG
        .append("text")
        .attr("x", 0)
        .attr("y", pillY + pillH / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("fill", "var(--text-primary, #1a1a2e)")
        .attr("font-size", "11px")
        .attr("font-weight", 500)
        .attr("pointer-events", "none")
        .text(displayName);

      // Visibility: hover-only for member/supporter
      if (!isAlwaysVisible) {
        pillG.attr("opacity", 0);
      }
    });

    // Clean up measurement element
    measureText.remove();

    // Hover: show pills for member/supporter nodes
    nodeGroups
      .on("mouseenter", function (event, d) {
        // Show pill on hover for all non-always-visible nodes
        if (!ALWAYS_SHOW_PILL.has(d.data.node.role)) {
          d3.select(this).select(".pill-label").attr("opacity", 1);
        }

        // Tooltip (skip for center node)
        if (d.data.node.id === GROUP_CENTER_ID) return;
        const roleLabel = ROLE_LABELS[d.data.node.role] || d.data.node.role;
        tooltip
          .html(
            `<strong style="color: var(--text-primary, #1a1a2e)">${d.data.node.name}</strong><br/><span style="color: var(--text-muted, #8a8aaa)">${roleLabel}</span>`
          )
          .style("opacity", 1);
      })
      .on("mousemove", function (event) {
        const rect = container.getBoundingClientRect();
        tooltip
          .style("left", `${event.clientX - rect.left + 12}px`)
          .style("top", `${event.clientY - rect.top - 10}px`);
      })
      .on("mouseleave", function (event, d) {
        // Hide pill for non-always-visible nodes
        if (!ALWAYS_SHOW_PILL.has(d.data.node.role)) {
          d3.select(this).select(".pill-label").attr("opacity", 0);
        }
        tooltip.style("opacity", 0);
      });

    // Tooltip
    const tooltip = d3
      .select(container)
      .append("div")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("background", "var(--card-bg, #fff)")
      .style("border", "1px solid var(--border, #e5e7eb)")
      .style("border-radius", "6px")
      .style("padding", "6px 10px")
      .style("font-size", "12px")
      .style("box-shadow", "0 2px 8px rgba(0,0,0,0.1)")
      .style("opacity", 0)
      .style("z-index", "10")
      .style("white-space", "nowrap");

    return () => {
      tooltip.remove();
    };
  }, [nodes, links, onMemberClick]);

  useEffect(() => {
    const cleanupTooltip = renderChart();

    const observer = new ResizeObserver(() => {
      renderChart();
    });
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
      if (cleanupTooltip) cleanupTooltip();
      if (svgRef.current) {
        d3.select(svgRef.current).selectAll("*").remove();
      }
    };
  }, [renderChart]);

  if (nodes.length <= 1) {
    return (
      <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-border bg-card">
        <p className="text-sm font-medium text-foreground mt-3">
          No members to display
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Add members to your group to see the org chart.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[400px]">
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ minHeight: 400 }}
      />
    </div>
  );
}
