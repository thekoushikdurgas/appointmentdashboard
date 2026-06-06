"use client";

import { useState, useCallback } from "react";
import { getGraphQLFieldErrors, firstFieldMessage } from "@/lib/errorParser";

export interface UseOtpLoginFormOptions {
  requestLoginOtp: (email: string) => Promise<void>;
}

export function useOtpLoginForm({ requestLoginOtp }: UseOtpLoginFormOptions) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[]> | undefined
  >();

  const resetErrors = useCallback(() => {
    setError("");
    setFieldErrors(undefined);
  }, []);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      resetErrors();
      if (!email) {
        setError("Please enter your email.");
        return;
      }
      setLoading(true);
      try {
        await requestLoginOtp(email);
      } catch (err) {
        setFieldErrors(getGraphQLFieldErrors(err));
        setError(
          err instanceof Error
            ? err.message
            : "Could not send sign-in code. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    },
    [email, requestLoginOtp, resetErrors],
  );

  return {
    email,
    setEmail,
    loading,
    error,
    fieldErrors,
    fieldError: (name: string) => firstFieldMessage(fieldErrors, name),
    submit,
    resetErrors,
  };
}

export type AuthOtpLoginFormHookState = ReturnType<typeof useOtpLoginForm>;
