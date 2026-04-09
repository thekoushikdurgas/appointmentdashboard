"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
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

function SubBranchPanel({
  branch,
  pathname,
  onPick,
}: {
  branch: NavBranch;
  pathname: string;
  onPick: () => void;
}) {
  return (
    <nav className="c360-sidebar-flyout__sub" aria-label={branch.label}>
      {branch.children.map((node, i) => {
        if (isNavBranch(node)) {
          return (
            <div
              key={`${branch.label}-sub-${i}`}
              className="c360-sidebar-flyout__sub-block"
            >
              <div className="c360-sidebar-flyout__sub-title">{node.label}</div>
              {node.children.map((c) =>
                isNavBranch(c) ? null : (
                  <Link
                    key={c.href}
                    href={c.href}
                    className={cn(
                      "c360-sidebar-flyout__link",
                      leafActive(c.href, pathname) &&
                        "c360-sidebar-flyout__link--active",
                    )}
                    onClick={onPick}
                  >
                    {c.label}
                  </Link>
                ),
              )}
            </div>
          );
        }
        return (
          <Link
            key={node.href}
            href={node.href}
            className={cn(
              "c360-sidebar-flyout__link",
              leafActive(node.href, pathname) &&
                "c360-sidebar-flyout__link--active",
            )}
            onClick={onPick}
          >
            {node.label}
          </Link>
        );
      })}
    </nav>
  );
}

function CollapsedBranchMenu({
  branch,
  iconFor,
  onPick,
  pathname,
}: {
  branch: NavBranch;
  iconFor: IconFn;
  onPick: () => void;
  pathname: string;
}) {
  const [sub, setSub] = useState<NavBranch | null>(null);
  const Icon = iconFor(branch.icon);
  const hasNested = branch.children.some(isNavBranch);
  const panelWidth = hasNested && sub ? 416 : 208;
  const branchActive = branchHasActive(branch, pathname);

  return (
    <Popover
      width={panelWidth}
      placement="right"
      panelClassName="c360-popover__panel--sidebar-flyout"
      trigger={
        <button
          type="button"
          className={cn(
            "c360-sidebar__item",
            "c360-sidebar__item--collapsed-icon",
            branchActive && "c360-sidebar__item--active",
          )}
          title={branch.label}
          aria-label={branch.label}
          aria-haspopup="menu"
        >
          {Icon && (
            <Icon size={20} className="c360-sidebar__item-icon" aria-hidden />
          )}
        </button>
      }
      content={
        <div className="c360-sidebar-flyout" onMouseLeave={() => setSub(null)}>
          <div className="c360-sidebar-flyout__primary" role="menu">
            {branch.children.map((node, i) => {
              if (isNavBranch(node)) {
                const open = sub === node;
                return (
                  <div
                    key={`${branch.label}-${i}`}
                    role="menuitem"
                    className={cn(
                      "c360-sidebar-flyout__row",
                      open && "c360-sidebar-flyout__row--open",
                      branchHasActive(node, pathname) &&
                        "c360-sidebar-flyout__row--active",
                    )}
                    onMouseEnter={() => setSub(node)}
                  >
                    <span>{node.label}</span>
                    <ChevronRight
                      size={14}
                      className="c360-sidebar-flyout__chev"
                      aria-hidden
                    />
                  </div>
                );
              }
              return (
                <Link
                  key={node.href}
                  href={node.href}
                  role="menuitem"
                  className={cn(
                    "c360-sidebar-flyout__link",
                    leafActive(node.href, pathname) &&
                      "c360-sidebar-flyout__link--active",
                  )}
                  onClick={onPick}
                  onMouseEnter={() => setSub(null)}
                >
                  {node.label}
                </Link>
              );
            })}
          </div>
          {sub ? (
            <SubBranchPanel branch={sub} pathname={pathname} onPick={onPick} />
          ) : null}
        </div>
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
                pathname={pathname}
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
