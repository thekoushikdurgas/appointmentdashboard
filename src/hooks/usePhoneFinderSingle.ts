"use client";

import { useState, useCallback } from "react";
import { phoneService } from "@/services/graphql/phoneService";
import { parsePhoneServiceError } from "@/lib/phoneErrors";

export interface PhoneFinderSingleInput {
  firstName: string;
  lastName: string;
  domain?: string;
  website?: string;
}

interface UsePhoneFinderSingleReturn {
  find: (input: PhoneFinderSingleInput) => Promise<void>;
  result: unknown;
  loading: boolean;
  error: string | null;
  reset: () => void;
}

export function usePhoneFinderSingle(): UsePhoneFinderSingleReturn {
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const find = useCallback(async (input: PhoneFinderSingleInput) => {
    const domain = input.domain?.trim() ?? "";
    const website = input.website?.trim() ?? "";
    if (!domain && !website) {
      setError("Enter a company domain or website (at least one is required).");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await phoneService.findPhone({
        firstName: input.firstName,
        lastName: input.lastName,
        domain: domain || null,
        website: website || null,
      });
      setResult(data.phone.findPhone);
    } catch (err) {
      setError(parsePhoneServiceError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { find, result, loading, error, reset };
}
