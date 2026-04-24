/**
 * Sidebar navigation tree — leaves have href; branches expand to show children.
 * Used by Sidebar (accordion), SidebarSearch (flattened index), and TopBar search.
 */
import { ROUTES } from "@/lib/routes";

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
          { href: ROUTES.PHONE, label: "Phone", icon: "Phone" },
          { href: ROUTES.JOBS, label: "Jobs", icon: "Briefcase" },
          { href: ROUTES.HIRING_SIGNALS, label: "Hiring signals", icon: "Zap" },
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
