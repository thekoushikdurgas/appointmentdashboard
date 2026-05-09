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
  /**
   * When true, the panel renders in the document tree directly under the trigger
   * (no portal, no fixed positioning). Intended for filter rails and narrow layouts.
   * Use with `placement="bottom"`; other placements are not visually adjusted for inline.
   */
  inline?: boolean;
  /** Extra classes on the portaled panel (e.g. sidebar flyout shadow). */
  panelClassName?: string;
  /** Fires when the popover opens or closes (after internal state updates). */
  onOpenChange?: (open: boolean) => void;
}

type PopoverPos = { top: number; left: number };

export function Popover({
  trigger,
  content,
  placement = "bottom",
  align = "start",
  closeOnOutside = true,
  width = 280,
  inline = false,
  panelClassName,
  onOpenChange,
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<PopoverPos | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  const computePos = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const gap = 8;

    let top = 0;
    let left = 0;
    if (placement === "bottom") {
      top = rect.bottom + gap;
      left = align === "end" ? rect.right - width : rect.left;
    } else if (placement === "top") {
      top = rect.top - gap;
      left = align === "end" ? rect.right - width : rect.left;
    } else if (placement === "left") {
      top = rect.top;
      left = rect.left - gap - width;
    } else {
      top = rect.top;
      left = rect.right + gap;
    }
    setPos({ top, left });
  }, [placement, align, width]);

  const toggle = () => {
    if (!open && !inline) computePos();
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open || inline) return;
    const onResize = () => computePos();
    const onScroll = () => computePos();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, inline, computePos]);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  useEffect(() => {
    if (!closeOnOutside || !open) return;

    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (inline) {
        if (!rootRef.current?.contains(target)) {
          setOpen(false);
        }
        return;
      }
      if (
        !triggerRef.current?.contains(target) &&
        !popoverRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, closeOnOutside, inline]);

  useLayoutEffect(() => {
    if (!open || !popoverRef.current) return;
    if (inline) {
      applyVars(popoverRef.current, {
        "--c360-popover-width": "100%",
      });
      applyVars(popoverRef.current, { top: null, left: null });
      return;
    }
    if (!pos) return;
    applyVars(popoverRef.current, {
      top: `${pos.top}px`,
      left: `${pos.left}px`,
      "--c360-popover-width": `${width}px`,
    });
  }, [open, inline, pos, width]);

  const panelClass = [
    "c360-popover__panel",
    `c360-popover__panel--${placement}`,
    inline ? "c360-popover__panel--inline" : "",
    panelClassName ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  if (inline) {
    return (
      <div
        ref={rootRef}
        className="c360-popover-root c360-popover-root--inline"
      >
        <span
          ref={triggerRef}
          onClick={toggle}
          className="c360-popover__trigger"
        >
          {trigger}
        </span>
        {open && mounted ? (
          <div ref={popoverRef} className={panelClass}>
            {content}
          </div>
        ) : null}
      </div>
    );
  }

  const popover =
    open && mounted && pos
      ? createPortal(
          <div ref={popoverRef} className={panelClass}>
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
