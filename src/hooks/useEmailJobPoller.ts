"use client";

import { useState, useEffect, useRef } from "react";
import {
  emailService,
  type EmailJobStatusResponse,
} from "@/services/graphql/emailService";
import { parseEmailServiceError } from "@/lib/emailErrors";

const DEFAULT_MS = 4000;
const POLL_TIMEOUT_MS = 30000;

/**
 * Poll `email.emailJobStatus` for satellite bulk jobs (finder/verify async).
 * Guards against overlapping polls and hung requests (shows error instead of endless spinner).
 */
export function useEmailJobPoller(
  jobId: string | null,
  intervalMs = DEFAULT_MS,
) {
  const [status, setStatus] = useState<EmailJobStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const doneRef = useRef(false);
  const inFlightRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;
    inFlightRef.current = false;
    if (!jobId) {
      setStatus(null);
      setError(null);
      return;
    }

    let intervalId: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const stopInterval = () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const tick = async () => {
      if (cancelled || doneRef.current || inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error("Job status request timed out"));
          }, POLL_TIMEOUT_MS);
        });
        const data = await Promise.race([
          emailService.emailJobStatus(jobId),
          timeoutPromise,
        ]);
        if (cancelled) return;
        const s = data.email.emailJobStatus;
        setStatus(s);
        setError(null);
        if (s.done) {
          doneRef.current = true;
          stopInterval();
        }
      } catch (e) {
        if (cancelled) return;
        const msg = parseEmailServiceError(e);
        setError(msg);
        doneRef.current = true;
        stopInterval();
      } finally {
        inFlightRef.current = false;
      }
    };

    void tick();
    intervalId = setInterval(() => void tick(), intervalMs);

    return () => {
      cancelled = true;
      doneRef.current = true;
      stopInterval();
    };
  }, [jobId, intervalMs]);

  return { status, error };
}
