import { forwardRef, SelectHTMLAttributes, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
  placeholder?: string;
  inputSize?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options = [],
      placeholder,
      inputSize = "md",
      fullWidth = true,
      className,
      id,
      ...props
    },
    ref,
  ) => {
    const uid = useId().replace(/:/g, "");
    const selectId = id ?? `select-${uid}`;

    return (
      <div
        className={cn(
          "c360-input-group",
          fullWidth && "c360-input-group--full",
          className,
        )}
      >
        {label && (
          <label htmlFor={selectId} className="c360-input-label">
            {label}
          </label>
        )}
        <div className="c360-select-wrap">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "c360-input",
              `c360-input--${inputSize}`,
              error && "c360-input--error",
              "c360-select",
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="c360-select__chevron" aria-hidden />
        </div>
        {error && <span className="c360-input-error">{error}</span>}
        {helperText && !error && (
          <span className="c360-input-helper">{helperText}</span>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";
