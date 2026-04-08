import type { CampaignSatelliteCampaign } from "@/types/campaignSatelliteShapes";

/** UI status bucket aligned with `/campaigns` table badges. */
export type CampaignListStatus =
  | "draft"
  | "active"
  | "paused"
  | "completed"
  | "failed";

export interface CampaignListRow {
  id: string;
  name: string;
  status: CampaignListStatus;
  recipients: number;
  sent: number;
  opened: number;
  clicked: number;
  createdAt: string;
  scheduledAt?: string;
}

function normalizeStatus(raw: unknown): CampaignListStatus {
  const s = String(raw ?? "")
    .toLowerCase()
    .trim();
  if (["active", "sending", "running"].includes(s)) return "active";
  if (["paused", "stopped"].includes(s)) return "paused";
  if (["completed", "complete", "done", "completed_with_errors"].includes(s)) {
    return "completed";
  }
  if (["failed", "error", "cancelled", "canceled"].includes(s)) return "failed";
  if (["draft", "pending", "scheduled"].includes(s)) return "draft";
  return "draft";
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Map one satellite JSON object (from `parseCampaigns`) to a table row.
 * Handles nested `campaignData` and common metric field names.
 */
export function mapCampaignSatelliteToListRow(
  item: CampaignSatelliteCampaign,
  index: number,
): CampaignListRow {
  const x = item as Record<string, unknown>;
  const cd = (item.campaignData ?? x.campaign_data ?? x.campaignData) as
    | Record<string, unknown>
    | undefined;
  const metrics = (cd?.metrics ?? x.metrics) as
    | Record<string, unknown>
    | undefined;

  const name = String(
    x.name ?? x.title ?? cd?.name ?? cd?.title ?? `Campaign ${index + 1}`,
  );

  const id = String(
    x.id ?? x.uuid ?? x.campaign_id ?? cd?.id ?? `idx-${index}`,
  );

  return {
    id,
    name,
    status: normalizeStatus(x.status ?? cd?.status),
    recipients: num(
      x.recipients ??
        x.recipientCount ??
        x.total_recipients ??
        cd?.recipients ??
        metrics?.recipients,
    ),
    sent: num(x.sent ?? x.sent_count ?? cd?.sent ?? metrics?.sent),
    opened: num(x.opened ?? x.opens ?? cd?.opened ?? metrics?.opened),
    clicked: num(x.clicked ?? x.clicks ?? cd?.clicked ?? metrics?.clicked),
    createdAt: String(
      x.createdAt ?? x.created_at ?? cd?.createdAt ?? new Date().toISOString(),
    ),
    scheduledAt: x.scheduledAt
      ? String(x.scheduledAt)
      : x.scheduled_at
        ? String(x.scheduled_at)
        : cd?.scheduledAt
          ? String(cd.scheduledAt)
          : undefined,
  };
}
