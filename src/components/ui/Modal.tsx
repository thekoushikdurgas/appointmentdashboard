"use client";

import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOverlayLayer } from "@/hooks/useOverlayLayer";

type ModalSize = "sm" | "md" | "lg" | "xl";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  /** Accessible name when `title` is omitted (dialog must have a name). */
  ariaLabel?: string;
  size?: ModalSize;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  closeOnOverlay?: boolean;
  /** Prefer focusing this element when the modal opens (e.g. primary input). */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Stacks above slide-over panels that share `--c360-z-modal`. */
  stacked?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  ariaLabel,
  size = "md",
  children,
  footer,
  className,
  closeOnOverlay = true,
  initialFocusRef,
  stacked = false,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const layerActive = isOpen && mounted;
  useOverlayLayer(layerActive, onClose, dialogRef, { initialFocusRef });

  if (!isOpen || !mounted) return null;

  const dialogName = title ? undefined : (ariaLabel ?? "Dialog");

  return createPortal(
    <div
      className={cn(
        "c360-modal-overlay",
        stacked && "c360-modal-overlay--stacked",
      )}
      onClick={closeOnOverlay ? onClose : undefined}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={dialogName}
        tabIndex={-1}
        className={cn("c360-modal", `c360-modal--${size}`, className)}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="c360-modal__header">
            <h2 id={titleId} className="c360-modal__title">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="c360-modal__close"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="c360-modal__body">{children}</div>
        {footer && <div className="c360-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
