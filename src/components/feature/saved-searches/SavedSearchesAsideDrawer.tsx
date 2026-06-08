"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useOverlayLayer } from "@/hooks/useOverlayLayer";

export interface SavedSearchesAsideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Must match the visible title `id` inside the panel header. */
  ariaLabelledBy: string;
  children: ReactNode;
  /** When false, skip focus trap (e.g. save-name modal is open above this panel). */
  trapFocus?: boolean;
  "data-tour"?: string;
}

/** Right-hand slide-over for saved searches (contacts page). */
export function SavedSearchesAsideDrawer({
  isOpen,
  onClose,
  ariaLabelledBy,
  children,
  trapFocus = true,
  "data-tour": dataTour,
}: SavedSearchesAsideDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const asideRef = useRef<HTMLElement | null>(null);

  useEffect(() => setMounted(true), []);

  const layerActive = isOpen && mounted && trapFocus;
  useOverlayLayer(layerActive, onClose, asideRef);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.button
            type="button"
            className="c360-saved-searches-panel-backdrop"
            aria-label="Close saved searches panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            ref={asideRef}
            className="c360-saved-searches-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={ariaLabelledBy}
            data-tour={dataTour}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            {children}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
