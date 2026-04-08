import type { CampaignSatelliteTemplate } from "@/types/campaignSatelliteShapes";

/** Normalized row for template grid / pickers (from satellite JSON). */
export interface TemplateListRow {
  id: string;
  name: string;
  subject?: string;
  category?: string;
  isAiGenerated: boolean;
  createdAt?: string;
  raw: CampaignSatelliteTemplate;
}

/** HTML or text body from satellite payload (field names vary by service). */
export function templateHtmlBody(t: CampaignSatelliteTemplate): string {
  const x = t as Record<string, unknown>;
  const body = t.body ?? x.html_body ?? x.htmlBody ?? x.content ?? x.html ?? "";
  return typeof body === "string" ? body : "";
}

export function mapTemplateSatelliteToRow(
  item: CampaignSatelliteTemplate,
  index: number,
): TemplateListRow {
  const x = item as Record<string, unknown>;
  const id = String(item.id ?? x.uuid ?? `tpl-${index}`);
  const name = String(
    item.name ?? x.title ?? x.name ?? `Template ${index + 1}`,
  );
  const subject =
    item.subject != null
      ? String(item.subject)
      : x.subject != null
        ? String(x.subject)
        : x.subject_hint != null
          ? String(x.subject_hint)
          : undefined;
  const category =
    item.category != null
      ? String(item.category)
      : x.category != null
        ? String(x.category)
        : undefined;
  const isAiGenerated = Boolean(
    x.is_ai_generated ?? x.isAiGenerated ?? item.is_ai_generated,
  );
  const createdAt =
    typeof item.createdAt === "string"
      ? item.createdAt
      : typeof x.created_at === "string"
        ? x.created_at
        : undefined;

  return {
    id,
    name,
    subject,
    category,
    isAiGenerated,
    createdAt,
    raw: item,
  };
}
