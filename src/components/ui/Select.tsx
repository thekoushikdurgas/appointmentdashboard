"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  type ButtonHTMLAttributes,
  type ChangeEvent,
} from "react";
import { cn } from "@/lib/utils";
import { useDataFiltersPeek } from "@/context/DataFiltersPeekContext";

/** Internal Radix item value for options whose logical value is "" (Radix forbids ""). */
export const C360_SELECT_EMPTY_VALUE = "__c360_select_empty__";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectOptionGroup {
  label: string;
  options: SelectOption[];
}

export interface SelectProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "size" | "children" | "onChange" | "value" | "defaultValue" | "type"
> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
  /** When set, renders grouped options (Radix Select.Group). Ignores flat `options`. */
  optionGroups?: SelectOptionGroup[];
  /** Renders before `optionGroups` / `options` (e.g. placeholder row outside groups). */
  leadingOptions?: SelectOption[];
  placeholder?: string;
  inputSize?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  /** Extra classes on the trigger `<button>` (toolbar/table compact styles). */
  triggerClassName?: string;
  value?: string | number | readonly string[];
  defaultValue?: string | number | readonly string[];
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
  /** Echoes native `<select required>` for `aria-required` on the trigger. */
  required?: boolean;
}

function coerceStr(
  v: string | number | readonly string[] | undefined | null,
): string {
  if (v === undefined || v === null) return "";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return v;
  return "";
}

function toRadixValue(logical: string): string {
  return logical === "" ? C360_SELECT_EMPTY_VALUE : logical;
}

function fromRadixValue(stored: string): string {
  return stored === C360_SELECT_EMPTY_VALUE ? "" : stored;
}

function emitChange(
  onChange: SelectProps["onChange"],
  logicalValue: string,
): void {
  if (!onChange) return;
  const payload = { value: logicalValue };
  onChange({
    target: payload,
    currentTarget: payload,
  } as ChangeEvent<HTMLSelectElement>);
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options = [],
      optionGroups,
      leadingOptions,
      placeholder,
      inputSize = "md",
      fullWidth = true,
      className,
      triggerClassName,
      id,
      value,
      defaultValue,
      onChange,
      disabled,
      required,
      ...rest
    },
    ref,
  ) => {
    const peek = useDataFiltersPeek();
    const peekRef = useRef(peek);
    peekRef.current = peek;
    const menuOpenRef = useRef(false);

    const handleMenuOpenChange = useCallback(
      (open: boolean) => {
        menuOpenRef.current = open;
        peek?.notifyFilterOverlayOpen(open);
      },
      [peek],
    );

    useEffect(() => {
      return () => {
        if (menuOpenRef.current) {
          peekRef.current?.notifyFilterOverlayOpen(false);
        }
      };
    }, []);

    const uid = useId().replace(/:/g, "");
    const selectId = id ?? `select-${uid}`;

    const controlled = value !== undefined;
    const logicalValue = coerceStr(value);
    const logicalDefault = coerceStr(defaultValue);

    const radixValue = controlled ? toRadixValue(logicalValue) : undefined;
    const radixDefault =
      !controlled && defaultValue !== undefined
        ? toRadixValue(logicalDefault)
        : undefined;

    const handleValueChange = (next: string) => {
      emitChange(onChange, fromRadixValue(next));
    };

    const chevronSize = inputSize === "sm" ? 14 : inputSize === "lg" ? 18 : 16;

    const items = useMemo(() => {
      const row = (opt: SelectOption, keyPrefix: string) => (
        <SelectPrimitive.Item
          key={`${keyPrefix}-${opt.value}-${opt.label}`}
          value={toRadixValue(opt.value)}
          disabled={opt.disabled}
          className="c360-select__item"
        >
          <span className="c360-select__item-indicator">
            <SelectPrimitive.ItemIndicator>
              <Check size={14} aria-hidden />
            </SelectPrimitive.ItemIndicator>
          </span>
          <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
        </SelectPrimitive.Item>
      );

      const leading =
        leadingOptions?.map((opt, i) => row(opt, `lead-${i}`)) ?? null;

      if (optionGroups?.length) {
        return (
          <>
            {leading}
            {optionGroups.map((g) => (
              <SelectPrimitive.Group key={g.label}>
                <SelectPrimitive.Label className="c360-select__group-label">
                  {g.label}
                </SelectPrimitive.Label>
                {g.options.map((opt) => row(opt, g.label))}
              </SelectPrimitive.Group>
            ))}
          </>
        );
      }
      return (
        <>
          {leading}
          {options.map((opt) => row(opt, "opt"))}
        </>
      );
    }, [leadingOptions, optionGroups, options]);

    return (
      <div
        className={cn(
          "c360-input-group",
          fullWidth && "c360-input-group--full",
          className,
        )}
      >
        {label ? (
          <label htmlFor={selectId} className="c360-input-label">
            {label}
          </label>
        ) : null}
        <div className="c360-select-wrap">
          <SelectPrimitive.Root
            value={controlled ? radixValue : undefined}
            defaultValue={!controlled ? radixDefault : undefined}
            onValueChange={handleValueChange}
            onOpenChange={handleMenuOpenChange}
            disabled={disabled}
          >
            <SelectPrimitive.Trigger
              ref={ref}
              type="button"
              {...rest}
              id={selectId}
              className={cn(
                "c360-select__trigger",
                inputSize === "sm" && "c360-select__trigger--sm",
                inputSize === "lg" && "c360-select__trigger--lg",
                error && "c360-select__trigger--error",
                triggerClassName,
              )}
              aria-invalid={error ? true : undefined}
              aria-required={required ? true : undefined}
              data-invalid={error ? "true" : undefined}
            >
              <SelectPrimitive.Value placeholder={placeholder} />
              <SelectPrimitive.Icon aria-hidden className="c360-select__icon">
                <ChevronDown size={chevronSize} />
              </SelectPrimitive.Icon>
            </SelectPrimitive.Trigger>

            <SelectPrimitive.Portal>
              <SelectPrimitive.Content
                position="popper"
                sideOffset={6}
                className="c360-select__content"
              >
                <SelectPrimitive.ScrollUpButton className="c360-select__scroll-btn">
                  <ChevronUp size={14} />
                </SelectPrimitive.ScrollUpButton>
                <SelectPrimitive.Viewport className="c360-select__viewport">
                  {items}
                </SelectPrimitive.Viewport>
                <SelectPrimitive.ScrollDownButton className="c360-select__scroll-btn">
                  <ChevronDown size={14} />
                </SelectPrimitive.ScrollDownButton>
              </SelectPrimitive.Content>
            </SelectPrimitive.Portal>
          </SelectPrimitive.Root>
        </div>
        {error ? <span className="c360-input-error">{error}</span> : null}
        {helperText && !error ? (
          <span className="c360-input-helper">{helperText}</span>
        ) : null}
      </div>
    );
  },
);

Select.displayName = "Select";
