"use client";

import { useState, useEffect, useCallback } from "react";
import {
  resumeService,
  type ResumeRecord,
} from "@/services/graphql/resumeService";

export function useResumeOne(resumeId: string | undefined) {
  const [record, setRecord] = useState<ResumeRecord | null>(null);
  const [loading, setLoading] = useState(Boolean(resumeId));
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const refresh = useCallback(async () => {
    if (!resumeId) {
      setRecord(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await resumeService.get(resumeId);
      setRecord(res.resume.resume);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setRecord(null);
    } finally {
      setLoading(false);
    }
  }, [resumeId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { record, loading, error, refresh, clearError };
}
