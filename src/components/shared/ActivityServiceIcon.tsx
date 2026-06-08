"use client";

import { BillingIcon } from "@/components/ui/BillingIcon";
import { ExportDrawerIcon } from "@/components/ui/ExportDrawerIcon";
import { activityServiceIcon } from "@/lib/activityDisplay";
import { isBillingServiceType } from "@/lib/billing/billingUi";
import { isExportDrawerServiceType } from "@/lib/jobs/exportDrawerUi";

export interface ActivityServiceIconProps {
  serviceType: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ActivityServiceIcon({
  serviceType,
  size = 16,
  strokeWidth = 2,
  className,
}: ActivityServiceIconProps) {
  if (isExportDrawerServiceType(serviceType)) {
    return <ExportDrawerIcon size={size} className={className} />;
  }
  if (isBillingServiceType(serviceType)) {
    return <BillingIcon size={size} className={className} />;
  }
  const Icon = activityServiceIcon(serviceType);
  return (
    <Icon
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden
    />
  );
}
