"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { LogOut, Settings } from "lucide-react";
import { BillingIcon } from "@/components/ui/BillingIcon";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/context/RoleContext";
import { profileTabRoute, ROUTES } from "@/lib/routes";
import { ContextMenuItem } from "@/components/ui/ContextMenu";
import { TopBarCredits } from "./TopBarCredits";
import { SidebarQuickActions } from "./SidebarQuickActions";
import { formatRoleLabel } from "@/lib/displayText";
import { cn } from "@/lib/utils";

export type AccountMenuContentMode =
  | "context"
  | "sidebar-full"
  | "sidebar-compact";

export interface AccountMenuContentProps {
  onNavigate?: () => void;
  mode: AccountMenuContentMode;
  /** When false, only the profile row is shown (collapsed sidebar rail). */
  accountBodyExpanded?: boolean;
}

export interface AccountMenuPanelProps {
  onAccountNavigate?: () => void;
}

const contextItemBase = "c360-user-context-menu__row c360-context-menu__item";

const NAV_LINKS: readonly {
  href: string;
  label: string;
  icon?: LucideIcon;
}[] = [
  { href: ROUTES.BILLING, label: "Billing" },
  { href: profileTabRoute("settings"), label: "Settings", icon: Settings },
];

function AccountNavLinkIcon({
  href,
  size,
  className,
}: {
  href: string;
  size: number;
  className?: string;
}) {
  if (href === ROUTES.BILLING) {
    return <BillingIcon size={size} className={className} />;
  }
  const entry = NAV_LINKS.find((link) => link.href === href);
  if (!entry?.icon) return null;
  const Icon = entry.icon;
  return <Icon size={size} className={className} aria-hidden />;
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
  accountBodyExpanded = true,
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
          ({ href, label }) => (
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
              <AccountNavLinkIcon
                href={href}
                size={18}
                className="c360-sidebar__item-icon"
              />
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

  const navLinksForMode =
    mode === "sidebar-full"
      ? NAV_LINKS.filter(
          ({ href }) =>
            href !== ROUTES.PROFILE &&
            href !== profileTabRoute("settings") &&
            href !== ROUTES.BILLING,
        )
      : NAV_LINKS;

  const navLinks = navLinksForMode.map(({ href, label }) => {
    if (mode === "context") {
      return (
        <ContextMenuItem key={href} asChild>
          <Link
            href={href}
            className={contextItemBase}
            onClick={() => onNavigate?.()}
          >
            <AccountNavLinkIcon
              href={href}
              className="c360-user-context-menu__icon"
              size={16}
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
        <AccountNavLinkIcon
          href={href}
          className="c360-sidebar-account__nav-icon"
          size={16}
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
        aria-label="Log out"
        onClick={handleLogout}
      >
        <LogOut size={16} aria-hidden />
      </button>
    );

  if (mode === "sidebar-full" && !accountBodyExpanded) {
    const railBtnClass = cn(
      "c360-sidebar__item",
      "c360-sidebar__item--leaf",
      "c360-sidebar__item--collapsed-icon",
      "c360-sidebar-account-compact__btn",
    );

    return (
      <div className="c360-sidebar-account c360-sidebar-account--rail">
        <div
          className="c360-sidebar-account__rail-stack"
          role="group"
          aria-label="Quick actions and account"
        >
          <SidebarQuickActions
            railCollapsed
            integrated
            onMobileClose={onNavigate}
          />
          <div className="c360-sidebar-account__rail-divider" aria-hidden />
          <Link
            href={ROUTES.BILLING}
            className={railBtnClass}
            title="Billing"
            aria-label="Billing"
            onClick={() => onNavigate?.()}
          >
            <BillingIcon size={18} className="c360-sidebar__item-icon" />
          </Link>
          <Link
            href={ROUTES.PROFILE}
            className={cn(
              railBtnClass,
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
          <button
            type="button"
            className={cn(
              railBtnClass,
              "c360-sidebar-account-compact__btn--sign-out",
            )}
            title="Log out"
            aria-label="Log out"
            onClick={handleLogout}
          >
            <LogOut size={18} className="c360-sidebar__item-icon" aria-hidden />
          </button>
        </div>
      </div>
    );
  }

  if (mode === "sidebar-full") {
    const profileSection = (
      <div className="c360-sidebar-account__profile">
        <div className="c360-sidebar-account__profile-main">
          <div className="c360-sidebar-account__profile-credits">
            <TopBarCredits variant="profile" />
          </div>
          <Link
            href={ROUTES.BILLING}
            className="c360-sidebar-account__sign-out-btn c360-sidebar-account__billing-btn"
            aria-label="Billing"
            title="Billing"
            onClick={() => onNavigate?.()}
          >
            <BillingIcon size={16} />
          </Link>
        </div>
        <div className="c360-sidebar-account__profile-avatar">
          <Link
            href={ROUTES.PROFILE}
            className="c360-sidebar-account__profile-link"
            title={displayName}
            aria-label={`${displayName}, ${roleLabel}`}
            onClick={() => onNavigate?.()}
          >
            <AccountAvatar
              displayName={displayName}
              avatarUrl={user?.avatar_url}
              size="md"
            />
            <span className="c360-sidebar-account__identity">
              <span className="c360-sidebar-account__name">{displayName}</span>
              <span className="c360-sidebar-account__role-badge">
                {roleLabel}
              </span>
            </span>
            <button
              type="button"
              className="c360-sidebar-account__sign-out-btn"
              aria-label="Log out"
              onClick={handleLogout}
            >
              <LogOut size={16} aria-hidden />
            </button>
          </Link>
        </div>
      </div>
    );

    return (
      <div className="c360-sidebar-account">
        <SidebarQuickActions railCollapsed={false} onMobileClose={onNavigate} />

        {navLinks.length > 0 ? (
          <div className="c360-sidebar-account__body">
            <nav
              className="c360-sidebar-account__nav"
              aria-label="Account links"
            >
              {navLinks}
            </nav>
          </div>
        ) : null}

        {profileSection}
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
