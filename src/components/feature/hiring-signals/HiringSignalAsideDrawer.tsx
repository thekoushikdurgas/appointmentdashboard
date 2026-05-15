"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useOverlayLayer } from "@/hooks/useOverlayLayer";

export interface HiringSignalAsideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Must match the `id` of the visible title inside `children` (e.g. on `h2`). */
  ariaLabelledBy: string;
  /** Inside `aside`: `header.c360-hs-drawer__header`, `div.c360-hs-drawer__body`, optional `footer.c360-hs-drawer__footer`. */
  children: ReactNode;
}

/**
 * Shared right-hand hiring-signal drawer: portal, backdrop, slide-in panel,
 * body scroll lock + focus trap (see `useOverlayLayer`).
 */
export function HiringSignalAsideDrawer({
  isOpen,
  onClose,
  ariaLabelledBy,
  children,
}: HiringSignalAsideDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const asideRef = useRef<HTMLElement | null>(null);

  useEffect(() => setMounted(true), []);

  const layerActive = isOpen && mounted;
  useOverlayLayer(layerActive, onClose, asideRef);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.button
            type="button"
            className="c360-hs-drawer-backdrop"
            aria-label="Close panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            ref={asideRef}
            className="c360-hs-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby={ariaLabelledBy}
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
