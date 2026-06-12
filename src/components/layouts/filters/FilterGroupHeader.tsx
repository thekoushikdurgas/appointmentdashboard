"use client";

import { cn } from "@/lib/utils";

export function FilterGroupHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={cn("c360-entity-filters__group-header", className)}>
      {children}
    </h3>
  );
}
