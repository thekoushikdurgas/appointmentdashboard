"use client";

import { Globe } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { companyWebsiteHref } from "@/components/feature/hiring-signals/hiringSignalUiUtils";

export interface HiringSignalCompanyWebsiteButtonProps {
  website: string;
}

/** Opens the company site in a new tab (drawer header meta). */
export function HiringSignalCompanyWebsiteButton({
  website,
}: HiringSignalCompanyWebsiteButtonProps) {
  const href = companyWebsiteHref(website);
  if (!href) return null;

  return (
    <Button asChild variant="secondary" size="sm" className="c360-gap-1">
      <a href={href} target="_blank" rel="noopener noreferrer">
        <Globe size={14} aria-hidden />
        Website
      </a>
    </Button>
  );
}
