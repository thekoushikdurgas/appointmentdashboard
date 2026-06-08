"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export interface MaterialSymbolProps {
  name: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
  title?: string;
}

export function MaterialSymbol({
  name,
  size = 24,
  className,
  style,
  title,
}: MaterialSymbolProps) {
  return (
    <span
      className={cn("material-symbols-outlined", className)}
      style={{ fontSize: size, width: size, height: size, ...style }}
      aria-hidden={title ? undefined : true}
      title={title}
    >
      {name}
    </span>
  );
}
