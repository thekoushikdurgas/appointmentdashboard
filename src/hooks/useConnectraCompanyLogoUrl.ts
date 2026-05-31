"use client";

import { useEffect, useState } from "react";
import { fetchConnectraCompanyLogoUrl } from "@/lib/contactCompanyLogoCache";

/**
 * When the contact list omits ``company.profilePic``, load the logo the same way
 * the company drawer does (connectraCompany).
 */
export function useConnectraCompanyLogoUrl(
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
    void fetchConnectraCompanyLogoUrl(id).then((url) => {
      if (!cancelled) setFetched(url);
    });
    return () => {
      cancelled = true;
    };
  }, [companyId, existingUrl]);

  return existingUrl?.trim() || fetched;
}
