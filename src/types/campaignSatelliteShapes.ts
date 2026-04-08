/**
 * Shapes parsed from `campaignSatellite` JSON scalars (not first-class GraphQL object types).
 */

export interface CampaignSatelliteCampaign {
  uuid?: string;
  createdAt?: string | null;
  campaignData?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface CampaignSatelliteSequence {
  id?: string;
  name?: string;
  status?: string;
  /** Count or step objects from satellite JSON — see `sequenceStepCount`. */
  steps?: number | unknown[];
  activeContacts?: number;
  createdAt?: string;
  [key: string]: unknown;
}

export interface CampaignSatelliteTemplate {
  id?: string;
  name?: string;
  category?: string;
  subject?: string;
  createdAt?: string;
  body?: string;
  /** From REST / satellite when exposed (see module 25). */
  is_ai_generated?: boolean;
  [key: string]: unknown;
}
