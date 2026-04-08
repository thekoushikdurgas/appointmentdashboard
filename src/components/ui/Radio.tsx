"use client";

import { useId, Children, cloneElement, isValidElement } from "react";
import { cn } from "@/lib/utils";

export interface RadioProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: string;
  description?: string;
  wrapperClassName?: string;
}

export interface RadioGroupProps {
  children: React.ReactNode;
  horizontal?: boolean;
  card?: boolean;
  className?: string;
  /** Shared `name` attribute forwarded to every child Radio */
  name?: string;
  /** Controlled selected value — child whose `value` matches is checked */
  value?: string;
  /** Called with the new value when a child Radio changes */
  onChange?: (value: string) => void;
}

export function Radio({
  label,
  description,
  wrapperClassName,
  className,
  id,
  ...props
}: RadioProps) {
  const uid = useId().replace(/:/g, "");
  const radioId = id ?? `radio-${uid}`;

  return (
    <label className={cn("c360-radio", wrapperClassName)} htmlFor={radioId}>
      <input
        type="radio"
        id={radioId}
        className={cn("c360-radio__input", className)}
        {...props}
      />
      {(label || description) && (
        <div>
          {label && <span className="c360-radio__label">{label}</span>}
          {description && (
            <p className="c360-radio__description">{description}</p>
          )}
        </div>
      )}
    </label>
  );
}

export function RadioGroup({
  children,
  horizontal,
  card,
  className,
  name,
  value,
  onChange,
}: RadioGroupProps) {
  const enriched = Children.map(children, (child) => {
    if (!isValidElement<RadioProps>(child)) return child;
    const childValue = child.props.value as string | undefined;
    const extraProps: Partial<RadioProps> = {};
    if (name !== undefined && child.props.name === undefined) {
      extraProps.name = name;
    }
    if (value !== undefined && childValue !== undefined) {
      extraProps.checked = value === childValue;
    }
    if (onChange !== undefined && childValue !== undefined) {
      extraProps.onChange = () => onChange(childValue);
    }
    return cloneElement(child, extraProps);
  });

  return (
    <div
      className={cn(
        "c360-radio-group",
        horizontal && "c360-radio-group--horizontal",
        card && "c360-radio-group--card",
        className,
      )}
      role="radiogroup"
    >
      {enriched}
    </div>
  );
}
