"use client";

import { useEffect, useState } from "react";
import { fetchCompanyLogoUrl } from "@/lib/contactCompanyLogoCache";

/**
 * When the contact list omits ``company.profilePic``, load the logo the same way
 * the company drawer does (enriched company profile).
 */
export function useCompanyLogoUrl(
  companyId: string | undefined,
  existingUrl: string | undefined,
): string | undefined {
  const [fetched, setFetched] = useState<string | undefined>();

  useEffect(() => {
    if (existingUrl?.trim()) {
      setFetched(undefined);
      return;
    }
    const id = companyId?.trim();
    if (!id) {
      setFetched(undefined);
      return;
    }
    let cancelled = false;
    void fetchCompanyLogoUrl(id).then((url) => {
      if (!cancelled) setFetched(url);
    });
    return () => {
      cancelled = true;
    };
  }, [companyId, existingUrl]);

  return existingUrl?.trim() || fetched;
}
