"use client";

import { useEffect, useRef, useState } from "react";

export interface CountUpNumberProps {
  end: number;
  start?: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  separator?: string;
  className?: string;
  /** If true, starts counting when the element enters the viewport. */
  triggerOnVisible?: boolean;
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

function formatNumber(
  value: number,
  decimals: number,
  separator: string,
): string {
  const fixed = value.toFixed(decimals);
  const [intPart, decPart] = fixed.split(".");
  const withSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  return decPart !== undefined ? `${withSep}.${decPart}` : withSep;
}

export function CountUpNumber({
  end,
  start = 0,
  duration = 1500,
  decimals = 0,
  prefix = "",
  suffix = "",
  separator = ",",
  className,
  triggerOnVisible = true,
}: CountUpNumberProps) {
  const [value, setValue] = useState(start);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  function runAnimation() {
    if (started.current) return;
    started.current = true;
    const startTime = performance.now();
    const diff = end - start;

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setValue(start + diff * easeOutQuart(progress));
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  useEffect(() => {
    if (!triggerOnVisible) {
      runAnimation();
      return;
    }
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          runAnimation();
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [end, start, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatNumber(value, decimals, separator)}
      {suffix}
    </span>
  );
}

export default CountUpNumber;
