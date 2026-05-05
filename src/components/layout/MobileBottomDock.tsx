"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  PanelLeft,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

function routeActive(href: string, pathname: string): boolean {
  if (href === ROUTES.DASHBOARD) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

const DOCK_LINKS: {
  href: string;
  label: string;
  icon: LucideIcon;
}[] = [
  { href: ROUTES.DASHBOARD, label: "Home", icon: LayoutDashboard },
  { href: ROUTES.CONTACTS, label: "Contacts", icon: Users },
  { href: ROUTES.CAMPAIGNS, label: "Campaigns", icon: Megaphone },
  { href: ROUTES.AI_CHAT, label: "AI Chat", icon: MessageSquare },
];

interface MobileBottomDockProps {
  visible: boolean;
  mobileDrawerOpen: boolean;
  onToggleSidebarDrawer: () => void;
  /** Close slide-over sidebar when jumping via dock links. */
  onNavigate?: () => void;
}

export function MobileBottomDock({
  visible,
  mobileDrawerOpen,
  onToggleSidebarDrawer,
  onNavigate,
}: MobileBottomDockProps) {
  const pathname = usePathname();

  if (!visible) return null;

  return (
    <motion.nav
      className="c360-shell-bottom-nav"
      aria-label="Primary mobile navigation"
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
    >
      <div className="c360-shell-bottom-nav__dock">
        {DOCK_LINKS.map(({ href, label, icon: Icon }) => {
          const active = routeActive(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "c360-shell-bottom-nav__item",
                active && "c360-shell-bottom-nav__item--active",
              )}
              aria-current={active ? "page" : undefined}
              title={label}
              onClick={() => onNavigate?.()}
            >
              <Icon size={22} className="c360-shell-bottom-nav__icon" aria-hidden />
              <span className="c360-shell-bottom-nav__label">{label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className={cn(
            "c360-shell-bottom-nav__item",
            "c360-shell-bottom-nav__item--menu",
            mobileDrawerOpen && "c360-shell-bottom-nav__item--active",
          )}
          onClick={onToggleSidebarDrawer}
          aria-expanded={mobileDrawerOpen}
          aria-controls="c360-app-sidebar"
          title={mobileDrawerOpen ? "Close menu" : "Open menu"}
        >
          <PanelLeft size={22} className="c360-shell-bottom-nav__icon" aria-hidden />
          <span className="c360-shell-bottom-nav__label">Menu</span>
        </button>
      </div>
    </motion.nav>
  );
}
