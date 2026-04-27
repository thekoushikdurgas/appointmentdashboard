"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useNotificationsDrawer } from "@/context/NotificationsDrawerContext";
import { NotificationsWorkspace } from "@/components/feature/notifications/NotificationsWorkspace";

export function NotificationsDrawer() {
  const { isOpen, closeNotificationsDrawer, openRequest } =
    useNotificationsDrawer();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeNotificationsDrawer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeNotificationsDrawer]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.button
            type="button"
            className="c360-notifications-drawer-backdrop"
            aria-label="Close notifications panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeNotificationsDrawer}
          />
          <motion.aside
            className="c360-notifications-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="c360-notifications-drawer-title"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <header className="c360-notifications-drawer__header">
              <div className="c360-min-w-0">
                <h2
                  id="c360-notifications-drawer-title"
                  className="c360-m-0 c360-text-lg c360-font-semibold c360-text-ink"
                >
                  Notifications
                </h2>
                <p className="c360-m-0 c360-mt-1 c360-text-2xs c360-text-ink-muted">
                  Alerts, exports, and account activity
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="c360-shrink-0"
                onClick={closeNotificationsDrawer}
                aria-label="Close"
              >
                <X size={20} />
              </Button>
            </header>
            <div className="c360-notifications-drawer__body">
              <NotificationsWorkspace key={openRequest.seq} />
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
