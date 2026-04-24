"use client";

import { useId, useCallback } from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "onChange" | "size"
> {
  label?: string;
  description?: string;
  indeterminate?: boolean;
  size?: "sm" | "md";
  wrapperClassName?: string;
  onChange?: (checked: boolean) => void;
}

export function Checkbox({
  label,
  description,
  indeterminate = false,
  size = "md",
  wrapperClassName,
  onChange,
  className,
  checked,
  id,
  ...props
}: CheckboxProps) {
  const uid = useId().replace(/:/g, "");
  const checkboxId = id ?? `checkbox-${uid}`;

  // Set the native DOM `indeterminate` property which CSS alone cannot trigger.
  const inputRef = useCallback(
    (el: HTMLInputElement | null) => {
      if (el) el.indeterminate = indeterminate;
    },
    [indeterminate],
  );

  return (
    <label
      className={cn("c360-checkbox", wrapperClassName)}
      htmlFor={checkboxId}
      suppressHydrationWarning
    >
      <input
        ref={inputRef}
        type="checkbox"
        id={checkboxId}
        checked={checked}
        data-indeterminate={indeterminate ? "true" : undefined}
        className={cn(
          "c360-checkbox__input",
          size === "sm" && "c360-checkbox__input--sm",
          className,
        )}
        onChange={(e) => onChange?.(e.target.checked)}
        {...props}
      />
      {(label || description) && (
        <div suppressHydrationWarning>
          {label && <span className="c360-checkbox__label">{label}</span>}
          {description && (
            <p className="c360-checkbox__description">{description}</p>
          )}
        </div>
      )}
    </label>
  );
}
