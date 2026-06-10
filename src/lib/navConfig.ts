/**
 * Sidebar navigation — flat section groups (21st.dev–style list with separators).
 * Leaves only at top level per section; branches reserved for future nested IA.
 */
import { ROUTES } from "@/lib/routes";

import type { BadgeColor } from "@/components/ui/Badge";

export type NavLeaf = {
  href: string;
  label: string;
  icon: string;
  badge?: string;
  badgeColor?: BadgeColor;
};

export type NavBranch = {
  label: string;
  icon: string;
  children: NavNode[];
};

export type NavNode = NavLeaf | NavBranch;

export function isNavBranch(node: NavNode): node is NavBranch {
  return "children" in node;
}

export interface SidebarSectionConfig {
  label: string | null;
  /** When true, entire section omitted unless user is super-admin. */
  requiresSuperAdmin?: boolean;
  /** When true, entire section omitted unless user is admin or super-admin. */
  requiresAdmin?: boolean;
  items: NavNode[];
}

export const SIDEBAR_SECTIONS: SidebarSectionConfig[] = [
  {
    label: null,
    items: [
      {
        href: ROUTES.DASHBOARD,
        label: "Dashboard",
        icon: "LayoutDashboard",
      },
      { href: ROUTES.ACTIVITIES, label: "Activities", icon: "Activity" },
    ],
  },
  {
    label: "Database",
    items: [
      { href: ROUTES.CONTACTS, label: "Contacts", icon: "Users" },
      { href: ROUTES.COMPANIES, label: "Companies", icon: "Building2" },
      {
        href: ROUTES.HIRING_SIGNALS,
        label: "Hiring Signals",
        icon: "Zap",
      },
      {
        href: ROUTES.DEMANDS_AND_TRENDS,
        label: "Demands & Trends",
        icon: "TrendingUp",
      },
      {
        href: ROUTES.MARKET_INSIGHTS,
        label: "Market Insights",
        icon: "BarChart2",
      },
    ],
  },
  {
    label: "Tools",
    requiresAdmin: true,
    items: [
      { href: ROUTES.EMAIL, label: "Email", icon: "Mail" },
      { href: ROUTES.PHONE, label: "Phone", icon: "Phone" },
      { href: ROUTES.LINKEDIN, label: "LinkedIn", icon: "Linkedin" },
    ],
  },
  {
    label: "Campaigns",
    requiresAdmin: true,
    items: [
      { href: ROUTES.CAMPAIGNS, label: "All Campaigns", icon: "Megaphone" },
      { href: ROUTES.CAMPAIGNS_NEW, label: "New Campaign", icon: "Plus" },
      {
        href: ROUTES.CAMPAIGNS_TEMPLATES,
        label: "Templates",
        icon: "LayoutTemplate",
      },
      {
        href: ROUTES.CAMPAIGNS_SEQUENCES,
        label: "Sequences",
        icon: "ListOrdered",
      },
    ],
  },
  {
    label: "AI",
    requiresAdmin: true,
    items: [
      {
        href: ROUTES.AI_CHAT,
        label: "AI Chat",
        icon: "MessageSquare",
        badge: "Beta",
        badgeColor: "info",
      },
      { href: ROUTES.RESUME, label: "Resume", icon: "FileText" },
    ],
  },
];

export interface FlatNavEntry {
  label: string;
  href: string;
  section?: string;
}

/** Depth-first flatten of all leaf routes for command palette / search. */
export function flattenNavLeaves(
  sections: SidebarSectionConfig[],
): FlatNavEntry[] {
  const results: FlatNavEntry[] = [];

  function walk(sectionLabel: string | null, nodes: NavNode[]): void {
    for (const node of nodes) {
      if (isNavBranch(node)) {
        walk(sectionLabel, node.children);
      } else {
        results.push({
          label: node.label,
          href: node.href,
          section: sectionLabel ?? undefined,
        });
      }
    }
  }

  for (const section of sections) {
    walk(section.label, section.items);
  }
  return results;
}

export const NAV_SEARCH_INDEX: FlatNavEntry[] =
  flattenNavLeaves(SIDEBAR_SECTIONS);
