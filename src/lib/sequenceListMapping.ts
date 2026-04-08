import type { CampaignSatelliteSequence } from "@/types/campaignSatelliteShapes";

/** Normalized row for Sequences list UI (from satellite JSON). */
export interface SequenceListRow {
  id: string;
  name: string;
  status: string;
  stepCount: number;
  activeContacts: number;
  createdAt?: string;
  raw: CampaignSatelliteSequence;
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** `steps` may be a count, an array of step objects, or snake_case fields from REST. */
export function sequenceStepCount(seq: CampaignSatelliteSequence): number {
  const s = seq.steps;
  if (Array.isArray(s)) return s.length;
  if (typeof s === "number" && Number.isFinite(s)) return s;
  const x = seq as Record<string, unknown>;
  const sc = x.step_count ?? x.stepCount;
  if (typeof sc === "number" && Number.isFinite(sc)) return sc;
  return num(s);
}

export function sequenceActiveContacts(seq: CampaignSatelliteSequence): number {
  const x = seq as Record<string, unknown>;
  const v = seq.activeContacts ?? x.active_recipients ?? x.recipient_count;
  return num(v);
}

export function sequenceDisplayName(
  seq: CampaignSatelliteSequence,
  index: number,
): string {
  const x = seq as Record<string, unknown>;
  return String(
    seq.name ?? x.title ?? x.sequence_name ?? `Sequence ${index + 1}`,
  );
}

export function sequenceId(
  seq: CampaignSatelliteSequence,
  index: number,
): string {
  const x = seq as Record<string, unknown>;
  return String(seq.id ?? x.uuid ?? `seq-${index}`);
}

export function mapSequenceSatelliteToRow(
  item: CampaignSatelliteSequence,
  index: number,
): SequenceListRow {
  const x = item as Record<string, unknown>;
  const status = String(item.status ?? x.state ?? "draft").toLowerCase();
  const created =
    typeof item.createdAt === "string"
      ? item.createdAt
      : typeof x.created_at === "string"
        ? x.created_at
        : undefined;

  return {
    id: sequenceId(item, index),
    name: sequenceDisplayName(item, index),
    status,
    stepCount: sequenceStepCount(item),
    activeContacts: sequenceActiveContacts(item),
    createdAt: created,
    raw: item,
  };
}
