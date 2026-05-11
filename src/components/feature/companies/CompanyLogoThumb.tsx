"use client";

import { useMemo, useState } from "react";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { companyFaviconUrl } from "@/lib/companyLogoUrl";
import type { Company } from "@/services/graphql/companiesService";

export interface CompanyLogoThumbProps {
  company: Pick<Company, "website" | "domain" | "name">;
  /** Table rows: `sm` (36px); card grid: `md` (44px); company detail header: `lg` (56px). */
  size?: "sm" | "md" | "lg";
  /** Overrides default Lucide size for the fallback icon */
  iconSize?: number;
  className?: string;
}

/**
 * Square logo area: favicon from website/domain when possible, else building icon.
 */
export function CompanyLogoThumb({
  company,
  size = "sm",
  iconSize: iconSizeProp,
  className,
}: CompanyLogoThumbProps) {
  const src = useMemo(() => companyFaviconUrl(company), [company]);
  const [failed, setFailed] = useState(false);

  const boxClass =
    size === "md"
      ? "c360-company-icon-box"
      : size === "lg"
        ? "c360-company-icon-box c360-company-icon-box--lg"
        : "c360-company-icon-box c360-company-icon-box--sm";
  const defaultIcon = size === "lg" ? 32 : size === "md" ? 20 : 16;
  const iconSize = iconSizeProp ?? defaultIcon;
  const imgPx = size === "lg" ? 48 : size === "md" ? 36 : 28;

  if (!src || failed) {
    return (
      <div className={cn(`${boxClass} c360-shrink-0`, className)} aria-hidden>
        <Building2 size={iconSize} className="c360-text-primary" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        `${boxClass} c360-company-icon-box--favicon c360-shrink-0`,
        className,
      )}
      title={company.name || undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- remote favicon URL */}
      <img
        src={src}
        alt=""
        width={imgPx}
        height={imgPx}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="c360-company-icon-box__img"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
