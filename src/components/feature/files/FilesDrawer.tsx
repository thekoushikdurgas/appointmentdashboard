"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useFilesDrawer } from "@/context/FilesDrawerContext";
import { FilesWorkspace } from "@/components/feature/files/FilesWorkspace";

export function FilesDrawer() {
  const { isOpen, closeFilesDrawer, openRequest } = useFilesDrawer();
  const [mounted, setMounted] = useState(false);
  const filesStatStripHostRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFilesDrawer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeFilesDrawer]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.button
            type="button"
            className="c360-files-drawer-backdrop"
            aria-label="Close files panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeFilesDrawer}
          />
          <motion.aside
            className="c360-files-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="c360-files-drawer-title"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <header className="c360-files-drawer__header">
              <div className="c360-files-drawer__header-main c360-min-w-0">
                <h2 id="c360-files-drawer-title" className="c360-sr-only">
                  Files
                </h2>
                <div
                  ref={filesStatStripHostRef}
                  className="c360-files-drawer__header-stats-host"
                  aria-live="polite"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="c360-shrink-0"
                onClick={closeFilesDrawer}
                aria-label="Close"
              >
                <X size={20} />
              </Button>
            </header>
            <div className="c360-files-drawer__body">
              <FilesWorkspace
                key={openRequest.seq}
                statStripPortalRef={filesStatStripHostRef}
              />
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
