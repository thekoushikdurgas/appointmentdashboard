"use client";
import { useState, useEffect, useCallback } from "react";
import { resumeService, ResumeRecord } from "@/services/graphql/resumeService";

export function useResume() {
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await resumeService.list();
      setResumes(res.resume.resumes);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const save = useCallback(
    async (resumeData: Record<string, unknown>, id?: string) => {
      const res = await resumeService.save({ resumeData, id: id ?? null });
      const saved = res.resume.saveResume;
      setResumes((prev) => {
        const idx = prev.findIndex((r) => r.id === saved.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated;
        }
        return [saved, ...prev];
      });
      return saved;
    },
    [],
  );

  const getById = useCallback(async (id: string) => {
    const res = await resumeService.get(id);
    return res.resume.resume;
  }, []);

  const remove = useCallback(async (id: string) => {
    await resumeService.delete(id);
    setResumes((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return {
    resumes,
    loading,
    error,
    save,
    remove,
    getById,
    refresh: fetchList,
    clearError,
  };
}
