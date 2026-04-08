"use client";

import { useState, useCallback } from "react";
import {
  emailService,
  type EmailResult,
} from "@/services/graphql/emailService";
import { parseEmailServiceError } from "@/lib/emailErrors";

export interface EmailFinderSingleInput {
  firstName: string;
  lastName: string;
  /** Use domain **or** `website` (API requires at least one). */
  domain?: string;
  website?: string;
}

export interface EmailFinderSingleState {
  emails: EmailResult[];
  total: number;
  success: boolean;
  /** Human-readable hint (domain vs website). */
  summary: string;
}

interface UseEmailFinderSingleReturn {
  find: (input: EmailFinderSingleInput) => Promise<void>;
  result: EmailFinderSingleState | null;
  loading: boolean;
  error: string | null;
  reset: () => void;
}

export function useEmailFinderSingle(): UseEmailFinderSingleReturn {
  const [result, setResult] = useState<EmailFinderSingleState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const find = useCallback(async (input: EmailFinderSingleInput) => {
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
      const data = await emailService.findEmails({
        firstName: input.firstName,
        lastName: input.lastName,
        domain: domain || null,
        website: website || null,
      });
      const r = data.email.findEmails;
      setResult({
        emails: r.emails,
        total: r.total,
        success: r.success,
        summary: domain ? `domain: ${domain}` : `website: ${website}`,
      });
    } catch (err) {
      setError(parseEmailServiceError(err));
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
