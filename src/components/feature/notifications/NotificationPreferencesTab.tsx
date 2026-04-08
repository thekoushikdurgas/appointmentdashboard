"use client";

import { Alert } from "@/components/ui/Alert";
import { Checkbox } from "@/components/ui/Checkbox";
import { useNotificationPreferences } from "@/hooks/useNotifications";
import type {
  NotificationPreferences,
  UpdateNotificationPreferencesInput,
} from "@/graphql/generated/types";

const ROWS: {
  key: keyof NotificationPreferences;
  label: string;
  desc: string;
}[] = [
  {
    key: "emailEnabled",
    label: "Email notifications",
    desc: "Receive notifications via email",
  },
  {
    key: "pushEnabled",
    label: "Push notifications",
    desc: "Receive browser push notifications",
  },
  {
    key: "emailDigest",
    label: "Email digest",
    desc: "Daily summary of activity",
  },
  {
    key: "newLeads",
    label: "New leads",
    desc: "Notify when new leads are added",
  },
  {
    key: "securityAlerts",
    label: "Security alerts",
    desc: "Login and security event notifications",
  },
  {
    key: "billingUpdates",
    label: "Billing updates",
    desc: "Invoices and payment notifications",
  },
  {
    key: "marketing",
    label: "Marketing",
    desc: "Product updates and promotions",
  },
];

export function NotificationPreferencesTab() {
  const { preferences, loading, saving, error, update } =
    useNotificationPreferences();

  if (loading)
    return <p className="c360-page-subtitle c360-p-6">Loading preferences…</p>;
  if (!preferences) return null;

  return (
    <div>
      {error && (
        <Alert variant="danger" className="c360-mb-4">
          {error}
        </Alert>
      )}
      <div className="c360-flex c360-flex-col c360-gap-1">
        {ROWS.map(({ key, label, desc }) => (
          <div key={key} className="c360-pref-row">
            <div>
              <p className="c360-pref-label">{label}</p>
              <p className="c360-pref-desc">{desc}</p>
            </div>
            <Checkbox
              checked={preferences[key]}
              onChange={() =>
                update({
                  [key]: !preferences[key],
                } as UpdateNotificationPreferencesInput)
              }
              disabled={saving}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
