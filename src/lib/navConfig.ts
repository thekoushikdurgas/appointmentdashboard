/**
 * Sidebar navigation tree — leaves have href; branches expand to show children.
 * Used by Sidebar (accordion), SidebarSearch (flattened index), and TopBar search.
 */
import { ROUTES } from "@/lib/routes";
import type { GatewayPageSummary } from "@/types/graphql-gateway";

export type NavLeaf = {
  href: string;
  label: string;
  icon: string;
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
  items: NavNode[];
}

export const SIDEBAR_SECTIONS: SidebarSectionConfig[] = [
  {
    label: null,
    items: [
      {
        label: "Overview",
        icon: "LayoutDashboard",
        children: [
          {
            href: ROUTES.DASHBOARD,
            label: "Dashboard",
            icon: "LayoutDashboard",
          },
          { href: ROUTES.ANALYTICS, label: "Analytics", icon: "BarChart2" },
          { href: ROUTES.ACTIVITIES, label: "Activities", icon: "Activity" },
        ],
      },
    ],
  },
  {
    label: "Database",
    items: [
      {
        label: "Data",
        icon: "Database",
        children: [
          { href: ROUTES.CONTACTS, label: "Contacts", icon: "Users" },
          { href: ROUTES.COMPANIES, label: "Companies", icon: "Building2" },
        ],
      },
    ],
  },
  {
    label: "Tools",
    items: [
      {
        label: "Tool",
        icon: "Tool",
        children: [
          { href: ROUTES.EMAIL, label: "Email", icon: "Mail" },
          { href: ROUTES.JOBS, label: "Jobs", icon: "Briefcase" },
          { href: ROUTES.FILES, label: "Files", icon: "FolderOpen" },
          { href: ROUTES.LINKEDIN, label: "LinkedIn", icon: "Linkedin" },
        ],
      },
    ],
  },
  {
    label: "Campaigns",
    items: [
      {
        label: "Campaigns",
        icon: "Megaphone",
        children: [
          { href: ROUTES.CAMPAIGNS, label: "All campaigns", icon: "Megaphone" },
          { href: ROUTES.CAMPAIGNS_NEW, label: "New campaign", icon: "Plus" },
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
    ],
  },
  {
    label: "AI",
    items: [
      {
        label: "AI",
        icon: "Brain",
        children: [
          { href: ROUTES.AI_CHAT, label: "AI Chat", icon: "MessageSquare" },
          { href: ROUTES.LIVE_VOICE, label: "Live Voice", icon: "Mic" },
          { href: ROUTES.RESUME, label: "Resume", icon: "FileText" },
        ],
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        label: "Account",
        icon: "User",
        children: [
          { href: ROUTES.BILLING, label: "Billing", icon: "CreditCard" },
          { href: ROUTES.USAGE, label: "Usage", icon: "PieChart" },
          { href: ROUTES.NOTIFICATIONS, label: "Notifications", icon: "Bell" },
          {
            href: ROUTES.SAVED_SEARCHES,
            label: "Saved Searches",
            icon: "Bookmark",
          },
          { href: ROUTES.STATUS, label: "Status", icon: "CheckCircle" },
        ],
      },
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

/** Resolve link for a DocsAI / gateway page (login + `pages.myPages` share this shape). */
export function hrefForGatewayPage(p: GatewayPageSummary): string {
  const r = p.route?.trim();
  if (r && r.startsWith("/")) return r;
  return `/dashboard/${encodeURIComponent(p.pageId)}`;
}

/** Insert a “My pages” section after the first sidebar block when the user has assigned pages. */
export function mergeAccessiblePagesIntoSidebarSections(
  base: SidebarSectionConfig[],
  pages: GatewayPageSummary[] | null | undefined,
): SidebarSectionConfig[] {
  const list = (pages ?? []).filter(
    (p) => p.status?.toLowerCase() !== "deleted",
  );
  if (list.length === 0) return base;
  const docsSection: SidebarSectionConfig = {
    label: "My pages",
    items: list.map((p) => ({
      href: hrefForGatewayPage(p),
      label: p.title,
      icon: "LayoutTemplate",
    })),
  };
  if (base.length === 0) return [docsSection];
  return [base[0], docsSection, ...base.slice(1)];
}

/** Command palette rows for authenticated user pages (same href rules as the sidebar). */
export function flatNavEntriesForAccessiblePages(
  pages: GatewayPageSummary[] | null | undefined,
): FlatNavEntry[] {
  return (pages ?? [])
    .filter((p) => p.status?.toLowerCase() !== "deleted")
    .map((p) => ({
      label: p.title,
      href: hrefForGatewayPage(p),
      section: "My pages",
    }));
}
