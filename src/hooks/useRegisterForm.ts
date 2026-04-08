"use client";

import { useState, useCallback } from "react";
import type { AuthRegisterOptions } from "@/context/AuthContext";
import {
  getGraphQLFieldErrors,
  firstFieldMessage,
} from "@/lib/graphqlFieldErrors";

export interface UseRegisterFormOptions {
  register: (
    name: string,
    email: string,
    password: string,
    options?: AuthRegisterOptions,
  ) => Promise<void>;
}

export function useRegisterForm({ register }: UseRegisterFormOptions) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      if (!name || !email || !password) {
        setError("Please fill in all fields.");
        return;
      }
      if (password !== confirm) {
        setError("Passwords do not match.");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      setLoading(true);
      try {
        await register(name, email, password);
      } catch (err) {
        setFieldErrors(getGraphQLFieldErrors(err));
        setError(
          err instanceof Error
            ? err.message
            : "Registration failed. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    },
    [name, email, password, confirm, register, resetErrors],
  );

  return {
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    confirm,
    setConfirm,
    showPassword,
    setShowPassword,
    loading,
    error,
    fieldErrors,
    fieldError: (f: string) => firstFieldMessage(fieldErrors, f),
    submit,
    resetErrors,
  };
}

export type AuthRegisterFormState = ReturnType<typeof useRegisterForm>;
