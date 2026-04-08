/**
 * GraphQL documents for `query.notifications` / `mutation.notifications`.
 * Shapes match `NotificationQuery*` / `NotificationMutation*` in `graphql/generated/types.ts`.
 */

export const NOTIFICATION_FIELDS = `
  id
  userId
  type
  priority
  title
  message
  actionUrl
  actionLabel
  read
  createdAt
  readAt
  metadata
` as const;

export const NOTIFICATIONS_LIST_QUERY = `
  query NotificationsGateway($filters: NotificationFilterInput) {
    notifications {
      notifications(filters: $filters) {
        items { ${NOTIFICATION_FIELDS} }
        pageInfo {
          total
          limit
          offset
          hasNext
          hasPrevious
        }
      }
    }
  }
`;

export const NOTIFICATION_ONE_QUERY = `
  query NotificationOne($notificationId: ID!) {
    notifications {
      notification(notificationId: $notificationId) {
        ${NOTIFICATION_FIELDS}
      }
    }
  }
`;

export const NOTIFICATIONS_UNREAD_QUERY = `
  query NotificationsUnread {
    notifications {
      unreadCount {
        count
      }
    }
  }
`;

export const MARK_NOTIFICATIONS_READ_MUTATION = `
  mutation MarkNotificationsAsRead($input: MarkReadInput!) {
    notifications {
      markNotificationsAsRead(input: $input) {
        count
      }
    }
  }
`;

export const MARK_NOTIFICATION_READ_MUTATION = `
  mutation MarkNotificationAsRead($notificationId: ID!) {
    notifications {
      markNotificationAsRead(notificationId: $notificationId) {
        ${NOTIFICATION_FIELDS}
      }
    }
  }
`;

export const DELETE_NOTIFICATIONS_MUTATION = `
  mutation DeleteNotifications($input: DeleteNotificationsInput!) {
    notifications {
      deleteNotifications(input: $input) {
        count
      }
    }
  }
`;

export const NOTIFICATION_PREFERENCES_QUERY = `
  query NotificationPreferencesGateway {
    notifications {
      notificationPreferences {
        emailDigest
        newLeads
        securityAlerts
        marketing
        billingUpdates
        pushEnabled
        emailEnabled
      }
    }
  }
`;

export const UPDATE_NOTIFICATION_PREFERENCES_MUTATION = `
  mutation UpdateNotificationPreferencesGateway($input: UpdateNotificationPreferencesInput!) {
    notifications {
      updateNotificationPreferences(input: $input) {
        emailDigest
        newLeads
        securityAlerts
        marketing
        billingUpdates
        pushEnabled
        emailEnabled
      }
    }
  }
`;
