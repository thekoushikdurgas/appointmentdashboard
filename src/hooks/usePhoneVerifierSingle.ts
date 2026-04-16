"use client";

import { useState, useCallback } from "react";
import { phoneService } from "@/services/graphql/phoneService";
import { parsePhoneServiceError } from "@/lib/phoneErrors";

interface UsePhoneVerifierSingleReturn {
  verify: (email: string, provider?: string | null) => Promise<void>;
  result: unknown;
  loading: boolean;
  error: string | null;
  reset: () => void;
}

export function usePhoneVerifierSingle(): UsePhoneVerifierSingleReturn {
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = useCallback(
    async (email: string, provider?: string | null) => {
      const e = email.trim();
      if (!e || !e.includes("@")) {
        setError("Enter a valid email address.");
        return;
      }
      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const data = await phoneService.verifyPhone({
          email: e,
          provider: provider ?? null,
        });
        setResult(data.phone.verifyPhone);
      } catch (err) {
        setError(parsePhoneServiceError(err));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { verify, result, loading, error, reset };
}
