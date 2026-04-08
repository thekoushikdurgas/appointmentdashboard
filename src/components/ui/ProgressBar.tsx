"use client";

import { Progress } from "./Progress";
import type { ProgressProps } from "./Progress";

export type ProgressBarTone = "primary" | "success" | "warning" | "danger";
export type ProgressBarSize = "sm" | "md";

export interface ProgressBarProps {
  /** Current value, 0–100 */
  value: number;
  /** Colour tone mapped to c360 design tokens */
  tone?: ProgressBarTone;
  /** Whether to show a CSS animation on the fill (striped shimmer) */
  animated?: boolean;
  /** Optional label displayed above the bar */
  label?: string;
  /** Show the numeric percentage next to the label */
  showValue?: boolean;
  /** Bar height: sm = 6 px, md = 10 px */
  size?: ProgressBarSize;
  className?: string;
}

/**
 * ProgressBar — opinionated wrapper around the low-level Progress primitive.
 *
 * Uses `tone` instead of `color` to align with the plan's naming convention,
 * and adds the `animated` prop that maps to `indeterminate` when value is 0
 * or to a CSS-animated striped fill class otherwise.
 */
export function ProgressBar({
  value,
  tone = "primary",
  animated = false,
  label,
  showValue = false,
  size = "md",
  className,
}: ProgressBarProps) {
  const normalised = Math.min(Math.max(value, 0), 100);

  const progressProps: ProgressProps = {
    value: normalised,
    max: 100,
    size,
    color: tone,
    label,
    showValue,
    indeterminate: animated && normalised === 0,
    className,
  };

  return <Progress {...progressProps} />;
}
