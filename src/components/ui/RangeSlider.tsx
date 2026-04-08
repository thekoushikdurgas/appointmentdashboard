"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { applyVars } from "@/lib/applyCssVars";

interface RangeSliderProps {
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  label?: string;
  showValue?: boolean;
  formatValue?: (v: number) => string;
  disabled?: boolean;
  className?: string;
}

export function RangeSlider({
  min = 0,
  max = 100,
  step = 1,
  value,
  defaultValue = 0,
  onChange,
  label,
  showValue = true,
  formatValue = (v) => String(v),
  disabled = false,
  className,
}: RangeSliderProps) {
  const [internal, setInternal] = useState(defaultValue);
  const current = value !== undefined ? value : internal;
  const pct = ((current - min) / (max - min)) * 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    if (value === undefined) setInternal(v);
    onChange?.(v);
  };

  return (
    <div className={cn(className)}>
      {(label || showValue) && (
        <div className="c360-range-slider__header">
          {label && <label className="c360-range-slider__label">{label}</label>}
          {showValue && (
            <span className="c360-range-slider__value">
              {formatValue(current)}
            </span>
          )}
        </div>
      )}
      <div className="c360-range-slider__track-wrap">
        <input
          type="range"
          className="c360-range-slider__input"
          min={min}
          max={max}
          step={step}
          value={current}
          onChange={handleChange}
          disabled={disabled}
          ref={(el) => applyVars(el, { "--c360-range-pct": `${pct}%` })}
        />
      </div>
      <div className="c360-range-slider__ticks">
        <span className="c360-range-slider__tick">{formatValue(min)}</span>
        <span className="c360-range-slider__tick">{formatValue(max)}</span>
      </div>
    </div>
  );
}

/**
 * Dual-handle range slider (min-max range selection).
 */
interface RangeSliderDualProps {
  min?: number;
  max?: number;
  step?: number;
  values?: [number, number];
  defaultValues?: [number, number];
  onChange?: (values: [number, number]) => void;
  label?: string;
  formatValue?: (v: number) => string;
  className?: string;
}

export function RangeSliderDual({
  min = 0,
  max = 100,
  step = 1,
  values,
  defaultValues = [20, 80],
  onChange,
  label,
  formatValue = (v) => String(v),
  className,
}: RangeSliderDualProps) {
  const [internal, setInternal] = useState<[number, number]>(defaultValues);
  const [lo, hi] = values ?? internal;
  const loPct = ((lo - min) / (max - min)) * 100;
  const hiPct = ((hi - min) / (max - min)) * 100;

  const set = (which: "lo" | "hi", v: number) => {
    const next: [number, number] =
      which === "lo"
        ? [Math.min(v, hi - step), hi]
        : [lo, Math.max(v, lo + step)];
    if (!values) setInternal(next);
    onChange?.(next);
  };

  return (
    <div className={cn(className)}>
      {label && (
        <div className="c360-range-slider__header">
          <label className="c360-range-slider__label">{label}</label>
          <span className="c360-range-slider__value">
            {formatValue(lo)} — {formatValue(hi)}
          </span>
        </div>
      )}
      <div className="c360-range-dual__track">
        <div className="c360-range-dual__rail" aria-hidden />
        <div
          className="c360-range-dual__fill"
          ref={(el) =>
            applyVars(el, {
              "--c360-range-lo": `${loPct}%`,
              "--c360-range-hi-right": `${100 - hiPct}%`,
            })
          }
        />
        {(["lo", "hi"] as const).map((which) => (
          <input
            key={which}
            type="range"
            className="c360-range-dual__input"
            min={min}
            max={max}
            step={step}
            value={which === "lo" ? lo : hi}
            onChange={(e) => set(which, Number(e.target.value))}
          />
        ))}
      </div>
    </div>
  );
}
