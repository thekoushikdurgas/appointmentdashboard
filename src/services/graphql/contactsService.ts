import {
  graphqlQuery,
  graphqlMutation,
  type GraphQLRequestOptions,
} from "@/lib/graphqlClient";
import type {
  VqlQueryInput,
  SchedulerJob,
  ContactFilter,
  ContactFilterData,
  CreateContactInput,
  UpdateContactInput,
  CreateContact360ExportInput,
  CreateContact360ImportInput,
  ContactFilterDataInput,
} from "@/graphql/generated/types";
import { contactUuidFilterCondition } from "@/lib/contactUuidFilter";
import {
  CONTACTS_LIST_QUERY,
  CONTACT_ONE_QUERY,
  CONTACT_COUNT_QUERY,
  CONTACT_QUERY_STRICT,
  CONTACTS_FILTERS_QUERY,
  CONTACT_FILTER_DATA_QUERY,
  CONTACT_GEO_ANALYTICS_QUERY,
  CREATE_CONTACT_MUTATION,
  UPDATE_CONTACT_MUTATION,
  DELETE_CONTACT_MUTATION,
  BATCH_CREATE_CONTACTS_MUTATION,
  EXPORT_CONTACTS_MUTATION,
  IMPORT_CONTACTS_MUTATION,
} from "@/graphql/contactsOperations";

export type { SchedulerJob as ContactsExportJobRef };
export type {
  CreateContactInput,
  UpdateContactInput,
  CreateContact360ExportInput,
  CreateContact360ImportInput,
  ContactFilterDataInput,
} from "@/graphql/generated/types";
/** @deprecated Use VqlQueryInput from generated/types */
export type VQLQueryInput = VqlQueryInput;

export interface Contact {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  emailStatus?: string;
  title?: string;
  company?: string;
  companyId?: string;
  /** LinkedIn / Connectra logo when populated on list query. */
  companyLogoUrl?: string;
  /** Company website for favicon fallback in the table. */
  companyWebsite?: string;
  location?: string;
  country?: string | null;
  linkedinUrl?: string;
  phone?: string;
  seniority?: string;
  stage?: string;
  departments?: string[];
  workDirectPhone?: string;
  homePhone?: string;
  otherPhone?: string;
  website?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  linkedinSalesUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactRow {
  uuid: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  title: string | null;
  companyUuid: string | null;
  /** Denormalized on contact index when company join is not populated. */
  companyName?: string | null;
  company?: {
    uuid?: string | null;
    name?: string | null;
    profilePic?: string | null;
    website?: string | null;
  } | null;
  emailStatus: string | null;
  linkedinUrl: string | null;
  mobilePhone: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  seniority?: string | null;
  stage?: string | null;
  departments?: string[] | null;
  workDirectPhone?: string | null;
  homePhone?: string | null;
  otherPhone?: string | null;
  website?: string | null;
  facebookUrl?: string | null;
  twitterUrl?: string | null;
  linkedinSalesUrl?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

function mapContact(r: ContactRow): Contact {
  const fn = r.firstName ?? "";
  const ln = r.lastName ?? "";
  const name = [fn, ln].filter(Boolean).join(" ").trim() || r.email || r.uuid;
  const loc = [r.city, r.state, r.country].filter(Boolean).join(", ");
  const companyName =
    r.company?.name?.trim() || r.companyName?.trim() || undefined;
  const companyIdRaw = r.companyUuid ?? r.company?.uuid ?? null;
  const companyLogoUrl = r.company?.profilePic?.trim() || undefined;
  const companyWebsite = r.company?.website?.trim() || undefined;
  return {
    id: r.uuid,
    name,
    firstName: r.firstName ?? undefined,
    lastName: r.lastName ?? undefined,
    email: r.email ?? undefined,
    emailStatus: r.emailStatus ?? undefined,
    title: r.title ?? undefined,
    company: companyName,
    companyId: companyIdRaw ?? undefined,
    companyLogoUrl,
    companyWebsite,
    location: loc || undefined,
    country: r.country,
    linkedinUrl: r.linkedinUrl ?? undefined,
    phone: r.mobilePhone ?? undefined,
    seniority: r.seniority ?? undefined,
    stage: r.stage ?? undefined,
    departments: r.departments?.filter(Boolean) ?? undefined,
    workDirectPhone: r.workDirectPhone ?? undefined,
    homePhone: r.homePhone ?? undefined,
    otherPhone: r.otherPhone ?? undefined,
    website: r.website ?? undefined,
    facebookUrl: r.facebookUrl ?? undefined,
    twitterUrl: r.twitterUrl ?? undefined,
    linkedinSalesUrl: r.linkedinSalesUrl ?? undefined,
    createdAt: r.createdAt ?? "",
    updatedAt: r.updatedAt ?? "",
  };
}

export type ContactsListQuery = VqlQueryInput;

export interface ContactListResult {
  items: Contact[];
  total: number;
  limit: number;
  offset: number;
  /** Pass as ``searchAfter`` on the next request (cursor mode). */
  nextSearchAfter?: string[] | null;
}

/** VQL-scoped geo bucket (GraphQL ``ContactGeoBucket``). */
export interface ContactGeoBucket {
  value: string;
  displayValue: string;
  count: number;
  cities?: ContactGeoBucket[] | null;
}

/** Result of ``contactGeoAnalytics`` (Connectra-backed). */
export interface ContactGeoAnalyticsResult {
  total: number;
  unmappedCount: number;
  sumOtherDocCount: number;
  countries: ContactGeoBucket[];
}

async function fetchConnection(
  data: Promise<{
    contacts: {
      contacts: {
        items: ContactRow[];
        total: number;
        limit: number;
        offset: number;
        nextSearchAfter?: string[] | null;
      };
    };
  }>,
): Promise<ContactListResult> {
  const resolved = await data;
  const conn = resolved.contacts.contacts;
  const items = conn.items.map(mapContact);
  // #region agent log
  const sample = conn.items[0];
  if (sample) {
    fetch("http://127.0.0.1:7300/ingest/efacfcad-0428-4256-933c-cee6eb66f540", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "c73258",
      },
      body: JSON.stringify({
        sessionId: "c73258",
        runId: "company-col",
        hypothesisId: "C1",
        location: "contactsService.ts:fetchConnection",
        message: "contact list company field sample",
        data: {
          mappedCompany: items[0]?.company ?? null,
          mappedLogoUrl: items[0]?.companyLogoUrl ?? null,
          rawProfilePic: sample.company?.profilePic ?? null,
          rawCompanyName: sample.company?.name ?? null,
          rawCompanyUuid: sample.companyUuid ?? null,
          itemCount: items.length,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }
  // #endregion
  return {
    items,
    total: conn.total,
    limit: conn.limit,
    offset: conn.offset,
    nextSearchAfter: conn.nextSearchAfter ?? null,
  };
}

const GQL_SILENT: GraphQLRequestOptions = { showToastOnError: false };

export type ContactGetOptions = GraphQLRequestOptions & {
  /** When true, returns null on not-found instead of throwing (avoids dev error overlay). */
  notFoundReturnsNull?: boolean;
  /** Row from the contacts table (email / company) when uuid keyword lookup misses. */
  listHint?: Pick<Contact, "email" | "companyId" | "firstName" | "lastName">;
};

export { contactUuidFilterCondition } from "@/lib/contactUuidFilter";

export const contactsService = {
  list: async (
    query?: ContactsListQuery,
    options?: GraphQLRequestOptions,
  ): Promise<ContactListResult> => {
    return fetchConnection(
      graphqlQuery<{
        contacts: {
          contacts: {
            items: ContactRow[];
            total: number;
            limit: number;
            offset: number;
          };
        };
      }>(CONTACTS_LIST_QUERY, { query: query ?? {} }, options),
    );
  },

  /** Same VQL as `list`, count only (no items). */
  count: async (query?: VqlQueryInput): Promise<number> => {
    const data = await graphqlQuery<{
      contacts: { contactCount: number };
    }>(CONTACT_COUNT_QUERY, { query: query ?? {} });
    return data.contacts.contactCount;
  },

  /** Non-null `query` path — @see ContactQueryContactQueryArgs */
  contactQuery: async (query: VqlQueryInput): Promise<ContactListResult> => {
    const data = await graphqlQuery<{
      contacts: {
        contactQuery: {
          items: ContactRow[];
          total: number;
          limit: number;
          offset: number;
        };
      };
    }>(CONTACT_QUERY_STRICT, { query });
    const conn = data.contacts.contactQuery;
    return {
      items: conn.items.map(mapContact),
      total: conn.total,
      limit: conn.limit,
      offset: conn.offset,
    };
  },

  get: async (
    uuid: string,
    options?: ContactGetOptions,
  ): Promise<Contact | null> => {
    const contactUuid = uuid.trim();
    const gqlOpts: GraphQLRequestOptions = {
      showToastOnError: options?.showToastOnError ?? true,
    };
    const returnNullOnNotFound = options?.notFoundReturnsNull === true;
    const isNotFoundMessage = (msg: string) =>
      msg.toLowerCase().includes("not found");

    const fetchViaListCohort = async (
      filterField: "uuid" | "id" | "email",
      value: string,
    ): Promise<Contact | null> => {
      const result = await contactsService.list(
        {
          filters: {
            conditions: [contactUuidFilterCondition(filterField, value)],
          },
          limit: 1,
          offset: 0,
        },
        GQL_SILENT,
      );
      return result.items[0] ?? null;
    };

    const fetchViaListFallbacks = async (): Promise<Contact | null> => {
      for (const filterField of ["uuid", "id"] as const) {
        const hit = await fetchViaListCohort(filterField, contactUuid);
        if (hit) return hit;
      }
      const email = options?.listHint?.email?.trim().toLowerCase();
      if (email) {
        const byEmail = await fetchViaListCohort("email", email);
        if (byEmail) {
          // #region agent log
          fetch(
            "http://127.0.0.1:7300/ingest/efacfcad-0428-4256-933c-cee6eb66f540",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Debug-Session-Id": "c73258",
              },
              body: JSON.stringify({
                sessionId: "c73258",
                runId: "contact-detail",
                hypothesisId: "D8",
                location: "contactsService.ts:get:emailFallback",
                message: "contact loaded via list email VQL fallback",
                data: {
                  requestedUuid: contactUuid,
                  contactId: byEmail.id,
                  email,
                },
                timestamp: Date.now(),
              }),
            },
          ).catch(() => {});
          // #endregion
          return byEmail;
        }
      }
      return null;
    };

    try {
      const data = await graphqlQuery<{
        contacts: { contact: ContactRow };
      }>(CONTACT_ONE_QUERY, { uuid: contactUuid }, gqlOpts);
      const mapped = mapContact(data.contacts.contact);
      // #region agent log
      fetch(
        "http://127.0.0.1:7300/ingest/efacfcad-0428-4256-933c-cee6eb66f540",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "c73258",
          },
          body: JSON.stringify({
            sessionId: "c73258",
            runId: "contact-detail",
            hypothesisId: "D1",
            location: "contactsService.ts:get:direct",
            message: "contact loaded via contact(uuid)",
            data: { uuid: contactUuid, contactId: mapped.id },
            timestamp: Date.now(),
          }),
        },
      ).catch(() => {});
      // #endregion
      return mapped;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!isNotFoundMessage(msg)) throw err;
      const fallback = await fetchViaListFallbacks();
      if (fallback) {
        // #region agent log
        fetch(
          "http://127.0.0.1:7300/ingest/efacfcad-0428-4256-933c-cee6eb66f540",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Debug-Session-Id": "c73258",
            },
            body: JSON.stringify({
              sessionId: "c73258",
              runId: "contact-detail",
              hypothesisId: "D3",
              location: "contactsService.ts:get:listFallback",
              message: "contact loaded via list VQL fallback",
              data: {
                requestedUuid: contactUuid,
                contactId: fallback.id,
              },
              timestamp: Date.now(),
            }),
          },
        ).catch(() => {});
        // #endregion
        return fallback;
      }
      // #region agent log
      fetch(
        "http://127.0.0.1:7300/ingest/efacfcad-0428-4256-933c-cee6eb66f540",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "c73258",
          },
          body: JSON.stringify({
            sessionId: "c73258",
            runId: "contact-detail",
            hypothesisId: "D4",
            location: "contactsService.ts:get:listFallback",
            message: "list VQL fallback returned no rows",
            data: { requestedUuid: contactUuid },
            timestamp: Date.now(),
          }),
        },
      ).catch(() => {});
      // #endregion
      if (returnNullOnNotFound) return null;
      throw err;
    }
  },

  create: async (input: CreateContactInput): Promise<Contact> => {
    const data = await graphqlMutation<{
      contacts: { createContact: ContactRow };
    }>(CREATE_CONTACT_MUTATION, { input });
    return mapContact(data.contacts.createContact);
  },

  update: async (uuid: string, input: UpdateContactInput): Promise<Contact> => {
    const data = await graphqlMutation<{
      contacts: { updateContact: ContactRow };
    }>(UPDATE_CONTACT_MUTATION, { uuid, input });
    return mapContact(data.contacts.updateContact);
  },

  batchCreate: (contacts: CreateContactInput[]) =>
    graphqlMutation<{ contacts: { batchCreateContacts: ContactRow[] } }>(
      BATCH_CREATE_CONTACTS_MUTATION,
      { input: { contacts } },
    ).then((d) => d.contacts.batchCreateContacts.map(mapContact)),

  exportContacts: (input: CreateContact360ExportInput) =>
    graphqlMutation<{ contacts: { exportContacts: SchedulerJob } }>(
      EXPORT_CONTACTS_MUTATION,
      { input },
    ).then((d) => d.contacts.exportContacts),

  importContacts: (input: CreateContact360ImportInput) =>
    graphqlMutation<{ contacts: { importContacts: SchedulerJob } }>(
      IMPORT_CONTACTS_MUTATION,
      { input },
    ).then((d) => d.contacts.importContacts),

  getFilters: () =>
    graphqlQuery<{
      contacts: { filters: { items: ContactFilter[]; total: number } };
    }>(CONTACTS_FILTERS_QUERY),

  /** Paginated filter facet values; pass `page`, `limit`, `searchText` as needed. */
  filterData: async (
    input: ContactFilterDataInput,
  ): Promise<{ items: ContactFilterData[]; total: number }> => {
    const data = await graphqlQuery<{
      contacts: {
        filterData: { items: ContactFilterData[]; total: number };
      };
    }>(CONTACT_FILTER_DATA_QUERY, { input });
    const fd = data.contacts.filterData;
    return { items: fd.items, total: fd.total };
  },

  /**
   * VQL-scoped country/city counts for the World Map (same filter scope as the list).
   */
  geoAnalytics: async (args: {
    query?: VqlQueryInput | null;
    includeCities?: boolean;
  }): Promise<ContactGeoAnalyticsResult> => {
    const data = await graphqlQuery<{
      contacts: { contactGeoAnalytics: ContactGeoAnalyticsResult };
    }>(
      CONTACT_GEO_ANALYTICS_QUERY,
      {
        query: args.query ?? null,
        includeCities: args.includeCities ?? false,
      },
      { showToastOnError: false },
    );
    return data.contacts.contactGeoAnalytics;
  },

  delete: (uuid: string) =>
    graphqlMutation<{ contacts: { deleteContact: boolean } }>(
      DELETE_CONTACT_MUTATION,
      { uuid },
    ),
};
