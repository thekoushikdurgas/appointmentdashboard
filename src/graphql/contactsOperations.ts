/**
 * GraphQL documents for `query.contacts` / `mutation.contacts`.
 * Variable shapes match `ContactQuery*` / `ContactMutation*` in `graphql/generated/types.ts`.
 */

export const CONTACT_LIST_FIELDS = `
  uuid
  firstName
  lastName
  email
  title
  companyUuid
  emailStatus
  linkedinUrl
  mobilePhone
  city
  state
  country
  createdAt
  updatedAt
` as const;

export const CONTACTS_LIST_QUERY = `
  query ContactsGateway($query: VQLQueryInput) {
    contacts {
      contacts(query: $query) {
        items { ${CONTACT_LIST_FIELDS} }
        total
        limit
        offset
      }
    }
  }
`;

export const CONTACT_ONE_QUERY = `
  query ContactGateway($uuid: ID!) {
    contacts {
      contact(uuid: $uuid) {
        ${CONTACT_LIST_FIELDS}
      }
    }
  }
`;

export const CONTACT_COUNT_QUERY = `
  query ContactCountGateway($query: VQLQueryInput) {
    contacts {
      contactCount(query: $query)
    }
  }
`;

export const CONTACT_QUERY_STRICT = `
  query ContactQueryStrict($query: VQLQueryInput!) {
    contacts {
      contactQuery(query: $query) {
        items { ${CONTACT_LIST_FIELDS} }
        total
        limit
        offset
      }
    }
  }
`;

export const CONTACTS_FILTERS_QUERY = `
  query ContactsFilters {
    contacts {
      filters {
        items {
          id
          key
          filterKey
          filterType
          displayName
          active
          service
          directDerived
        }
        total
      }
    }
  }
`;

export const CONTACT_FILTER_DATA_QUERY = `
  query ContactFilterDataGateway($input: ContactFilterDataInput!) {
    contacts {
      filterData(input: $input) {
        items {
          value
          displayValue
          count
        }
        total
      }
    }
  }
`;

export const CREATE_CONTACT_MUTATION = `
  mutation CreateContact($input: CreateContactInput!) {
    contacts {
      createContact(input: $input) { ${CONTACT_LIST_FIELDS} }
    }
  }
`;

export const UPDATE_CONTACT_MUTATION = `
  mutation UpdateContact($uuid: ID!, $input: UpdateContactInput!) {
    contacts {
      updateContact(uuid: $uuid, input: $input) { ${CONTACT_LIST_FIELDS} }
    }
  }
`;

export const DELETE_CONTACT_MUTATION = `
  mutation DeleteContactGateway($uuid: ID!) {
    contacts {
      deleteContact(uuid: $uuid)
    }
  }
`;

export const BATCH_CREATE_CONTACTS_MUTATION = `
  mutation BatchCreateContacts($input: BatchCreateContactsInput!) {
    contacts {
      batchCreateContacts(input: $input) {
        ${CONTACT_LIST_FIELDS}
      }
    }
  }
`;

export const EXPORT_CONTACTS_MUTATION = `
  mutation ExportContacts($input: CreateContact360ExportInput!) {
    contacts {
      exportContacts(input: $input) {
        id
        jobId
        jobType
        jobFamily
        status
        statusPayload
        sourceService
        createdAt
        updatedAt
      }
    }
  }
`;

export const IMPORT_CONTACTS_MUTATION = `
  mutation ImportContacts($input: CreateContact360ImportInput!) {
    contacts {
      importContacts(input: $input) {
        id
        jobId
        jobType
        jobFamily
        status
        statusPayload
        sourceService
        createdAt
        updatedAt
      }
    }
  }
`;
