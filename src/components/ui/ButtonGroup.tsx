"use client";

import { cn } from "@/lib/utils";

export interface ButtonGroupOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  disabled?: boolean;
}

interface ButtonGroupProps<T extends string = string> {
  options: ButtonGroupOption<T>[];
  value?: T;
  onChange?: (value: T) => void;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "pills";
  fullWidth?: boolean;
  className?: string;
}

export function ButtonGroup<T extends string = string>({
  options,
  value,
  onChange,
  size = "md",
  variant = "default",
  fullWidth = false,
  className,
}: ButtonGroupProps<T>) {
  return (
    <div
      className={cn(
        "c360-btn-group",
        fullWidth && "c360-btn-group--full",
        variant === "default" && "c360-btn-group--default",
        variant === "pills" && "c360-btn-group--pills",
        className,
      )}
      role="group"
    >
      {options.map((opt, idx) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={opt.disabled}
            onClick={() => onChange?.(opt.value)}
            className={cn(
              "c360-btn-group__btn",
              `c360-btn-group__btn--${size}`,
              variant === "pills" && "c360-btn-group__btn--pill",
              variant === "default" &&
                idx < options.length - 1 &&
                "c360-btn-group__btn--divider",
              isActive && "c360-btn-group__btn--active",
              opt.disabled && "c360-btn-group__btn--disabled",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
