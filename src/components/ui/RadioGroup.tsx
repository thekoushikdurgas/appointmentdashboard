"use client";

import { useId } from "react";
import { Radio, RadioGroup as PrimitiveRadioGroup } from "./Radio";

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  /** Unique field name — forwarded to every radio input */
  name: string;
  /** Options to render */
  options: RadioOption[];
  /** Currently selected value (controlled) */
  value?: string;
  /** Callback when the user selects a different option */
  onChange?: (value: string) => void;
  /** Display options in a row instead of a column */
  orientation?: "vertical" | "horizontal";
  /** Render each option as a card */
  card?: boolean;
  className?: string;
}

/**
 * RadioGroup — data-driven radio group built on top of the Radio primitive.
 *
 * Accepts an `options` array instead of JSX children, making it easy to
 * wire up dynamic lists (e.g. export type selectors, service pickers).
 */
export function RadioGroup({
  name,
  options,
  value,
  onChange,
  orientation = "vertical",
  card = false,
  className,
}: RadioGroupProps) {
  const uid = useId().replace(/:/g, "");

  return (
    <PrimitiveRadioGroup
      name={name}
      value={value}
      onChange={onChange}
      horizontal={orientation === "horizontal"}
      card={card}
      className={className}
    >
      {options.map((opt) => (
        <Radio
          key={opt.value}
          id={`${uid}-${opt.value}`}
          value={opt.value}
          label={opt.label}
          description={opt.description}
          disabled={opt.disabled}
        />
      ))}
    </PrimitiveRadioGroup>
  );
}
