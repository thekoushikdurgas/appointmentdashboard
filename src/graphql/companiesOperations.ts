/**
 * GraphQL documents for `query.companies` / `mutation.companies`.
 * Variable shapes match `CompanyQuery*` / `CompanyMutation*` in `graphql/generated/types.ts`.
 */

export const COMPANY_LIST_FIELDS = `
  uuid
  name
  employeesCount
  industries
  website
  normalizedDomain
  linkedinUrl
  city
  state
  country
  createdAt
  updatedAt
` as const;

export const COMPANIES_LIST_QUERY = `
  query CompaniesGateway($query: VQLQueryInput) {
    companies {
      companies(query: $query) {
        items { ${COMPANY_LIST_FIELDS} }
        total
        limit
        offset
        nextSearchAfter
      }
    }
  }
`;

export const COMPANY_ONE_QUERY = `
  query CompanyGateway($uuid: ID!) {
    companies {
      company(uuid: $uuid) {
        ${COMPANY_LIST_FIELDS}
      }
    }
  }
`;

export const COMPANY_COUNT_QUERY = `
  query CompanyCountGateway($query: VQLQueryInput) {
    companies {
      companyCount(query: $query)
    }
  }
`;

export const COMPANY_QUERY_STRICT = `
  query CompanyQueryStrict($query: VQLQueryInput!) {
    companies {
      companyQuery(query: $query) {
        items { ${COMPANY_LIST_FIELDS} }
        total
        limit
        offset
      }
    }
  }
`;

export const COMPANIES_FILTERS_QUERY = `
  query CompaniesFilters {
    companies {
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

export const COMPANY_FILTER_DATA_QUERY = `
  query CompanyFilterDataGateway($input: CompanyFilterDataInput!) {
    companies {
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

export const CREATE_COMPANY_MUTATION = `
  mutation CreateCompany($input: CreateCompanyInput!) {
    companies {
      createCompany(input: $input) { ${COMPANY_LIST_FIELDS} }
    }
  }
`;

export const UPDATE_COMPANY_MUTATION = `
  mutation UpdateCompany($uuid: ID!, $input: UpdateCompanyInput!) {
    companies {
      updateCompany(uuid: $uuid, input: $input) { ${COMPANY_LIST_FIELDS} }
    }
  }
`;

export const DELETE_COMPANY_MUTATION = `
  mutation DeleteCompany($uuid: ID!) {
    companies {
      deleteCompany(uuid: $uuid)
    }
  }
`;

export const EXPORT_COMPANIES_MUTATION = `
  mutation ExportCompanies($input: CreateContact360ExportInput!) {
    companies {
      exportCompanies(input: $input) {
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

export const IMPORT_COMPANIES_MUTATION = `
  mutation ImportCompanies($input: CreateContact360ImportInput!) {
    companies {
      importCompanies(input: $input) {
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

export const COMPANY_CONTACTS_QUERY = `
  query CompanyContacts(
    $companyUuid: ID!
    $query: VQLQueryInput
    $limit: Int
    $offset: Int
  ) {
    companies {
      companyContacts(
        companyUuid: $companyUuid
        query: $query
        limit: $limit
        offset: $offset
      ) {
        items {
          uuid
          firstName
          lastName
          email
          title
          mobilePhone
          emailStatus
          city
          state
          country
          createdAt
          updatedAt
        }
        total
        limit
        offset
      }
    }
  }
`;
