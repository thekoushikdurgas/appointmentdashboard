"use client";

import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Checkbox } from "@/components/ui/Checkbox";
import { useTheme } from "@/context/ThemeContext";
import { useRole } from "@/context/RoleContext";
import { useNotificationPreferences } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

const ADMIN_CONSOLE_URL =
  (process.env.NEXT_PUBLIC_ADMIN_URL || "").replace(/\/$/, "") || null;

/** Appearance, notifications, and operator tools (2FA lives on Security tab). */
export function ProfileSettingsTab() {
  const { theme, setTheme } = useTheme();
  const { isSuperAdmin } = useRole();

  const {
    preferences,
    loading: prefLoading,
    saving: prefSaving,
    error: prefError,
    update,
  } = useNotificationPreferences();

  return (
    <div className="c360-settings-stack">
      <Card title="Appearance" subtitle="Choose your preferred interface theme">
        <div className="c360-btn-row">
          {(["light", "dark"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              className={cn(
                "c360-type-btn",
                t === "light"
                  ? "c360-type-btn--theme-light"
                  : "c360-type-btn--theme-dark",
                theme === t && "c360-type-btn--active",
              )}
            >
              {t === "light" ? "☀️ Light" : "🌙 Dark"}
            </button>
          ))}
        </div>
      </Card>

      <Card
        title="Notifications"
        subtitle="Control how you receive notifications"
        actions={
          prefLoading ? (
            <span className="c360-spinner c360-spinner--sm" />
          ) : undefined
        }
      >
        {prefError ? (
          <Alert variant="danger" className="c360-mb-3">
            {prefError}
          </Alert>
        ) : null}
        <div className="c360-section-stack c360-section-stack--sm">
          {(
            [
              {
                key: "emailEnabled" as const,
                label: "Email notifications",
                description: "Receive emails for important account events",
              },
              {
                key: "newLeads" as const,
                label: "Job alerts",
                description: "Notify when a bulk job completes or fails",
              },
              {
                key: "emailDigest" as const,
                label: "Weekly digest",
                description: "Get a weekly summary of your usage",
              },
            ] as const
          ).map((item) => (
            <div key={item.key} className="c360-settings-pref-item">
              <Checkbox
                checked={preferences?.[item.key] ?? false}
                onChange={(checked) => update({ [item.key]: checked })}
                disabled={prefLoading || prefSaving}
              />
              <div>
                <div className="c360-settings-pref-label">{item.label}</div>
                <div className="c360-settings-pref-desc">
                  {item.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {isSuperAdmin && ADMIN_CONSOLE_URL ? (
        <Card
          title="Operator console"
          subtitle="Django admin / ops (opens in a new tab)"
        >
          <div className="c360-card-body">
            <a
              href={ADMIN_CONSOLE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="c360-btn c360-btn--primary"
            >
              Open admin console
            </a>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
