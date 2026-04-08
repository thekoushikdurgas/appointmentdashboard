"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  isNavBranch,
  type NavBranch,
  type NavNode,
  type SidebarSectionConfig,
} from "@/lib/constants";
import { Popover } from "@/components/ui/Popover";
import { cn } from "@/lib/utils";

function leafActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function branchHasActive(branch: NavBranch, pathname: string): boolean {
  for (const c of branch.children) {
    if (isNavBranch(c)) {
      if (branchHasActive(c, pathname)) return true;
    } else if (leafActive(c.href, pathname)) return true;
  }
  return false;
}

function expandKeysForPathname(
  pathname: string,
  sections: SidebarSectionConfig[],
): Set<string> {
  const keys = new Set<string>();

  function walk(nodes: NavNode[], parts: string[]) {
    nodes.forEach((node, i) => {
      const key = [...parts, String(i)].join(":");
      if (isNavBranch(node)) {
        if (branchHasActive(node, pathname)) {
          keys.add(key);
          walk(node.children, [...parts, String(i)]);
        }
      }
    });
  }

  sections.forEach((section, si) => {
    walk(section.items, [String(si)]);
  });
  return keys;
}

type IconFn = (key: string) => LucideIcon | undefined;

function CollapsedBranchMenu({
  branch,
  iconFor,
  onPick,
}: {
  branch: NavBranch;
  iconFor: IconFn;
  onPick: () => void;
}) {
  const flattenLeaves = (
    nodes: NavNode[],
  ): { href: string; label: string }[] => {
    const out: { href: string; label: string }[] = [];
    for (const n of nodes) {
      if (isNavBranch(n)) out.push(...flattenLeaves(n.children));
      else out.push({ href: n.href, label: n.label });
    }
    return out;
  };

  const leaves = flattenLeaves(branch.children);
  const Icon = iconFor(branch.icon);

  return (
    <Popover
      width={220}
      placement="right"
      trigger={
        <button
          type="button"
          className="c360-sidebar__item c360-sidebar__item--collapsed-icon"
          title={branch.label}
          aria-label={branch.label}
        >
          {Icon && (
            <Icon size={20} className="c360-sidebar__item-icon" aria-hidden />
          )}
        </button>
      }
      content={
        <nav className="c360-popover-nav" aria-label={branch.label}>
          {leaves.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="c360-popover-nav__link"
              onClick={onPick}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      }
    />
  );
}

function NavNodesList({
  nodes,
  keyPrefix,
  collapsed,
  expanded,
  toggle,
  pathname,
  onMobileClose,
  iconFor,
  depth,
}: {
  nodes: NavNode[];
  keyPrefix: string[];
  collapsed: boolean;
  expanded: Set<string>;
  toggle: (key: string) => void;
  pathname: string;
  onMobileClose: () => void;
  iconFor: IconFn;
  depth: number;
}) {
  return (
    <>
      {nodes.map((node, i) => {
        const key = [...keyPrefix, String(i)].join(":");
        if (isNavBranch(node)) {
          if (collapsed) {
            return (
              <CollapsedBranchMenu
                key={key}
                branch={node}
                iconFor={iconFor}
                onPick={onMobileClose}
              />
            );
          }
          const Icon = iconFor(node.icon);
          const open = expanded.has(key);
          return (
            <div key={key} className="c360-sidebar__branch-wrap">
              <button
                type="button"
                className={cn(
                  "c360-sidebar__item",
                  "c360-sidebar__branch-toggle",
                  open && "c360-sidebar__branch-toggle--open",
                )}
                aria-expanded={open}
                onClick={() => toggle(key)}
              >
                {Icon && (
                  <Icon
                    size={20}
                    className="c360-sidebar__item-icon"
                    aria-hidden
                  />
                )}
                <span className="c360-sidebar__item-label">{node.label}</span>
                <ChevronDown
                  size={16}
                  className={cn(
                    "c360-sidebar__chev",
                    open && "c360-sidebar__chev--open",
                  )}
                  aria-hidden
                />
              </button>
              {open && (
                <div
                  className={cn(
                    "c360-sidebar__branch-children",
                    depth > 0 && "c360-sidebar__branch-children--nested",
                  )}
                >
                  <NavNodesList
                    nodes={node.children}
                    keyPrefix={[...keyPrefix, String(i)]}
                    collapsed={collapsed}
                    expanded={expanded}
                    toggle={toggle}
                    pathname={pathname}
                    onMobileClose={onMobileClose}
                    iconFor={iconFor}
                    depth={depth + 1}
                  />
                </div>
              )}
            </div>
          );
        }

        const Icon = iconFor(node.icon);
        const active = leafActive(node.href, pathname);
        if (collapsed) {
          return (
            <Link
              key={key}
              href={node.href}
              onClick={onMobileClose}
              className={cn(
                "c360-sidebar__item",
                "c360-sidebar__item--collapsed-icon",
                active && "c360-sidebar__item--active",
              )}
              title={node.label}
              aria-current={active ? "page" : undefined}
            >
              {Icon && (
                <Icon
                  size={20}
                  className="c360-sidebar__item-icon"
                  aria-hidden
                />
              )}
            </Link>
          );
        }

        return (
          <Link
            key={key}
            href={node.href}
            onClick={onMobileClose}
            className={cn(
              "c360-sidebar__item",
              active && "c360-sidebar__item--active",
            )}
            aria-current={active ? "page" : undefined}
          >
            {Icon && (
              <Icon size={20} className="c360-sidebar__item-icon" aria-hidden />
            )}
            <span className="c360-sidebar__item-label">{node.label}</span>
          </Link>
        );
      })}
    </>
  );
}

interface SidebarNavProps {
  collapsed: boolean;
  sections: SidebarSectionConfig[];
  onMobileClose: () => void;
  iconFor: IconFn;
}

export function SidebarNav({
  collapsed,
  sections,
  onMobileClose,
  iconFor,
}: SidebarNavProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    setExpanded(expandKeysForPathname(pathname, sections));
  }, [pathname, sections]);

  const toggle = useCallback((key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  return (
    <>
      {sections.map((section, si) => (
        <div key={si}>
          {section.label && (
            <div className="c360-sidebar__section-label">{section.label}</div>
          )}
          <NavNodesList
            nodes={section.items}
            keyPrefix={[String(si)]}
            collapsed={collapsed}
            expanded={expanded}
            toggle={toggle}
            pathname={pathname}
            onMobileClose={onMobileClose}
            iconFor={iconFor}
            depth={0}
          />
        </div>
      ))}
    </>
  );
}
