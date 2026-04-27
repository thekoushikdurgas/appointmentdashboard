"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { useJobsDrawer } from "@/context/JobsDrawerContext";

export interface OpenJobsDrawerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** When set, opens the drawer with this scheduler job family pre-selected. */
  jobFamily?: string;
}

/**
 * Opens the global Jobs drawer (dashboard shell). Use instead of linking to `/jobs`.
 */
export function OpenJobsDrawerButton({
  jobFamily,
  className,
  onClick,
  ...rest
}: OpenJobsDrawerButtonProps) {
  const { openJobsDrawer } = useJobsDrawer();
  return (
    <button
      type="button"
      className={cn(className)}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        if (jobFamily !== undefined) {
          openJobsDrawer({ jobFamily });
        } else {
          openJobsDrawer();
        }
      }}
      {...rest}
    />
  );
}
