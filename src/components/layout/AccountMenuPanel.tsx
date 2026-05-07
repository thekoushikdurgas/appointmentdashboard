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

export interface AccountMenuPanelProps {
  onAccountNavigate?: () => void;
}

const itemBase = "c360-user-context-menu__row c360-context-menu__item";

const NAV_LINKS: readonly {
  href: string;
  label: string;
  icon: LucideIcon;
}[] = [
  { href: ROUTES.BILLING, label: "Billing", icon: CreditCard },
  { href: ROUTES.PROFILE, label: "Profile", icon: User },
  { href: ROUTES.SETTINGS, label: "Settings", icon: Settings },
];

export function AccountMenuPanel({ onAccountNavigate }: AccountMenuPanelProps) {
  const { user, logout } = useAuth();
  const { role } = useRole();

  const displayName = user?.full_name || user?.email || "Account";

  return (
    <div className="c360-user-context-menu">
      <div className="c360-user-context-menu__header">
        <span className="c360-user-context-menu__name">{displayName}</span>
        <span className="c360-user-context-menu__role">{role}</span>
      </div>

      <div className="c360-user-context-menu__credits">
        <TopBarCredits />
      </div>

      <div className="c360-user-context-menu__list">
        {NAV_LINKS.map(({ href, label, icon: Icon }) => (
          <ContextMenuItem key={href} asChild>
            <Link
              href={href}
              className={itemBase}
              onClick={() => onAccountNavigate?.()}
            >
              <Icon
                className="c360-user-context-menu__icon"
                size={16}
                aria-hidden
              />
              {label}
            </Link>
          </ContextMenuItem>
        ))}
        <ContextMenuItem
          className={cn(itemBase, "c360-user-context-menu__row--sign-out")}
          onSelect={(e) => {
            e.preventDefault();
            onAccountNavigate?.();
            void logout();
          }}
        >
          <LogOut
            className="c360-user-context-menu__icon"
            size={16}
            aria-hidden
          />
          Logout
        </ContextMenuItem>
      </div>
    </div>
  );
}
