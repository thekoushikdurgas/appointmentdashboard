"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import type { CampaignSatelliteCampaign } from "@/types/campaignSatelliteShapes";

interface CampaignRowProps {
  campaign: CampaignSatelliteCampaign;
  onClick?: (id: string) => void;
}

function statusColor(
  status: string,
): "green" | "yellow" | "red" | "blue" | "gray" {
  const s = String(status).toLowerCase();
  if (s === "active" || s === "running") return "green";
  if (s === "paused") return "yellow";
  if (s === "failed" || s === "stopped") return "red";
  if (s === "draft") return "blue";
  return "gray";
}

export function CampaignRow({ campaign, onClick }: CampaignRowProps) {
  const data = campaign.campaignData as {
    name?: string;
    status?: string;
    description?: string;
  } | null;
  const name = data?.name ?? campaign.uuid ?? "Campaign";
  const status = data?.status ?? "draft";

  return (
    <tr
      className={cn("c360-table__row", onClick && "c360-cursor-pointer")}
      onClick={() => onClick?.(String(campaign.uuid ?? ""))}
    >
      <td className="c360-table__cell">{name}</td>
      <td className="c360-table__cell">
        <Badge color={statusColor(status)}>{status}</Badge>
      </td>
      <td className="c360-table__cell c360-text-muted">
        {data?.description ?? "—"}
      </td>
      <td className="c360-table__cell c360-text-muted">
        {campaign.createdAt
          ? new Date(campaign.createdAt).toLocaleDateString()
          : "—"}
      </td>
    </tr>
  );
}
