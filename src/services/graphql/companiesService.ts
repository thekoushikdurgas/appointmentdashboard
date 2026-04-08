import { graphqlQuery, graphqlMutation } from "@/lib/graphqlClient";
import type {
  VqlQueryInput,
  SchedulerJob,
  CompanyFilter,
  CompanyFilterData,
  CreateCompanyInput,
  UpdateCompanyInput,
  CreateContact360ExportInput,
  CreateContact360ImportInput,
  CompanyFilterDataInput,
} from "@/graphql/generated/types";
import {
  COMPANIES_LIST_QUERY,
  COMPANY_ONE_QUERY,
  COMPANY_COUNT_QUERY,
  COMPANY_QUERY_STRICT,
  COMPANIES_FILTERS_QUERY,
  COMPANY_FILTER_DATA_QUERY,
  CREATE_COMPANY_MUTATION,
  UPDATE_COMPANY_MUTATION,
  DELETE_COMPANY_MUTATION,
  EXPORT_COMPANIES_MUTATION,
  IMPORT_COMPANIES_MUTATION,
  COMPANY_CONTACTS_QUERY,
} from "@/graphql/companiesOperations";

export type { SchedulerJob as CompaniesExportJobRef };
export type {
  CreateCompanyInput,
  UpdateCompanyInput,
  CreateContact360ExportInput,
  CreateContact360ImportInput,
  CompanyFilterDataInput,
} from "@/graphql/generated/types";

export interface Company {
  id: string;
  name: string;
  domain?: string;
  website?: string;
  industry?: string;
  employeeCount?: number;
  description?: string;
  country?: string;
  linkedinUrl?: string;
  contactCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface CompanyRow {
  uuid: string;
  name: string | null;
  employeesCount: number | null;
  industries: string[] | null;
  website: string | null;
  normalizedDomain: string | null;
  linkedinUrl: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

function mapCompany(r: CompanyRow): Company {
  const ind = r.industries?.[0];
  return {
    id: r.uuid,
    name: r.name ?? "",
    domain: r.normalizedDomain ?? undefined,
    website: r.website ?? undefined,
    industry: ind,
    employeeCount: r.employeesCount ?? undefined,
    country: r.country ?? undefined,
    linkedinUrl: r.linkedinUrl ?? undefined,
    createdAt: r.createdAt ?? "",
    updatedAt: r.updatedAt ?? "",
  };
}

export interface CompanyListResult {
  items: Company[];
  total: number;
  limit: number;
  offset: number;
}

export interface CompanyContactRow {
  uuid: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  title: string | null;
  mobilePhone: string | null;
  emailStatus: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export function mapCompanyContactRow(r: CompanyContactRow) {
  const fn = r.firstName ?? "";
  const ln = r.lastName ?? "";
  const name = [fn, ln].filter(Boolean).join(" ").trim() || r.email || r.uuid;
  return {
    id: r.uuid,
    name,
    title: r.title,
    email: r.email ?? undefined,
    emailStatus: r.emailStatus ?? undefined,
    createdAt: r.createdAt ?? "",
  };
}

export const companiesService = {
  list: async (query?: VqlQueryInput): Promise<CompanyListResult> => {
    const data = await graphqlQuery<{
      companies: {
        companies: {
          items: CompanyRow[];
          total: number;
          limit: number;
          offset: number;
        };
      };
    }>(COMPANIES_LIST_QUERY, { query: query ?? {} });
    const conn = data.companies.companies;
    return {
      items: conn.items.map(mapCompany),
      total: conn.total,
      limit: conn.limit,
      offset: conn.offset,
    };
  },

  count: async (query?: VqlQueryInput): Promise<number> => {
    const data = await graphqlQuery<{
      companies: { companyCount: number };
    }>(COMPANY_COUNT_QUERY, { query: query ?? {} });
    return data.companies.companyCount;
  },

  companyQuery: async (query: VqlQueryInput): Promise<CompanyListResult> => {
    const data = await graphqlQuery<{
      companies: {
        companyQuery: {
          items: CompanyRow[];
          total: number;
          limit: number;
          offset: number;
        };
      };
    }>(COMPANY_QUERY_STRICT, { query });
    const conn = data.companies.companyQuery;
    return {
      items: conn.items.map(mapCompany),
      total: conn.total,
      limit: conn.limit,
      offset: conn.offset,
    };
  },

  get: async (uuid: string) => {
    const data = await graphqlQuery<{
      companies: { company: CompanyRow };
    }>(COMPANY_ONE_QUERY, { uuid });
    return mapCompany(data.companies.company);
  },

  create: async (input: CreateCompanyInput): Promise<Company> => {
    const data = await graphqlMutation<{
      companies: { createCompany: CompanyRow };
    }>(CREATE_COMPANY_MUTATION, { input });
    return mapCompany(data.companies.createCompany);
  },

  update: async (uuid: string, input: UpdateCompanyInput): Promise<Company> => {
    const data = await graphqlMutation<{
      companies: { updateCompany: CompanyRow };
    }>(UPDATE_COMPANY_MUTATION, { uuid, input });
    return mapCompany(data.companies.updateCompany);
  },

  delete: (uuid: string) =>
    graphqlMutation<{ companies: { deleteCompany: boolean } }>(
      DELETE_COMPANY_MUTATION,
      { uuid },
    ),

  exportCompanies: (input: CreateContact360ExportInput) =>
    graphqlMutation<{ companies: { exportCompanies: SchedulerJob } }>(
      EXPORT_COMPANIES_MUTATION,
      { input },
    ).then((d) => d.companies.exportCompanies),

  importCompanies: (input: CreateContact360ImportInput) =>
    graphqlMutation<{ companies: { importCompanies: SchedulerJob } }>(
      IMPORT_COMPANIES_MUTATION,
      { input },
    ).then((d) => d.companies.importCompanies),

  companyContacts: async (
    companyUuid: string,
    opts?: { query?: VqlQueryInput; limit?: number; offset?: number },
  ) => {
    const data = await graphqlQuery<{
      companies: {
        companyContacts: {
          items: CompanyContactRow[];
          total: number;
          limit: number;
          offset: number;
        };
      };
    }>(COMPANY_CONTACTS_QUERY, {
      companyUuid,
      query: opts?.query ?? {},
      limit: opts?.limit ?? 100,
      offset: opts?.offset ?? 0,
    });
    return data.companies.companyContacts;
  },

  getFilters: () =>
    graphqlQuery<{
      companies: { filters: { items: CompanyFilter[]; total: number } };
    }>(COMPANIES_FILTERS_QUERY),

  filterData: (input: CompanyFilterDataInput) =>
    graphqlQuery<{
      companies: {
        filterData: { items: CompanyFilterData[]; total: number };
      };
    }>(COMPANY_FILTER_DATA_QUERY, { input }),
};
