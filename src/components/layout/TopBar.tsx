"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, Sun, Moon, Bell, User, Settings, LogOut } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/lib/constants";
import { Popover } from "@/components/ui/Popover";
import { TopBarCredits } from "./TopBarCredits";
import { cn } from "@/lib/utils";

const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  analytics: "Analytics",
  contacts: "Contacts",
  companies: "Companies",
  email: "Email Finder",
  jobs: "Jobs",
  files: "Files",
  linkedin: "LinkedIn",
  activities: "Activities",
  "ai-chat": "AI Chat",
  "live-voice": "Live Voice",
  billing: "Billing",
  usage: "Usage",
  profile: "Profile",
  settings: "Settings",
  status: "Status",
  admin: "Admin",
  campaigns: "Campaigns",
  new: "New",
  templates: "Templates",
  sequences: "Sequences",
  deployments: "Deployments",
};

interface TopBarProps {
  collapsed: boolean;
  onMenuToggle: () => void;
  menuButtonAriaLabel: string;
  /** Close mobile sidebar when using account actions (parity with former sidebar profile links). */
  onAccountNavigate?: () => void;
}

export default function TopBar({
  collapsed,
  onMenuToggle,
  menuButtonAriaLabel,
  onAccountNavigate,
}: TopBarProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => ({
    label: BREADCRUMB_LABELS[seg] || seg,
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  const firstName =
    user?.full_name?.split(/\s+/)[0] || user?.email?.split("@")[0] || "there";

  const initials = (user?.full_name || user?.email || "U")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <header
      className={cn("c360-topbar", collapsed && "c360-topbar--collapsed")}
    >
      <div className="c360-topbar__left">
        <button
          type="button"
          onClick={onMenuToggle}
          className="c360-btn c360-btn--ghost c360-btn--icon"
          aria-label={menuButtonAriaLabel}
        >
          <Menu size={20} />
        </button>

        <nav
          className="c360-topbar__breadcrumb c360-topbar__breadcrumb--secondary"
          aria-label="Breadcrumb"
        >
          <Link href="/dashboard" className="c360-topbar__breadcrumb-home">
            Home
          </Link>
          {breadcrumbs.map((crumb) => (
            <span key={crumb.href} className="c360-topbar__breadcrumb-seg">
              <span className="c360-topbar__breadcrumb-sep" aria-hidden>
                /
              </span>
              {crumb.isLast ? (
                <span className="c360-topbar__breadcrumb-item c360-topbar__breadcrumb-item--active">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="c360-topbar__breadcrumb-item"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      </div>

      <div className="c360-topbar__right">
        <button
          type="button"
          onClick={toggleTheme}
          className="c360-btn c360-btn--ghost c360-btn--icon c360-topbar__icon-btn"
          title={
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <Link
          href={ROUTES.NOTIFICATIONS}
          className="c360-btn c360-btn--ghost c360-btn--icon c360-topbar__icon-btn"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </Link>

        {user && (
          <Popover
            key={pathname}
            width={280}
            align="end"
            trigger={
              <button
                type="button"
                className="c360-topbar__profile-trigger"
                aria-label="Account menu"
              >
                <span className="c360-topbar__profile-greeting">
                  Hello, <strong>{firstName}</strong>
                </span>
                <span className="c360-topbar__profile-avatar" aria-hidden>
                  {initials}
                </span>
              </button>
            }
            content={
              <div className="c360-sidebar__user-menu-popover">
                <div className="c360-topbar__account-popover-head">
                  <span className="c360-topbar__account-popover-name">
                    {user.full_name || user.email}
                  </span>
                  <span className="c360-topbar__account-popover-role">
                    {user.role ?? "User"}
                  </span>
                </div>
                <TopBarCredits onNavigate={onAccountNavigate} />
                <Link
                  href={ROUTES.PROFILE}
                  className="c360-sidebar__user-menu-item"
                  onClick={() => onAccountNavigate?.()}
                >
                  <User size={16} aria-hidden /> Profile
                </Link>
                <Link
                  href={ROUTES.SETTINGS}
                  className="c360-sidebar__user-menu-item"
                  onClick={() => onAccountNavigate?.()}
                >
                  <Settings size={16} aria-hidden /> Settings
                </Link>
                <button
                  type="button"
                  className="c360-sidebar__user-menu-item c360-sidebar__user-menu-item--logout"
                  onClick={() => {
                    onAccountNavigate?.();
                    void logout();
                  }}
                >
                  <LogOut size={16} aria-hidden /> Logout
                </button>
              </div>
            }
          />
        )}
      </div>
    </header>
  );
}
