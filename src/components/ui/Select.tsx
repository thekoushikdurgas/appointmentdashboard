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
  useState,
  type ButtonHTMLAttributes,
  type ChangeEvent,
} from "react";
import { cn } from "@/lib/utils";

/** Internal Radix item value for options whose logical value is "" (Radix forbids ""). */
export const C360_SELECT_EMPTY_VALUE = "__c360_select_empty__";

export interface SelectOption {
  value: string;
  label: string;
  /** Optional facet count shown as `label (count)` when set. */
  count?: number;
  disabled?: boolean;
}

/** Label for display; appends count when present. */
export function selectOptionDisplayLabel(opt: SelectOption): string {
  return typeof opt.count === "number"
    ? `${opt.label} (${opt.count})`
    : opt.label;
}

/** Sort non-empty-value options by count desc, then label; preserve leading empty-value rows. */
export function sortSelectOptionsByCount(
  options: SelectOption[],
): SelectOption[] {
  const leading = options.filter((o) => o.value === "");
  const rest = options.filter((o) => o.value !== "");
  const hasCounts = rest.some((o) => typeof o.count === "number");
  if (!hasCounts) return options;
  const sorted = [...rest].sort((a, b) => {
    const ca = typeof a.count === "number" ? a.count : 0;
    const cb = typeof b.count === "number" ? b.count : 0;
    if (cb !== ca) return cb - ca;
    return a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
  });
  return [...leading, ...sorted];
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
  /**
   * `portal` (default): Radix portal + popper positioning for toolbars and modals.
   * `inline`: document-flow panel below trigger (filter sidebars).
   */
  menuVariant?: "portal" | "inline";
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

function flattenSelectOptions(
  options: SelectOption[],
  optionGroups: SelectOptionGroup[] | undefined,
  leadingOptions: SelectOption[] | undefined,
): SelectOption[] {
  const out: SelectOption[] = [];
  if (leadingOptions?.length) out.push(...leadingOptions);
  if (optionGroups?.length) {
    for (const g of optionGroups) out.push(...g.options);
  } else {
    out.push(...options);
  }
  return out;
}

type InlineSelectBodyProps = {
  selectId: string;
  listId: string;
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  inputSize: "sm" | "md" | "lg";
  fullWidth: boolean;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  required?: boolean;
  logicalValue: string;
  allOptions: SelectOption[];
  optionGroups?: SelectOptionGroup[];
  leadingOptions?: SelectOption[];
  flatOptions: SelectOption[];
  onChange?: SelectProps["onChange"];
  triggerProps: Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "type" | "id" | "value" | "defaultValue" | "onChange"
  >;
  triggerRef: React.ForwardedRef<HTMLButtonElement>;
};

function InlineSelectBody({
  selectId,
  listId,
  label,
  error,
  helperText,
  placeholder,
  inputSize,
  fullWidth,
  className,
  triggerClassName,
  disabled,
  required,
  logicalValue,
  allOptions,
  optionGroups,
  leadingOptions,
  flatOptions,
  onChange,
  triggerProps,
  triggerRef,
}: InlineSelectBodyProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const chevronSize = inputSize === "sm" ? 14 : inputSize === "lg" ? 18 : 16;

  const sortedFlatOptions = useMemo(
    () => sortSelectOptionsByCount(flatOptions),
    [flatOptions],
  );

  const displayLabel = useMemo(() => {
    const match = allOptions.find((o) => o.value === logicalValue);
    if (match) return selectOptionDisplayLabel(match);
    return placeholder ?? "Select…";
  }, [allOptions, logicalValue, placeholder]);

  const pick = useCallback(
    (next: string) => {
      emitChange(onChange, next);
      setOpen(false);
    },
    [onChange],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  const renderOption = (opt: SelectOption, key: string) => {
    const selected = opt.value === logicalValue;
    return (
      <button
        key={key}
        type="button"
        role="option"
        aria-selected={selected}
        disabled={opt.disabled}
        className="c360-select__item"
        onClick={() => pick(opt.value)}
      >
        <span className="c360-select__item-indicator">
          {selected ? <Check size={14} aria-hidden /> : null}
        </span>
        {selectOptionDisplayLabel(opt)}
      </button>
    );
  };

  const listBody = optionGroups?.length ? (
    <>
      {leadingOptions?.map((opt, i) => renderOption(opt, `lead-${i}`))}
      {optionGroups.map((g) => (
        <div key={g.label} role="group" aria-label={g.label}>
          <div className="c360-select__group-label">{g.label}</div>
          {g.options.map((opt) => renderOption(opt, `${g.label}-${opt.value}`))}
        </div>
      ))}
    </>
  ) : (
    sortedFlatOptions.map((opt) =>
      renderOption(opt, `opt-${opt.value}-${opt.label}`),
    )
  );

  return (
    <div
      className={cn(
        "c360-input-group",
        fullWidth && "c360-input-group--full",
        "c360-select-wrap--inline-menu",
        className,
      )}
    >
      {label ? (
        <label htmlFor={selectId} className="c360-input-label">
          {label}
        </label>
      ) : null}
      <div
        ref={rootRef}
        className={cn(
          "c360-select-wrap c360-select-wrap--inline",
          open && "c360-select-wrap--open",
        )}
      >
        <button
          ref={triggerRef}
          type="button"
          {...triggerProps}
          id={selectId}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          className={cn(
            "c360-select__trigger",
            inputSize === "sm" && "c360-select__trigger--sm",
            inputSize === "lg" && "c360-select__trigger--lg",
            error && "c360-select__trigger--error",
            open && "c360-select__trigger--open",
            triggerClassName,
          )}
          data-invalid={error ? "true" : undefined}
          data-required={required ? "true" : undefined}
          data-state={open ? "open" : "closed"}
          onClick={() => !disabled && setOpen((v) => !v)}
        >
          <span
            className={cn(!logicalValue && placeholder && "c360-text-muted")}
          >
            {displayLabel}
          </span>
          <span aria-hidden className="c360-select__icon">
            <ChevronDown size={chevronSize} />
          </span>
        </button>
        {open ? (
          <div
            id={listId}
            role="listbox"
            className="c360-select__content c360-select__content--inline"
          >
            <div className="c360-select__viewport">{listBody}</div>
          </div>
        ) : null}
      </div>
      {error ? <span className="c360-input-error">{error}</span> : null}
      {helperText && !error ? (
        <span className="c360-input-helper">{helperText}</span>
      ) : null}
    </div>
  );
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
      menuVariant = "portal",
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
    const uid = useId().replace(/:/g, "");
    const selectId = id ?? `select-${uid}`;
    const listId = `${selectId}-list`;
    const inline = menuVariant === "inline";

    const controlled = value !== undefined;
    const logicalValue = coerceStr(value);
    const logicalDefault = coerceStr(defaultValue);

    const flatOptions = useMemo(
      () => flattenSelectOptions(options, optionGroups, leadingOptions),
      [options, optionGroups, leadingOptions],
    );

    const allOptions = flatOptions;

    const sortedPortalOptions = useMemo(
      () => sortSelectOptionsByCount(options),
      [options],
    );

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
          <SelectPrimitive.ItemText>
            {selectOptionDisplayLabel(opt)}
          </SelectPrimitive.ItemText>
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
          {sortedPortalOptions.map((opt) => row(opt, "opt"))}
        </>
      );
    }, [leadingOptions, optionGroups, sortedPortalOptions]);

    if (inline) {
      return (
        <InlineSelectBody
          selectId={selectId}
          listId={listId}
          label={label}
          error={error}
          helperText={helperText}
          placeholder={placeholder}
          inputSize={inputSize}
          fullWidth={fullWidth}
          className={className}
          triggerClassName={triggerClassName}
          disabled={disabled}
          required={required}
          logicalValue={logicalValue}
          allOptions={allOptions}
          optionGroups={optionGroups}
          leadingOptions={leadingOptions}
          flatOptions={flatOptions}
          onChange={onChange}
          triggerProps={rest}
          triggerRef={ref}
        />
      );
    }

    const radixValue = controlled ? toRadixValue(logicalValue) : undefined;
    const radixDefault =
      !controlled && defaultValue !== undefined
        ? toRadixValue(logicalDefault)
        : undefined;

    const handleValueChange = (next: string) => {
      emitChange(onChange, fromRadixValue(next));
    };

    const chevronSize = inputSize === "sm" ? 14 : inputSize === "lg" ? 18 : 16;

    const menu = (
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
    );

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
            <SelectPrimitive.Portal>{menu}</SelectPrimitive.Portal>
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
