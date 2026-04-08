"use client";

import { useState } from "react";
import { AlertCircle, Inbox, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/shared/Skeleton";
import { cn } from "@/lib/utils";

interface DataStateProps {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  /** Return a Promise if work is async so the retry control can show a spinner until it settles. */
  onRetry?: () => void | Promise<void>;
  emptyTitle?: string;
  emptyMessage?: string;
  /** Number of skeleton rows to show while loading */
  skeletonRows?: number;
  /** Height of each skeleton row */
  skeletonHeight?: number;
  className?: string;
}

/**
 * Shared component for displaying loading / empty / error states in list pages.
 * Returns null when none of loading / error / empty is truthy — the parent
 * should render its own content in that case.
 */
export function DataState({
  loading = false,
  error,
  empty = false,
  onRetry,
  emptyTitle = "No results",
  emptyMessage = "Nothing here yet.",
  skeletonRows = 5,
  skeletonHeight = 40,
  className,
}: DataStateProps) {
  const [retryBusy, setRetryBusy] = useState(false);

  if (loading) {
    return (
      <div
        className={cn(
          "c360-data-state c360-flex c360-flex-col c360-gap-2",
          className,
        )}
      >
        {Array.from({ length: skeletonRows }).map((_, i) => (
          <Skeleton key={i} height={skeletonHeight} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "c360-data-state c360-data-state--error c360-flex c360-flex-col c360-items-center c360-gap-3 c360-p-8 c360-text-center",
          className,
        )}
      >
        <AlertCircle size={32} className="c360-text-danger" aria-hidden />
        <div>
          <p className="c360-font-semibold c360-text-sm c360-text-body c360-mb-1">
            Something went wrong
          </p>
          <p className="c360-text-muted c360-text-xs c360-m-0 c360-max-w-xs">
            {error}
          </p>
        </div>
        {onRetry && (
          <Button
            variant="secondary"
            size="sm"
            disabled={retryBusy}
            leftIcon={
              <RefreshCw size={13} className={cn(retryBusy && "c360-spin")} />
            }
            onClick={() => {
              setRetryBusy(true);
              void Promise.resolve(onRetry()).finally(() =>
                setRetryBusy(false),
              );
            }}
          >
            Retry
          </Button>
        )}
      </div>
    );
  }

  if (empty) {
    return (
      <div
        className={cn(
          "c360-data-state c360-data-state--empty c360-flex c360-flex-col c360-items-center c360-gap-3 c360-p-8 c360-text-center",
          className,
        )}
      >
        <Inbox size={32} className="c360-text-muted" aria-hidden />
        <div>
          <p className="c360-font-semibold c360-text-sm c360-text-body c360-mb-1">
            {emptyTitle}
          </p>
          <p className="c360-text-muted c360-text-xs c360-m-0 c360-max-w-xs">
            {emptyMessage}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
