"use client";

import { useState, useRef, useEffect, useLayoutEffect, ReactNode } from "react";
import { createPortal } from "react-dom";
import { applyVars } from "@/lib/applyCssVars";

export type TooltipPlacement = "top" | "bottom" | "left" | "right";

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  placement?: TooltipPlacement;
  delay?: number;
  disabled?: boolean;
  maxWidth?: number;
}

type TooltipPos = { top: number; left: number };

export function Tooltip({
  content,
  children,
  placement = "top",
  delay = 300,
  disabled = false,
  maxWidth = 240,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<TooltipPos | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const show = () => {
    if (disabled) return;
    timerRef.current = setTimeout(() => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      const gap = 8;

      let top = 0;
      let left = 0;
      if (placement === "top") {
        top = rect.top + scrollY - gap;
        left = rect.left + scrollX + rect.width / 2;
      } else if (placement === "bottom") {
        top = rect.bottom + scrollY + gap;
        left = rect.left + scrollX + rect.width / 2;
      } else if (placement === "left") {
        top = rect.top + scrollY + rect.height / 2;
        left = rect.left + scrollX - gap;
      } else {
        top = rect.top + scrollY + rect.height / 2;
        left = rect.right + scrollX + gap;
      }

      setPos({ top, left });
      setVisible(true);
    }, delay);
  };

  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  };

  useLayoutEffect(() => {
    if (!visible || !pos || !tooltipRef.current) return;
    applyVars(tooltipRef.current, {
      top: `${pos.top}px`,
      left: `${pos.left}px`,
      "--c360-tooltip-max": `${maxWidth}px`,
    });
  }, [visible, pos, maxWidth]);

  const tooltip =
    visible && mounted && pos
      ? createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            className={`c360-tooltip__panel c360-tooltip__panel--${placement}`}
          >
            {content}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="c360-tooltip__trigger"
      >
        {children}
      </span>
      {tooltip}
    </>
  );
}
