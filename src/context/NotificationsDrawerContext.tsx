"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { notificationsService } from "@/services/graphql/notificationsService";

/** Sentinel href for command palette / synthetic nav (not a real list route). */
export const NOTIFICATIONS_DRAWER_NAV_HREF = "__c360_notifications_drawer__";

type OpenRequest = {
  seq: number;
};

export interface NotificationsDrawerContextValue {
  isOpen: boolean;
  openRequest: OpenRequest;
  unreadCount: number;
  openNotificationsDrawer: () => void;
  closeNotificationsDrawer: () => void;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationsDrawerContext =
  createContext<NotificationsDrawerContextValue | null>(null);

const UNREAD_POLL_MS = 30_000;

export function NotificationsDrawerProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openRequest, setOpenRequest] = useState<OpenRequest>({ seq: 0 });
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const res = await notificationsService.unreadCount();
      setUnreadCount(res.notifications.unreadCount.count);
    } catch {
      /* keep previous */
    }
  }, []);

  useEffect(() => {
    void refreshUnreadCount();
    const id = window.setInterval(
      () => void refreshUnreadCount(),
      UNREAD_POLL_MS,
    );
    return () => window.clearInterval(id);
  }, [refreshUnreadCount]);

  const openNotificationsDrawer = useCallback(() => {
    setOpenRequest((r) => ({ seq: r.seq + 1 }));
    setIsOpen(true);
    void refreshUnreadCount();
  }, [refreshUnreadCount]);

  const closeNotificationsDrawer = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({
      isOpen,
      openRequest,
      unreadCount,
      openNotificationsDrawer,
      closeNotificationsDrawer,
      refreshUnreadCount,
    }),
    [
      isOpen,
      openRequest,
      unreadCount,
      openNotificationsDrawer,
      closeNotificationsDrawer,
      refreshUnreadCount,
    ],
  );

  return (
    <NotificationsDrawerContext.Provider value={value}>
      {children}
    </NotificationsDrawerContext.Provider>
  );
}

export function useNotificationsDrawer(): NotificationsDrawerContextValue {
  const ctx = useContext(NotificationsDrawerContext);
  if (!ctx) {
    throw new Error(
      "useNotificationsDrawer must be used within NotificationsDrawerProvider",
    );
  }
  return ctx;
}
