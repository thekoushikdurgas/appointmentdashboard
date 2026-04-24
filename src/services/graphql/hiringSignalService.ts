/**
 * Hiring signal — GraphQL to gateway `hireSignal` (proxies job.server).
 */

import { gql } from "graphql-request";
import { graphqlQuery } from "@/lib/graphqlClient";

// --- response shapes (JSON scalars from gateway) ---

export type HireSignalApiJson = Record<string, unknown> | null | unknown[];

export function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

// --- operations ---

const HIRE_SIGNAL_JOBS = gql`
  query HireSignalJobs(
    $limit: Int
    $offset: Int
    $title: String
    $company: String
    $location: String
    $employmentType: String
  ) {
    hireSignal {
      jobs(
        limit: $limit
        offset: $offset
        title: $title
        company: $company
        location: $location
        employmentType: $employmentType
      )
    }
  }
`;

const HIRE_SIGNAL_STATS = gql`
  query HireSignalStats {
    hireSignal {
      stats
    }
  }
`;

const HIRE_SIGNAL_COMPANY_JOBS = gql`
  query HireSignalCompanyJobs($companyUuid: String!, $limit: Int) {
    hireSignal {
      companyJobs(companyUuid: $companyUuid, limit: $limit)
    }
  }
`;

const HIRE_SIGNAL_TRIGGER = gql`
  mutation HireSignalTrigger($body: JSON) {
    hireSignal {
      triggerScrape(body: $body)
    }
  }
`;

export interface JobListFilters {
  title?: string;
  company?: string;
  location?: string;
  employmentType?: string;
  limit: number;
  offset: number;
}

export async function fetchHiringSignalJobs(filters: JobListFilters) {
  return graphqlQuery<{
    hireSignal: { jobs: HireSignalApiJson };
  }>(HIRE_SIGNAL_JOBS, {
    limit: filters.limit,
    offset: filters.offset,
    title: filters.title || null,
    company: filters.company || null,
    location: filters.location || null,
    employmentType: filters.employmentType || null,
  });
}

export async function fetchHiringSignalStats() {
  return graphqlQuery<{
    hireSignal: { stats: HireSignalApiJson };
  }>(HIRE_SIGNAL_STATS, {});
}

export async function fetchCompanyHiringSignalJobs(
  companyUuid: string,
  limit = 50,
) {
  return graphqlQuery<{
    hireSignal: { companyJobs: HireSignalApiJson };
  }>(HIRE_SIGNAL_COMPANY_JOBS, {
    companyUuid,
    limit,
  });
}

export async function triggerHireSignalScrape(
  body?: Record<string, unknown> | null,
) {
  return graphqlQuery<{
    hireSignal: { triggerScrape: HireSignalApiJson };
  }>(HIRE_SIGNAL_TRIGGER, { body: body ?? null });
}
