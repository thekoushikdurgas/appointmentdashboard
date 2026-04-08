"use client";

import { useState, useCallback } from "react";
import type { AuthLoginOptions } from "@/context/AuthContext";
import {
  getGraphQLFieldErrors,
  firstFieldMessage,
} from "@/lib/graphqlFieldErrors";

export interface UseLoginFormOptions {
  login: (
    email: string,
    password: string,
    options?: AuthLoginOptions,
  ) => Promise<void>;
}

export function useLoginForm({ login }: UseLoginFormOptions) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberBrowser, setRememberBrowser] = useState(true);
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
      if (!email || !password) {
        setError("Please fill in all fields.");
        return;
      }
      setLoading(true);
      try {
        await login(email, password, {
          attachClientGeo: rememberBrowser,
        });
      } catch (err) {
        setFieldErrors(getGraphQLFieldErrors(err));
        setError(
          err instanceof Error
            ? err.message
            : "Login failed. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    },
    [email, password, rememberBrowser, login, resetErrors],
  );

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    rememberBrowser,
    setRememberBrowser,
    loading,
    error,
    fieldErrors,
    fieldError: (name: string) => firstFieldMessage(fieldErrors, name),
    submit,
    resetErrors,
  };
}

export type AuthLoginFormState = ReturnType<typeof useLoginForm>;
