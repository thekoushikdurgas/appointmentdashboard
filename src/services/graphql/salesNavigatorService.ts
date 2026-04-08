import { graphqlQuery, graphqlMutation } from "@/lib/graphqlClient";
import type {
  SaveProfilesResponse as GqlSaveProfilesResponse,
  UserScrapingRecord as GqlUserScrapingRecord,
} from "@/graphql/generated/types";

/** Scraping metadata row — matches live `UserScrapingRecord` (JSON blobs optional). */
export type UserScrapingRecord = GqlUserScrapingRecord;

export type SaveProfilesResponse = GqlSaveProfilesResponse;

const RECORDS = `query SalesNavRecords($filters: SalesNavigatorFilterInput) {
  salesNavigator {
    salesNavigatorRecords(filters: $filters) {
      items {
        id
        userId
        timestamp
        version
        source
        searchContext
        pagination
        userInfo
        applicationInfo
        createdAt
        updatedAt
      }
      pageInfo {
        total
        limit
        offset
        hasNext
        hasPrevious
      }
    }
  }
}`;

/**
 * App-friendly profile form / extension payload.
 * Mapped to snake_case for the satellite via {@link toSatelliteProfileJson}.
 */
export interface SalesNavigatorProfile {
  name: string;
  title?: string | null;
  company?: string | null;
  location?: string | null;
  profileUrl?: string | null;
  companyUrl?: string | null;
  connectionDegree?: string | null;
  email?: string | null;
  mobilePhone?: string | null;
  imageUrl?: string | null;
}

export { SALES_NAV_SAVE_MAX_PROFILES } from "@/lib/salesNavigatorBulk";

/** Maps camelCase UI fields to satellite snake_case JSON. */
export function toSatelliteProfileJson(
  profile: SalesNavigatorProfile,
): Record<string, unknown> {
  const o: Record<string, unknown> = {
    name: profile.name,
    title: profile.title ?? null,
    company: profile.company ?? null,
    location: profile.location ?? null,
    profile_url: profile.profileUrl ?? null,
    image_url: profile.imageUrl ?? null,
  };
  if (profile.companyUrl != null && profile.companyUrl !== "")
    o.company_url = profile.companyUrl;
  if (profile.connectionDegree != null && profile.connectionDegree !== "")
    o.connection_degree = profile.connectionDegree;
  if (profile.email != null && profile.email !== "") o.email = profile.email;
  if (profile.mobilePhone != null && profile.mobilePhone !== "")
    o.mobile_phone = profile.mobilePhone;
  return o;
}

const SAVE_PROFILES = `mutation SalesNavSaveProfiles($input: SaveProfilesInput!) {
  salesNavigator {
    saveSalesNavigatorProfiles(input: $input) {
      success
      totalProfiles
      savedCount
      errors
    }
  }
}`;

type SaveMutationResult = {
  salesNavigator: {
    saveSalesNavigatorProfiles: SaveProfilesResponse;
  };
};

function saveProfilesJson(profiles: Array<Record<string, unknown>>) {
  return graphqlMutation<SaveMutationResult>(SAVE_PROFILES, {
    input: { profiles },
  });
}

export const salesNavigatorService = {
  listRecords: (filters?: { limit?: number; offset?: number }) =>
    graphqlQuery<{
      salesNavigator: {
        salesNavigatorRecords: {
          items: UserScrapingRecord[];
          pageInfo: {
            total: number;
            limit: number;
            offset: number;
            hasNext: boolean;
            hasPrevious: boolean;
          };
        };
      };
    }>(RECORDS, {
      filters: {
        limit: filters?.limit ?? 50,
        offset: filters?.offset ?? 0,
      },
    }),

  /**
   * `SaveProfilesInput` only includes `profiles` (JSON array, max 1000).
   * Each object should use snake_case keys expected by the satellite.
   */
  saveSalesNavigatorProfiles: (input: {
    profiles: Array<Record<string, unknown>>;
  }) => saveProfilesJson(input.profiles),

  /** Typed UI profiles → snake_case JSON. */
  saveProfilesFromForms: (input: { profiles: SalesNavigatorProfile[] }) =>
    saveProfilesJson(input.profiles.map(toSatelliteProfileJson)),

  /** @deprecated Alias for `saveProfilesFromForms`. */
  saveProfiles: (input: { profiles: SalesNavigatorProfile[] }) =>
    saveProfilesJson(input.profiles.map(toSatelliteProfileJson)),
};
