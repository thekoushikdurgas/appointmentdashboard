"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useFilesDrawer } from "@/context/FilesDrawerContext";
import { FilesWorkspace } from "@/components/feature/files/FilesWorkspace";

export function FilesDrawer() {
  const { isOpen, closeFilesDrawer, openRequest } = useFilesDrawer();
  const [mounted, setMounted] = useState(false);

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
              <div className="c360-min-w-0">
                <h2
                  id="c360-files-drawer-title"
                  className="c360-m-0 c360-text-lg c360-font-semibold c360-text-ink"
                >
                  Files
                </h2>
                <p className="c360-m-0 c360-mt-1 c360-text-2xs c360-text-ink-muted">
                  Uploads, exports, and S3-backed workflows
                </p>
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
              <FilesWorkspace key={openRequest.seq} />
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
