import { graphqlMutation } from "@/lib/graphqlClient";
import type {
  LinkedInSearchResponse,
  LinkedInUpsertInput as GqlLinkedInUpsertInput,
  LinkedInUpsertResponse,
} from "@/graphql/generated/types";

export type {
  LinkedInSearchResponse,
  LinkedInUpsertResponse,
  ContactWithRelations,
  CompanyWithRelations,
} from "@/graphql/generated/types";

const SEARCH = `mutation LinkedInSearchGateway($input: LinkedInSearchInput!) {
  linkedin {
    search(input: $input) {
      contacts {
        contact {
          uuid
          firstName
          lastName
          email
          title
        }
        metadata {
          linkedinUrl
          city
          state
          country
        }
        company {
          uuid
          name
        }
      }
      companies {
        company {
          uuid
          name
        }
        metadata {
          linkedinUrl
        }
      }
      totalContacts
      totalCompanies
    }
  }
}`;

const UPSERT = `mutation LinkedInUpsertGateway($input: LinkedInUpsertInput!) {
  linkedin {
    upsertByLinkedInUrl(input: $input) {
      success
      created
      errors
      contact {
        contact {
          uuid
          firstName
          lastName
        }
        metadata {
          linkedinUrl
        }
      }
      company {
        company {
          uuid
          name
        }
        metadata {
          linkedinUrl
        }
      }
    }
  }
}`;

export interface ContactData {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  title?: string | null;
  phone?: string | null;
}

export interface ContactMetadata {
  linkedinUrl?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}

export interface CompanyData {
  name?: string | null;
  domain?: string | null;
}

export interface CompanyMetadata {
  linkedinUrl?: string | null;
}

/** App-friendly payload; at least one JSON blob required by the API. */
export interface LinkedInUpsertPayload {
  url: string;
  contactData?: ContactData | null;
  contactMetadata?: ContactMetadata | null;
  companyData?: CompanyData | null;
  companyMetadata?: CompanyMetadata | null;
}

function toGqlUpsertInput(
  payload: LinkedInUpsertPayload,
): GqlLinkedInUpsertInput {
  return {
    url: payload.url,
    contactData: (payload.contactData ?? undefined) as
      | GqlLinkedInUpsertInput["contactData"]
      | undefined,
    contactMetadata: (payload.contactMetadata ?? undefined) as
      | GqlLinkedInUpsertInput["contactMetadata"]
      | undefined,
    companyData: (payload.companyData ?? undefined) as
      | GqlLinkedInUpsertInput["companyData"]
      | undefined,
    companyMetadata: (payload.companyMetadata ?? undefined) as
      | GqlLinkedInUpsertInput["companyMetadata"]
      | undefined,
  };
}

export const linkedinService = {
  searchByUrl: (url: string) =>
    graphqlMutation<{ linkedin: { search: LinkedInSearchResponse } }>(SEARCH, {
      input: { url },
    }),

  upsertByLinkedInUrl: (payload: LinkedInUpsertPayload) =>
    graphqlMutation<{
      linkedin: { upsertByLinkedInUrl: LinkedInUpsertResponse };
    }>(UPSERT, { input: toGqlUpsertInput(payload) }),
};
