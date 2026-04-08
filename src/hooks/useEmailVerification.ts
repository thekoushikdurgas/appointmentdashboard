"use client";

import { useState, useCallback } from "react";
import {
  emailService,
  type SingleEmailVerifierResponse,
} from "@/services/graphql/emailService";
import { parseEmailServiceError } from "@/lib/emailErrors";

export function useEmailVerification() {
  const [result, setResult] = useState<SingleEmailVerifierResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = useCallback(
    async (email: string, provider?: string | null) => {
      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const data = await emailService.verifySingleEmail({
          email: email.trim(),
          provider: provider?.trim() || null,
        });
        setResult(data.email.verifySingleEmail);
      } catch (e) {
        setError(parseEmailServiceError(e));
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
