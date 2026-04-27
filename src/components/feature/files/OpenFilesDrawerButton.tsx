"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { useFilesDrawer } from "@/context/FilesDrawerContext";

export type OpenFilesDrawerButtonProps =
  ButtonHTMLAttributes<HTMLButtonElement>;

/** Opens the global Files drawer. Use instead of linking to `/files`. */
export function OpenFilesDrawerButton({
  className,
  onClick,
  ...rest
}: OpenFilesDrawerButtonProps) {
  const { openFilesDrawer } = useFilesDrawer();
  return (
    <button
      type="button"
      className={cn(className)}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        openFilesDrawer();
      }}
      {...rest}
    />
  );
}
