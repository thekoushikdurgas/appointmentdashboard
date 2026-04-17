import { graphqlQuery, graphqlMutation } from "@/lib/graphqlClient";
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
import {
  CONTACTS_LIST_QUERY,
  CONTACT_ONE_QUERY,
  CONTACT_COUNT_QUERY,
  CONTACT_QUERY_STRICT,
  CONTACTS_FILTERS_QUERY,
  CONTACT_FILTER_DATA_QUERY,
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
  location?: string;
  country?: string | null;
  linkedinUrl?: string;
  phone?: string;
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
  emailStatus: string | null;
  linkedinUrl: string | null;
  mobilePhone: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

function mapContact(r: ContactRow): Contact {
  const fn = r.firstName ?? "";
  const ln = r.lastName ?? "";
  const name = [fn, ln].filter(Boolean).join(" ").trim() || r.email || r.uuid;
  const loc = [r.city, r.state, r.country].filter(Boolean).join(", ");
  return {
    id: r.uuid,
    name,
    firstName: r.firstName ?? undefined,
    lastName: r.lastName ?? undefined,
    email: r.email ?? undefined,
    emailStatus: r.emailStatus ?? undefined,
    title: r.title ?? undefined,
    companyId: r.companyUuid ?? undefined,
    location: loc || undefined,
    country: r.country,
    linkedinUrl: r.linkedinUrl ?? undefined,
    phone: r.mobilePhone ?? undefined,
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
  return {
    items: conn.items.map(mapContact),
    total: conn.total,
    limit: conn.limit,
    offset: conn.offset,
    nextSearchAfter: conn.nextSearchAfter ?? null,
  };
}

export const contactsService = {
  list: async (query?: ContactsListQuery): Promise<ContactListResult> => {
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
      }>(CONTACTS_LIST_QUERY, { query: query ?? {} }),
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

  get: async (uuid: string) => {
    const data = await graphqlQuery<{
      contacts: { contact: ContactRow };
    }>(CONTACT_ONE_QUERY, { uuid });
    return mapContact(data.contacts.contact);
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

  delete: (uuid: string) =>
    graphqlMutation<{ contacts: { deleteContact: boolean } }>(
      DELETE_CONTACT_MUTATION,
      { uuid },
    ),
};
