"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  inputSize?: "sm" | "md";
  wrapperClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      inputSize = "md",
      required,
      id,
      className,
      wrapperClassName,
      ...props
    },
    ref,
  ) => {
    const uid = useId().replace(/:/g, "");
    const inputId = id ?? `input-${uid}`;

    return (
      <div
        className={cn("c360-field", wrapperClassName)}
        // Security extensions (e.g. Bitdefender) may inject `bis_*` attributes on
        // divs before hydration, causing a false mismatch vs SSR HTML.
        suppressHydrationWarning
      >
        {label && (
          <label
            htmlFor={inputId}
            className={cn("c360-label", required && "c360-label--required")}
          >
            {label}
          </label>
        )}
        <div className="c360-input-wrap" suppressHydrationWarning>
          {leftIcon && (
            <span className="c360-input__affix c360-input__affix--left">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            required={required}
            className={cn(
              "c360-input",
              inputSize === "sm" && "c360-input--sm",
              error && "c360-input--error",
              leftIcon && "c360-search__input",
              className,
            )}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                  ? `${inputId}-helper`
                  : undefined
            }
            aria-invalid={!!error}
            {...props}
          />
          {rightIcon && (
            <span className="c360-input__affix c360-input__affix--right">
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <span
            id={`${inputId}-error`}
            className="c360-error-text"
            role="alert"
          >
            {error}
          </span>
        )}
        {helperText && !error && (
          <span id={`${inputId}-helper`} className="c360-helper-text">
            {helperText}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };
export default Input;
