"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchCompanyHiringSignalJobs } from "@/services/graphql/hiringSignalService";
import {
  parseLinkedInJobsPayload,
  type LinkedInJobRow,
} from "@/hooks/useHiringSignals";

export function useCompanyHiringSignals(companyUuid: string | undefined) {
  const [jobs, setJobs] = useState<LinkedInJobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const id = companyUuid?.trim();
    if (!id) {
      setJobs([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCompanyHiringSignalJobs(id, 200);
      const parsed = parseLinkedInJobsPayload(res.hireSignal?.companyJobs);
      setJobs(parsed.data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to load hiring signals",
      );
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [companyUuid]);

  useEffect(() => {
    void load();
  }, [load]);

  return { jobs, loading, error, refetch: load };
}
