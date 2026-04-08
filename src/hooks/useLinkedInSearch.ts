"use client";

import { useState, useCallback } from "react";
import { linkedinService } from "@/services/graphql/linkedinService";
import { mapLinkedInSearchResponse } from "@/lib/linkedinMappers";
import { validateLinkedInUrl } from "@/lib/linkedinValidation";
import type { LinkedInCompanyRow, LinkedInProfileRow } from "@/types/linkedin";

export function useLinkedInSearch() {
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<LinkedInProfileRow[]>([]);
  const [companies, setCompanies] = useState<LinkedInCompanyRow[]>([]);
  const [totals, setTotals] = useState({ totalContacts: 0, totalCompanies: 0 });
  const [lastSearchUrl, setLastSearchUrl] = useState("");

  const search = useCallback(async () => {
    const err = validateLinkedInUrl(url);
    if (err) {
      setUrlError(err);
      return null;
    }
    const trimmed = url.trim();
    setUrlError(null);
    setLoading(true);
    try {
      const res = await linkedinService.searchByUrl(trimmed);
      const s = res.linkedin.search;
      const nextTotals = {
        totalContacts: s.totalContacts,
        totalCompanies: s.totalCompanies,
      };
      setTotals(nextTotals);
      setLastSearchUrl(trimmed);
      const mapped = mapLinkedInSearchResponse(s, trimmed);
      setProfiles(mapped.profiles);
      setCompanies(mapped.companies);
      return { ...mapped, totals: nextTotals };
    } finally {
      setLoading(false);
    }
  }, [url]);

  const resetResults = useCallback(() => {
    setProfiles([]);
    setCompanies([]);
    setTotals({ totalContacts: 0, totalCompanies: 0 });
    setLastSearchUrl("");
  }, []);

  return {
    url,
    setUrl,
    urlError,
    setUrlError,
    loading,
    profiles,
    companies,
    totals,
    lastSearchUrl,
    search,
    resetResults,
  };
}
