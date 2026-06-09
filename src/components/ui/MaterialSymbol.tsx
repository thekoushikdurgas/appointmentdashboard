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

/** PUA glyphs for icon_names subset — ligature names render as plain text when font loads late. */
const MATERIAL_SYMBOL_GLYPHS: Record<string, string> = {
  download: "\uF090",
  paid: "\uF041",
};

function materialSymbolContent(name: string): string {
  return MATERIAL_SYMBOL_GLYPHS[name] ?? name;
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
      {materialSymbolContent(name)}
    </span>
  );
}
