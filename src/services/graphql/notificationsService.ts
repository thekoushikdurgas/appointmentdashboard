import { graphqlQuery, graphqlMutation } from "@/lib/graphqlClient";
import type {
  Notification,
  NotificationFilterInput,
  NotificationPreferences,
  UpdateNotificationPreferencesInput,
  PageInfo,
} from "@/graphql/generated/types";
import {
  NOTIFICATIONS_LIST_QUERY,
  NOTIFICATION_ONE_QUERY,
  NOTIFICATIONS_UNREAD_QUERY,
  MARK_NOTIFICATIONS_READ_MUTATION,
  MARK_NOTIFICATION_READ_MUTATION,
  DELETE_NOTIFICATIONS_MUTATION,
  NOTIFICATION_PREFERENCES_QUERY,
  UPDATE_NOTIFICATION_PREFERENCES_MUTATION,
} from "@/graphql/notificationsOperations";

export type { Notification as NotificationRecord } from "@/graphql/generated/types";
export type {
  NotificationPreferences,
  NotificationFilterInput,
  UpdateNotificationPreferencesInput,
  GraphQlNotificationType,
} from "@/graphql/generated/types";

export interface NotificationsListResult {
  items: Notification[];
  pageInfo: PageInfo;
}

function mergeNotificationFilters(
  overrides?: NotificationFilterInput,
): NotificationFilterInput {
  return {
    limit: 50,
    offset: 0,
    unreadOnly: false,
    ...overrides,
  };
}

export const notificationsService = {
  list: async (
    filters?: NotificationFilterInput,
  ): Promise<NotificationsListResult> => {
    const data = await graphqlQuery<{
      notifications: {
        notifications: {
          items: Notification[];
          pageInfo: PageInfo;
        };
      };
    }>(NOTIFICATIONS_LIST_QUERY, {
      filters: mergeNotificationFilters(filters),
    });
    return data.notifications.notifications;
  },

  get: async (notificationId: string): Promise<Notification> => {
    const data = await graphqlQuery<{
      notifications: { notification: Notification };
    }>(NOTIFICATION_ONE_QUERY, { notificationId });
    return data.notifications.notification;
  },

  unreadCount: () =>
    graphqlQuery<{ notifications: { unreadCount: { count: number } } }>(
      NOTIFICATIONS_UNREAD_QUERY,
    ),

  markNotificationsAsRead: (notificationIds: string[]) =>
    graphqlMutation<{
      notifications: { markNotificationsAsRead: { count: number } };
    }>(MARK_NOTIFICATIONS_READ_MUTATION, {
      input: { notificationIds },
    }),

  markNotificationAsRead: (notificationId: string) =>
    graphqlMutation<{
      notifications: { markNotificationAsRead: Notification };
    }>(MARK_NOTIFICATION_READ_MUTATION, { notificationId }),

  deleteNotifications: (notificationIds: string[]) =>
    graphqlMutation<{
      notifications: { deleteNotifications: { count: number } };
    }>(DELETE_NOTIFICATIONS_MUTATION, { input: { notificationIds } }),

  /**
   * No gateway `deleteAllRead` — page read items and delete until none on first page.
   */
  deleteAllRead: async (): Promise<{ count: number }> => {
    const pageLimit = 100;
    let totalDeleted = 0;
    const maxRounds = 200;
    for (let round = 0; round < maxRounds; round++) {
      const { items } = await notificationsService.list({
        limit: pageLimit,
        offset: 0,
        unreadOnly: false,
      });
      const readIds = items.filter((n) => n.read).map((n) => n.id);
      if (readIds.length === 0) break;
      await notificationsService.deleteNotifications(readIds);
      totalDeleted += readIds.length;
    }
    return { count: totalDeleted };
  },

  getPreferences: () =>
    graphqlQuery<{
      notifications: { notificationPreferences: NotificationPreferences };
    }>(NOTIFICATION_PREFERENCES_QUERY),

  updatePreferences: (input: UpdateNotificationPreferencesInput) =>
    graphqlMutation<{
      notifications: {
        updateNotificationPreferences: NotificationPreferences;
      };
    }>(UPDATE_NOTIFICATION_PREFERENCES_MUTATION, { input }),
};
