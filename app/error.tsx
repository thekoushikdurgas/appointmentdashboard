"use client";

import { useEffect, useTransition } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const [resetPending, startReset] = useTransition();

  useEffect(() => {
    console.error("[Contact360] Unhandled error:", error);
  }, [error]);

  return (
    <div className="c360-error-page">
      <div className="c360-error-page__watermark c360-error-page__watermark--danger">
        500
      </div>

      <div className="c360-error-page__icon-ring c360-error-page__icon-ring--danger">
        <AlertTriangle size={28} />
      </div>

      <div>
        <h1 className="c360-error-page__title">Something went wrong</h1>
        <p className="c360-error-page__text c360-mx-auto">
          {error.message ||
            "An unexpected error occurred. Our team has been notified."}
        </p>
        {error.digest && (
          <p className="c360-error-page__digest">Error ID: {error.digest}</p>
        )}
      </div>

      <div className="c360-error-page__actions">
        <button
          type="button"
          disabled={resetPending}
          onClick={() => startReset(() => reset())}
          className="c360-btn c360-btn--primary c360-error-page__btn"
        >
          <RefreshCw size={14} className={cn(resetPending && "c360-spin")} />
          Try again
        </button>
        <Link
          href="/dashboard"
          className="c360-btn c360-btn--secondary c360-error-page__link-btn"
        >
          <Home size={14} />
          Go home
        </Link>
      </div>
    </div>
  );
}
