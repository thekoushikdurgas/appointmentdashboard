"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { formatNumber } from "@/lib/utils";
import { isUsageUnlimited, usageProgressPercent } from "@/lib/usageDisplay";
import type { FeatureUsageInfo } from "@/graphql/generated/types";

interface FeatureUsageCardProps {
  feature: FeatureUsageInfo;
  onDrillDown?: (feature: string) => void;
}

export function FeatureUsageCard({
  feature,
  onDrillDown,
}: FeatureUsageCardProps) {
  const unlimited = isUsageUnlimited(feature);
  const pct = usageProgressPercent(feature);
  const isHigh = !unlimited && pct >= 80;

  return (
    <Card padding="md">
      <div className="c360-usage-card-header">
        <span
          className={cn(
            "c360-usage-card-title",
            onDrillDown && "c360-cursor-pointer",
          )}
          onClick={() => onDrillDown?.(feature.feature)}
          onKeyDown={(e) => {
            if (onDrillDown && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              onDrillDown(feature.feature);
            }
          }}
          role={onDrillDown ? "button" : undefined}
          tabIndex={onDrillDown ? 0 : undefined}
        >
          {feature.feature}
        </span>
        {unlimited ? (
          <Badge color="green">Unlimited</Badge>
        ) : (
          <Badge color={isHigh ? "red" : "blue"} dot>
            {pct.toFixed(0)}%
          </Badge>
        )}
      </div>
      {unlimited ? (
        <p className="c360-text-sm c360-text-muted c360-mb-2">
          {formatNumber(feature.used)} used · no plan cap
        </p>
      ) : (
        <div className="c360-mb-2">
          <Progress
            value={pct}
            max={100}
            showValue
            size="sm"
            color={isHigh ? "danger" : "primary"}
          />
        </div>
      )}
      <div className="c360-usage-card-footer">
        <span>{formatNumber(feature.used)} used</span>
        <span>{unlimited ? "∞" : formatNumber(feature.limit)} limit</span>
      </div>
      {feature.resetAt && (
        <p className="c360-text-muted c360-text-sm c360-mt-2 c360-mb-0">
          Resets {new Date(feature.resetAt).toLocaleDateString()}
        </p>
      )}
    </Card>
  );
}
