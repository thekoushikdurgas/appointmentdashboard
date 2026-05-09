"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  PanelLeft,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { useRole } from "@/context/RoleContext";
import { cn } from "@/lib/utils";

function routeActive(href: string, pathname: string): boolean {
  if (href === ROUTES.DASHBOARD) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

const DOCK_LINKS: {
  href: string;
  label: string;
  icon: LucideIcon;
  tile: "home" | "contacts" | "campaigns" | "ai";
}[] = [
  {
    href: ROUTES.DASHBOARD,
    label: "Home",
    icon: LayoutDashboard,
    tile: "home",
  },
  { href: ROUTES.CONTACTS, label: "Contacts", icon: Users, tile: "contacts" },
  {
    href: ROUTES.CAMPAIGNS,
    label: "Campaigns",
    icon: Megaphone,
    tile: "campaigns",
  },
  { href: ROUTES.AI_CHAT, label: "AI Chat", icon: MessageSquare, tile: "ai" },
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
  const reduceMotion = useReducedMotion();
  const { isAdmin } = useRole();

  const dockLinks = useMemo(
    () =>
      DOCK_LINKS.filter(
        (l) => isAdmin || (l.tile !== "campaigns" && l.tile !== "ai"),
      ),
    [isAdmin],
  );

  if (!visible) return null;

  const navTransition = reduceMotion
    ? { duration: 0.22 }
    : { type: "spring" as const, stiffness: 360, damping: 28 };
  const tapWhile = reduceMotion ? undefined : { scale: 0.94 };

  return (
    <motion.nav
      className="c360-shell-bottom-nav"
      aria-label="Primary mobile navigation"
      initial={reduceMotion ? { y: 0, opacity: 1 } : { y: 28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={navTransition}
    >
      <div className="c360-shell-bottom-nav__dock">
        {dockLinks.map(({ href, label, icon: Icon, tile }) => {
          const active = routeActive(href, pathname);
          return (
            <motion.div
              key={href}
              className="c360-shell-bottom-nav__slot"
              whileTap={tapWhile}
            >
              <Link
                href={href}
                className={cn(
                  "c360-shell-bottom-nav__item",
                  active && "c360-shell-bottom-nav__item--active",
                )}
                aria-current={active ? "page" : undefined}
                title={label}
                onClick={() => onNavigate?.()}
              >
                <span
                  className={cn(
                    "c360-shell-bottom-nav__tile",
                    `c360-shell-bottom-nav__tile--${tile}`,
                  )}
                >
                  <span
                    className="c360-shell-bottom-nav__tile-gloss"
                    aria-hidden
                  />
                  <Icon
                    size={22}
                    className="c360-shell-bottom-nav__icon"
                    aria-hidden
                  />
                </span>
                {active ? (
                  <span className="c360-shell-bottom-nav__pip" aria-hidden />
                ) : null}
                <span className="c360-shell-bottom-nav__label">{label}</span>
              </Link>
            </motion.div>
          );
        })}
        <motion.div className="c360-shell-bottom-nav__slot" whileTap={tapWhile}>
          <button
            type="button"
            className={cn(
              "c360-shell-bottom-nav__item",
              mobileDrawerOpen && "c360-shell-bottom-nav__item--active",
            )}
            onClick={onToggleSidebarDrawer}
            title={mobileDrawerOpen ? "Close menu" : "Open menu"}
            aria-label={
              mobileDrawerOpen
                ? "Close navigation menu"
                : "Open navigation menu"
            }
          >
            <span
              className={cn(
                "c360-shell-bottom-nav__tile",
                "c360-shell-bottom-nav__tile--menu",
              )}
            >
              <span className="c360-shell-bottom-nav__tile-gloss" aria-hidden />
              <PanelLeft
                size={22}
                className="c360-shell-bottom-nav__icon"
                aria-hidden
              />
            </span>
            {mobileDrawerOpen ? (
              <span className="c360-shell-bottom-nav__pip" aria-hidden />
            ) : null}
            <span className="c360-shell-bottom-nav__label">Menu</span>
          </button>
        </motion.div>
      </div>
    </motion.nav>
  );
}
