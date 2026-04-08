"use client";

import { Card } from "@/components/ui/Card";
import { TwoFactorPanel } from "@/components/feature/two-factor/TwoFactorPanel";

export function ProfileSecurityTab() {
  return (
    <div className="c360-section-stack">
      <Card title="Two-Factor Authentication" className="c360-max-w-560">
        <TwoFactorPanel variant="compact" />
      </Card>
    </div>
  );
}
