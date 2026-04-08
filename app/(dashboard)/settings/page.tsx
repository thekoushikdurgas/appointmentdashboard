"use client";

import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Checkbox } from "@/components/ui/Checkbox";
import { useTheme } from "@/context/ThemeContext";
import { useNotificationPreferences } from "@/hooks/useNotifications";
import { TwoFactorPanel } from "@/components/feature/two-factor/TwoFactorPanel";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  /* Notification prefs */
  const {
    preferences,
    loading: prefLoading,
    saving: prefSaving,
    error: prefError,
    update,
  } = useNotificationPreferences();

  return (
    <DashboardPageLayout>
      <div className="c360-page-header">
        <div>
          <h1 className="c360-page-header__title">Settings</h1>
          <p className="c360-page-header__subtitle">
            Manage your preferences and account security
          </p>
        </div>
      </div>

      <div className="c360-settings-stack">
        {/* Theme */}
        <Card
          title="Appearance"
          subtitle="Choose your preferred interface theme"
        >
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

        {/* Notification prefs */}
        <Card
          title="Notifications"
          subtitle="Control how you receive notifications"
          actions={
            prefLoading ? (
              <span className="c360-spinner c360-spinner--sm" />
            ) : undefined
          }
        >
          {prefError && (
            <Alert variant="danger" className="c360-mb-3">
              {prefError}
            </Alert>
          )}
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

        <Card
          title="Two-Factor Authentication"
          subtitle="Add an extra layer of security to your account"
        >
          <TwoFactorPanel variant="full" />
        </Card>
      </div>
    </DashboardPageLayout>
  );
}
