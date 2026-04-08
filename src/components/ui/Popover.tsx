"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
  ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { applyVars } from "@/lib/applyCssVars";

export type PopoverPlacement = "top" | "bottom" | "left" | "right";

export interface PopoverProps {
  trigger: ReactNode;
  content: ReactNode;
  placement?: PopoverPlacement;
  /** For top/bottom: align panel start (left) or end (right) with trigger. */
  align?: "start" | "end";
  closeOnOutside?: boolean;
  width?: number;
}

type PopoverPos = { top: number; left: number };

export function Popover({
  trigger,
  content,
  placement = "bottom",
  align = "start",
  closeOnOutside = true,
  width = 280,
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<PopoverPos | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const computePos = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const gap = 8;

    let top = 0;
    let left = 0;
    if (placement === "bottom") {
      top = rect.bottom + scrollY + gap;
      left =
        align === "end" ? rect.right + scrollX - width : rect.left + scrollX;
    } else if (placement === "top") {
      top = rect.top + scrollY - gap;
      left =
        align === "end" ? rect.right + scrollX - width : rect.left + scrollX;
    } else if (placement === "left") {
      top = rect.top + scrollY;
      left = rect.left + scrollX - gap;
    } else {
      top = rect.top + scrollY;
      left = rect.right + scrollX + gap;
    }
    setPos({ top, left });
  }, [placement, align, width]);

  const toggle = () => {
    if (!open) computePos();
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    const onResize = () => computePos();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open, computePos]);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  useEffect(() => {
    if (!closeOnOutside || !open) return;

    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !popoverRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, closeOnOutside]);

  useLayoutEffect(() => {
    if (!open || !pos || !popoverRef.current) return;
    applyVars(popoverRef.current, {
      top: `${pos.top}px`,
      left: `${pos.left}px`,
      "--c360-popover-width": `${width}px`,
    });
  }, [open, pos, width]);

  const popover =
    open && mounted && pos
      ? createPortal(
          <div
            ref={popoverRef}
            className={`c360-popover__panel c360-popover__panel--${placement}`}
          >
            {content}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <span ref={triggerRef} onClick={toggle} className="c360-popover__trigger">
        {trigger}
      </span>
      {popover}
    </>
  );
}
