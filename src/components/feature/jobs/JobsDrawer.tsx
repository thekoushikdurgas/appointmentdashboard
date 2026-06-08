"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useJobsDrawer } from "@/context/JobsDrawerContext";
import { JobsWorkspace } from "@/components/feature/jobs/JobsWorkspace";
import { EXPORT_DRAWER_DISPLAY_NAME } from "@/lib/jobs/exportDrawerUi";

export function JobsDrawer() {
  const { isOpen, closeJobsDrawer, openRequest } = useJobsDrawer();
  const [mounted, setMounted] = useState(false);
  const jobsDrawerToolbarPortalRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeJobsDrawer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeJobsDrawer]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.button
            type="button"
            className="c360-jobs-drawer-backdrop"
            aria-label={`Close ${EXPORT_DRAWER_DISPLAY_NAME.toLowerCase()} panel`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeJobsDrawer}
          />
          <motion.aside
            className="c360-jobs-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="c360-jobs-drawer-title"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <header className="c360-jobs-drawer__header">
              <h2 id="c360-jobs-drawer-title" className="c360-sr-only">
                {EXPORT_DRAWER_DISPLAY_NAME}
              </h2>
              <div
                ref={jobsDrawerToolbarPortalRef}
                className="c360-jobs-drawer__header-toolbar-host"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="c360-shrink-0"
                onClick={closeJobsDrawer}
                aria-label="Close"
              >
                <X size={20} />
              </Button>
            </header>
            <div className="c360-jobs-drawer__body">
              <JobsWorkspace
                key={openRequest.seq}
                initialJobFamily={openRequest.jobFamily ?? ""}
                toolbarPortalRef={jobsDrawerToolbarPortalRef}
              />
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
