import { graphqlQuery } from "@/lib/graphqlClient";
import type {
  CampaignSatelliteCampaign,
  CampaignSatelliteSequence,
  CampaignSatelliteTemplate,
} from "@/types/campaignSatelliteShapes";

/**
 * Normalize satellite JSON that may come as:
 * - a bare array: [{ id, name, ... }]
 * - wrapped object: { campaigns: [...] }  /  { data: [...] }  /  { items: [...] }
 */
function extractArray<T>(raw: unknown, ...keys: string[]): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object") {
    for (const key of keys) {
      const candidate = (raw as Record<string, unknown>)[key];
      if (Array.isArray(candidate)) return candidate as T[];
    }
  }
  return [];
}

export function parseCampaigns(raw: unknown): CampaignSatelliteCampaign[] {
  return extractArray<CampaignSatelliteCampaign>(
    raw,
    "campaigns",
    "data",
    "items",
  );
}

export function parseSequences(raw: unknown): CampaignSatelliteSequence[] {
  return extractArray<CampaignSatelliteSequence>(
    raw,
    "sequences",
    "data",
    "items",
  );
}

/** Alias for docs / callers that refer to `parseSequencesJson`. */
export const parseSequencesJson = parseSequences;

export function parseCampaignTemplates(
  raw: unknown,
): CampaignSatelliteTemplate[] {
  return extractArray<CampaignSatelliteTemplate>(
    raw,
    "campaign_templates",
    "campaignTemplates",
    "templates",
    "data",
    "items",
  );
}

/** Alias for docs / callers that refer to `parseCampaignTemplatesJson`. */
export const parseCampaignTemplatesJson = parseCampaignTemplates;

/**
 * Optional CAMPAIGN_API_URL satellite — gateway returns JSON lists (may be empty).
 */
export const campaignSatelliteService = {
  listCampaigns: (): Promise<{ campaignSatellite: { campaigns: unknown } }> =>
    graphqlQuery(
      `query CampaignSatelliteCampaigns {
        campaignSatellite {
          campaigns
        }
      }`,
    ),

  listSequences: (): Promise<{ campaignSatellite: { sequences: unknown } }> =>
    graphqlQuery(
      `query CampaignSatelliteSequences {
        campaignSatellite {
          sequences
        }
      }`,
    ),

  listTemplates: (): Promise<{
    campaignSatellite: { campaignTemplates: unknown };
  }> =>
    graphqlQuery(
      `query CampaignSatelliteTemplates {
        campaignSatellite {
          campaignTemplates
        }
      }`,
    ),

  getSequence: (
    id: string,
  ): Promise<{ campaignSatellite: { sequence: unknown } }> =>
    graphqlQuery(
      `query CampaignSatelliteSequence($id: String!) {
        campaignSatellite {
          sequence(id: $id)
        }
      }`,
      { id },
    ),

  /** One round-trip for hub/dashboard summaries (same JSON scalars). */
  fetchSatelliteBundle: (): Promise<{
    campaignSatellite: {
      campaigns: unknown;
      sequences: unknown;
      campaignTemplates: unknown;
    };
  }> =>
    graphqlQuery(
      `query CampaignSatelliteBundle {
        campaignSatellite {
          campaigns
          sequences
          campaignTemplates
        }
      }`,
    ),

  /** POST /cql/parse — audience/query DSL for campaigns. */
  cqlParse: (
    query: string,
    target?: string | null,
  ): Promise<{ campaignSatellite: { cqlParse: unknown } }> =>
    graphqlQuery(
      `query CampaignCqlParse($query: String!, $target: String) {
        campaignSatellite {
          cqlParse(query: $query, target: $target)
        }
      }`,
      { query, target: target ?? null },
    ),

  /** POST /cql/validate — `cql` must be a JSON object (parsed AST or similar). */
  cqlValidate: (
    cql: Record<string, unknown>,
  ): Promise<{ campaignSatellite: { cqlValidate: unknown } }> =>
    graphqlQuery(
      `query CampaignCqlValidate($cql: JSON!) {
        campaignSatellite {
          cqlValidate(cql: $cql)
        }
      }`,
      { cql },
    ),
};
