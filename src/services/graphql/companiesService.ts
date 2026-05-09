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
import type { Contact } from "@/services/graphql/contactsService";

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
  /** All industries from API (for badges). */
  industries?: string[];
  keywords?: string[];
  technologies?: string[];
  address?: string;
  employeeCount?: number;
  description?: string;
  city?: string;
  state?: string;
  country?: string;
  /** City, state, country joined for display. */
  location?: string;
  linkedinUrl?: string;
  linkedinSalesUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  phoneNumber?: string;
  companyNameForEmails?: string;
  annualRevenue?: number;
  totalFunding?: number;
  latestFunding?: string;
  latestFundingAmount?: number;
  lastRaisedAt?: string;
  contactCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface CompanyRow {
  uuid: string;
  name: string | null;
  employeesCount: number | null;
  industries: string[] | null;
  keywords: string[] | null;
  technologies: string[] | null;
  address: string | null;
  website: string | null;
  normalizedDomain: string | null;
  linkedinUrl: string | null;
  linkedinSalesUrl: string | null;
  facebookUrl: string | null;
  twitterUrl: string | null;
  phoneNumber: string | null;
  companyNameForEmails: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  annualRevenue: number | null;
  totalFunding: number | null;
  latestFunding: string | null;
  latestFundingAmount: number | null;
  lastRaisedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

function mapCompany(r: CompanyRow): Company {
  const ind = r.industries?.[0];
  const loc = [r.city, r.state, r.country].filter(Boolean).join(", ");
  return {
    id: r.uuid,
    name: r.name ?? "",
    domain: r.normalizedDomain ?? undefined,
    website: r.website ?? undefined,
    industry: ind,
    industries: r.industries ?? undefined,
    keywords: r.keywords?.filter(Boolean) ?? undefined,
    technologies: r.technologies?.filter(Boolean) ?? undefined,
    address: r.address?.trim() || undefined,
    employeeCount: r.employeesCount ?? undefined,
    city: r.city ?? undefined,
    state: r.state ?? undefined,
    country: r.country ?? undefined,
    location: loc || undefined,
    linkedinUrl: r.linkedinUrl ?? undefined,
    linkedinSalesUrl: r.linkedinSalesUrl ?? undefined,
    facebookUrl: r.facebookUrl ?? undefined,
    twitterUrl: r.twitterUrl ?? undefined,
    phoneNumber: r.phoneNumber ?? undefined,
    companyNameForEmails: r.companyNameForEmails ?? undefined,
    annualRevenue: r.annualRevenue ?? undefined,
    totalFunding: r.totalFunding ?? undefined,
    latestFunding: r.latestFunding ?? undefined,
    latestFundingAmount: r.latestFundingAmount ?? undefined,
    lastRaisedAt: r.lastRaisedAt ?? undefined,
    createdAt: r.createdAt ?? "",
    updatedAt: r.updatedAt ?? "",
  };
}

export interface CompanyListResult {
  items: Company[];
  total: number;
  limit: number;
  offset: number;
  nextSearchAfter?: string[] | null;
}

export interface CompanyContactRow {
  uuid: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  title: string | null;
  companyUuid: string | null;
  mobilePhone: string | null;
  workDirectPhone: string | null;
  homePhone: string | null;
  otherPhone: string | null;
  emailStatus: string | null;
  linkedinUrl: string | null;
  linkedinSalesUrl: string | null;
  website: string | null;
  facebookUrl: string | null;
  twitterUrl: string | null;
  departments: string[] | null;
  seniority: string | null;
  stage: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export function mapCompanyContactRow(r: CompanyContactRow): Contact {
  const fn = r.firstName ?? "";
  const ln = r.lastName ?? "";
  const name = [fn, ln].filter(Boolean).join(" ").trim() || r.email || r.uuid;
  const loc = [r.city, r.state, r.country].filter(Boolean).join(", ");
  return {
    id: r.uuid,
    name,
    firstName: r.firstName ?? undefined,
    lastName: r.lastName ?? undefined,
    title: r.title ?? undefined,
    email: r.email ?? undefined,
    emailStatus: r.emailStatus ?? undefined,
    companyId: r.companyUuid ?? undefined,
    location: loc || undefined,
    country: r.country,
    phone: r.mobilePhone ?? undefined,
    workDirectPhone: r.workDirectPhone ?? undefined,
    homePhone: r.homePhone ?? undefined,
    otherPhone: r.otherPhone ?? undefined,
    departments: r.departments?.filter(Boolean) ?? undefined,
    seniority: r.seniority ?? undefined,
    stage: r.stage ?? undefined,
    website: r.website ?? undefined,
    facebookUrl: r.facebookUrl ?? undefined,
    twitterUrl: r.twitterUrl ?? undefined,
    linkedinUrl: r.linkedinUrl ?? undefined,
    linkedinSalesUrl: r.linkedinSalesUrl ?? undefined,
    createdAt: r.createdAt ?? "",
    updatedAt: r.updatedAt ?? "",
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
          nextSearchAfter?: string[] | null;
        };
      };
    }>(COMPANIES_LIST_QUERY, { query: query ?? {} });
    const conn = data.companies.companies;
    return {
      items: conn.items.map(mapCompany),
      total: conn.total,
      limit: conn.limit,
      offset: conn.offset,
      nextSearchAfter: conn.nextSearchAfter ?? null,
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

  /** Paginated filter facet values; pass `page`, `limit`, `searchText` as needed. */
  filterData: async (
    input: CompanyFilterDataInput,
  ): Promise<{ items: CompanyFilterData[]; total: number }> => {
    const data = await graphqlQuery<{
      companies: {
        filterData: { items: CompanyFilterData[]; total: number };
      };
    }>(COMPANY_FILTER_DATA_QUERY, { input });
    const fd = data.companies.filterData;
    return { items: fd.items, total: fd.total };
  },
};
