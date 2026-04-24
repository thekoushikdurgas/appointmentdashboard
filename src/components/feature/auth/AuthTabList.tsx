"use client";

import { cn } from "@/lib/utils";

export type AuthTab = "login" | "register";

interface AuthTabListProps {
  active: AuthTab;
  onChange: (tab: AuthTab) => void;
}

export function AuthTabList({ active, onChange }: AuthTabListProps) {
  return (
    <div
      className="c360-tabs c360-tabs--contained c360-auth-tabs-spaced"
      suppressHydrationWarning
    >
      <div className="c360-tabs__list" role="tablist" suppressHydrationWarning>
        <button
          type="button"
          role="tab"
          aria-selected={active === "login"}
          className={cn(
            "c360-tabs__tab",
            active === "login" && "c360-tabs__tab--active",
          )}
          onClick={() => onChange("login")}
        >
          Sign In
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={active === "register"}
          className={cn(
            "c360-tabs__tab",
            active === "register" && "c360-tabs__tab--active",
          )}
          onClick={() => onChange("register")}
        >
          Create Account
        </button>
      </div>
    </div>
  );
}
