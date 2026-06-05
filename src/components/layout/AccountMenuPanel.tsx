"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { CreditCard, LogOut, Settings, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/context/RoleContext";
import { ROUTES } from "@/lib/routes";
import { ContextMenuItem } from "@/components/ui/ContextMenu";
import { TopBarCredits } from "./TopBarCredits";
import { cn } from "@/lib/utils";

export type AccountMenuContentMode =
  | "context"
  | "sidebar-full"
  | "sidebar-compact";

export interface AccountMenuContentProps {
  onNavigate?: () => void;
  mode: AccountMenuContentMode;
}

export interface AccountMenuPanelProps {
  onAccountNavigate?: () => void;
}

const contextItemBase = "c360-user-context-menu__row c360-context-menu__item";

const NAV_LINKS: readonly {
  href: string;
  label: string;
  icon: LucideIcon;
}[] = [
  { href: ROUTES.BILLING, label: "Billing", icon: CreditCard },
  { href: ROUTES.PROFILE, label: "Profile", icon: User },
  { href: ROUTES.SETTINGS, label: "Settings", icon: Settings },
];

function formatRoleLabel(role: string): string {
  if (!role.trim()) return "Member";
  return role
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function accountInitial(displayName: string): string {
  const trimmed = displayName.trim();
  if (!trimmed) return "?";
  const first = trimmed.split(/\s+/)[0]?.[0] ?? trimmed[0];
  return first.toUpperCase();
}

function AccountAvatar({
  displayName,
  avatarUrl,
  size = "md",
}: {
  displayName: string;
  avatarUrl?: string | null;
  size?: "md" | "sm";
}) {
  const initial = accountInitial(displayName);
  return (
    <span
      className={cn(
        "c360-sidebar-account__avatar",
        size === "sm" && "c360-sidebar-account__avatar--sm",
      )}
      aria-hidden
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- sidebar avatar; URL from auth profile
        <img
          src={avatarUrl}
          alt=""
          className="c360-sidebar-account__avatar-img"
        />
      ) : (
        initial
      )}
    </span>
  );
}

export function AccountMenuContent({
  onNavigate,
  mode,
}: AccountMenuContentProps) {
  const { user, logout } = useAuth();
  const { role } = useRole();

  const displayName = user?.full_name || user?.email || "Account";
  const roleLabel = formatRoleLabel(role);

  const handleLogout = () => {
    onNavigate?.();
    void logout();
  };

  if (mode === "sidebar-compact") {
    return (
      <div
        className="c360-sidebar-account-compact"
        role="group"
        aria-label="Account"
      >
        <Link
          href={ROUTES.PROFILE}
          className={cn(
            "c360-sidebar__item",
            "c360-sidebar__item--leaf",
            "c360-sidebar__item--collapsed-icon",
            "c360-sidebar-account-compact__btn",
            "c360-sidebar-account-compact__btn--profile",
          )}
          title={displayName}
          aria-label={`${displayName}, ${roleLabel}`}
          onClick={() => onNavigate?.()}
        >
          <AccountAvatar
            displayName={displayName}
            avatarUrl={user?.avatar_url}
            size="sm"
          />
        </Link>
        {NAV_LINKS.filter(({ href }) => href !== ROUTES.PROFILE).map(
          ({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "c360-sidebar__item",
                "c360-sidebar__item--leaf",
                "c360-sidebar__item--collapsed-icon",
                "c360-sidebar-account-compact__btn",
              )}
              title={label}
              aria-label={label}
              onClick={() => onNavigate?.()}
            >
              <Icon size={18} className="c360-sidebar__item-icon" aria-hidden />
            </Link>
          ),
        )}
        <button
          type="button"
          className={cn(
            "c360-sidebar__item",
            "c360-sidebar__item--leaf",
            "c360-sidebar__item--collapsed-icon",
            "c360-sidebar-account-compact__btn",
            "c360-sidebar-account-compact__btn--sign-out",
          )}
          title="Logout"
          aria-label="Logout"
          onClick={handleLogout}
        >
          <LogOut size={18} className="c360-sidebar__item-icon" aria-hidden />
        </button>
      </div>
    );
  }

  const navLinks = NAV_LINKS.map(({ href, label, icon: Icon }) => {
    if (mode === "context") {
      return (
        <ContextMenuItem key={href} asChild>
          <Link
            href={href}
            className={contextItemBase}
            onClick={() => onNavigate?.()}
          >
            <Icon
              className="c360-user-context-menu__icon"
              size={16}
              aria-hidden
            />
            {label}
          </Link>
        </ContextMenuItem>
      );
    }

    return (
      <Link
        key={href}
        href={href}
        className="c360-sidebar-account__nav-link"
        onClick={() => onNavigate?.()}
      >
        <Icon
          className="c360-sidebar-account__nav-icon"
          size={16}
          aria-hidden
        />
        <span className="c360-sidebar-account__nav-label">{label}</span>
      </Link>
    );
  });

  const signOut =
    mode === "context" ? (
      <ContextMenuItem
        className={cn(contextItemBase, "c360-user-context-menu__row--sign-out")}
        onSelect={(e) => {
          e.preventDefault();
          handleLogout();
        }}
      >
        <LogOut
          className="c360-user-context-menu__icon"
          size={16}
          aria-hidden
        />
        Logout
      </ContextMenuItem>
    ) : (
      <button
        type="button"
        className="c360-sidebar-account__sign-out-btn"
        onClick={handleLogout}
      >
        <LogOut size={16} aria-hidden />
        Log out
      </button>
    );

  if (mode === "sidebar-full") {
    return (
      <div className="c360-sidebar-account">
        <Link
          href={ROUTES.PROFILE}
          className="c360-sidebar-account__profile"
          onClick={() => onNavigate?.()}
        >
          <AccountAvatar
            displayName={displayName}
            avatarUrl={user?.avatar_url}
          />
          <span className="c360-sidebar-account__identity">
            <span className="c360-sidebar-account__name">{displayName}</span>
            <span className="c360-sidebar-account__role-badge">
              {roleLabel}
            </span>
          </span>
        </Link>

        <div className="c360-sidebar-account__credits-panel">
          <TopBarCredits variant="sidebar" />
        </div>

        <nav className="c360-sidebar-account__nav" aria-label="Account links">
          {navLinks}
        </nav>

        <div className="c360-sidebar-account__sign-out-wrap">{signOut}</div>
      </div>
    );
  }

  return (
    <div className="c360-user-context-menu">
      <div className="c360-user-context-menu__header">
        <span className="c360-user-context-menu__name">{displayName}</span>
        <span className="c360-user-context-menu__role">{roleLabel}</span>
      </div>

      <div className="c360-user-context-menu__credits">
        <TopBarCredits />
      </div>

      <div className="c360-user-context-menu__list">
        {navLinks}
        {signOut}
      </div>
    </div>
  );
}

export function AccountMenuPanel({ onAccountNavigate }: AccountMenuPanelProps) {
  return <AccountMenuContent mode="context" onNavigate={onAccountNavigate} />;
}
