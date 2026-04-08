"use client";

import { useState, useCallback } from "react";

export interface MutationWithRetryOptions<TResult> {
  /** Maximum number of attempts (default 3). */
  maxAttempts?: number;
  /** Base delay in ms between attempts using exponential back-off (default 500). */
  baseDelay?: number;
  /** Called when mutation eventually succeeds. */
  onSuccess?: (result: TResult) => void;
  /** Called when all retries are exhausted. */
  onError?: (error: Error) => void;
  /** Predicate to determine if an error is retryable (default: always retry). */
  isRetryable?: (error: unknown) => boolean;
}

export interface MutationWithRetryState<TResult> {
  loading: boolean;
  error: string | null;
  data: TResult | null;
  attempt: number;
}

/**
 * Drop-in hook for GraphQL mutations with automatic exponential-backoff retry.
 *
 * @example
 * const { mutate, loading, error } = useMutationWithRetry(
 *   (input) => jobsService.pauseConnectraJob(input),
 *   { maxAttempts: 3, onSuccess: () => toast.success("Paused") }
 * );
 */
export function useMutationWithRetry<TArgs, TResult>(
  mutationFn: (args: TArgs) => Promise<TResult>,
  options: MutationWithRetryOptions<TResult> = {},
): MutationWithRetryState<TResult> & {
  mutate: (args: TArgs) => Promise<TResult | null>;
} {
  const {
    maxAttempts = 3,
    baseDelay = 500,
    onSuccess,
    onError,
    isRetryable = () => true,
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TResult | null>(null);
  const [attempt, setAttempt] = useState(0);

  const sleep = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));

  const mutate = useCallback(
    async (args: TArgs): Promise<TResult | null> => {
      setLoading(true);
      setError(null);
      setAttempt(0);

      let lastError: Error = new Error("Unknown error");

      for (let i = 0; i < maxAttempts; i++) {
        setAttempt(i + 1);
        try {
          const result = await mutationFn(args);
          setData(result);
          setLoading(false);
          onSuccess?.(result);
          return result;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          if (!isRetryable(err) || i === maxAttempts - 1) break;
          await sleep(baseDelay * Math.pow(2, i));
        }
      }

      setError(lastError.message);
      setLoading(false);
      onError?.(lastError);
      return null;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mutationFn, maxAttempts, baseDelay],
  );

  return { loading, error, data, attempt, mutate };
}
