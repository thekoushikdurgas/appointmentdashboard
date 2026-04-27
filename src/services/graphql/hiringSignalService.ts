/**
 * Hiring signal — GraphQL to gateway `hireSignal` (proxies job.server).
 */

import { gql } from "graphql-request";
import { graphqlQuery, graphqlMutation } from "@/lib/graphqlClient";

/** Hiring-signal operations: hooks/modals show toasts; avoid duplicate client toasts. */
const HS_GQL = { showToastOnError: false as const };

// --- response shapes (JSON scalars from gateway) ---

export type HireSignalApiJson = Record<string, unknown> | null | unknown[];

export function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

/** Normalized rows + total from `hireSignal.runs` JSON (job.server list envelope). */
export function hireSignalRunsFromJson(raw: HireSignalApiJson): {
  rows: Record<string, unknown>[];
  total: number;
} {
  const r = asRecord(raw);
  const data = r?.data;
  const rows = Array.isArray(data)
    ? data.filter(
        (x): x is Record<string, unknown> =>
          !!x && typeof x === "object" && !Array.isArray(x),
      )
    : [];
  const total = typeof r?.total === "number" ? r.total : rows.length;
  return { rows, total };
}

/** Typed envelope for `hireSignal.jobs` list payload. */
export function hireSignalJobsListFromJson(raw: HireSignalApiJson): {
  success: boolean;
  data: unknown[];
  total: number;
} {
  const r = asRecord(raw);
  const data = (r?.data as unknown) ?? [];
  const arr = Array.isArray(data) ? data : [];
  return {
    success: Boolean(r?.success),
    data: arr,
    total: typeof r?.total === "number" ? r.total : 0,
  };
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
    $seniority: String
    $functionCategory: String
    $postedAfter: String
    $postedBefore: String
    $runId: String
  ) {
    hireSignal {
      jobs(
        limit: $limit
        offset: $offset
        title: $title
        company: $company
        location: $location
        employmentType: $employmentType
        seniority: $seniority
        functionCategory: $functionCategory
        postedAfter: $postedAfter
        postedBefore: $postedBefore
        runId: $runId
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

const HIRE_SIGNAL_TRIGGER_TRACK = gql`
  mutation HireSignalTriggerTrack($body: JSON) {
    hireSignal {
      triggerScrapeAndTrack(body: $body) {
        id
        userId
        status
        apifyRunId
        error
        createdAt
        jobServerResponse
      }
    }
  }
`;

const HIRE_SIGNAL_RUNS = gql`
  query HireSignalRuns($limit: Int, $offset: Int) {
    hireSignal {
      runs(limit: $limit, offset: $offset)
    }
  }
`;

const HIRE_SIGNAL_RUN = gql`
  query HireSignalRun($runId: String!) {
    hireSignal {
      run(runId: $runId)
    }
  }
`;

const HIRE_SIGNAL_RUN_REFRESH = gql`
  query HireSignalRunRefresh($runId: String!) {
    hireSignal {
      refreshHireSignalRun(runId: $runId)
    }
  }
`;

const HIRE_SIGNAL_LIST_SCRAPE_JOBS = gql`
  query HireSignalListScrapeJobs($limit: Int, $offset: Int) {
    hireSignal {
      listScrapeJobs(limit: $limit, offset: $offset)
    }
  }
`;

const HIRE_SIGNAL_SCRAPE_JOB_JOBS = gql`
  query HireSignalScrapeJobJobs(
    $scrapeJobId: String!
    $limit: Int
    $offset: Int
  ) {
    hireSignal {
      scrapeJobJobs(scrapeJobId: $scrapeJobId, limit: $limit, offset: $offset)
    }
  }
`;

/** Proxies job.server → Connectra (sync.server); needs CONNECTRA_* on job.server. */
const HIRE_SIGNAL_JOB_CONNECTRA_COMPANY = gql`
  query HireSignalJobConnectraCompany($linkedinJobId: String!) {
    hireSignal {
      jobConnectraCompany(linkedinJobId: $linkedinJobId)
    }
  }
`;

const HIRE_SIGNAL_JOB_CONNECTRA_CONTACTS = gql`
  query HireSignalJobConnectraContacts(
    $linkedinJobId: String!
    $page: Int
    $limit: Int
    $populateCompany: Boolean
    $includePoster: Boolean
  ) {
    hireSignal {
      jobConnectraContacts(
        linkedinJobId: $linkedinJobId
        page: $page
        limit: $limit
        populateCompany: $populateCompany
        includePoster: $includePoster
      )
    }
  }
`;

const HIRE_SIGNAL_CONNECTRA_COMPANY = gql`
  query HireSignalConnectraCompany($companyUuid: String!) {
    hireSignal {
      connectraCompany(companyUuid: $companyUuid)
    }
  }
`;

const HIRE_SIGNAL_CONNECTRA_CONTACTS_FOR_COMPANY = gql`
  query HireSignalConnectraContactsForCompany(
    $companyUuid: String!
    $page: Int
    $limit: Int
    $populateCompany: Boolean
  ) {
    hireSignal {
      connectraContactsForCompany(
        companyUuid: $companyUuid
        page: $page
        limit: $limit
        populateCompany: $populateCompany
      )
    }
  }
`;

const HIRE_SIGNAL_EXPORT_SELECTED = gql`
  mutation HireSignalExportSelected($linkedinJobIds: [String!]!) {
    hireSignal {
      exportSelectedJobs(linkedinJobIds: $linkedinJobIds) {
        id
        jobId
        userId
        jobType
        status
        sourceService
        jobFamily
        jobSubtype
        createdAt
        updatedAt
      }
    }
  }
`;

const HIRE_SIGNAL_EXPORT_JOB_STATUS = gql`
  query HireSignalExportJobStatus($exportJobId: String!) {
    hireSignal {
      exportJobStatus(exportJobId: $exportJobId) {
        id
        jobId
        status
        jobType
        sourceService
        jobFamily
        jobSubtype
        statusPayload
        updatedAt
      }
    }
  }
`;

const HIRE_SIGNAL_EXPORT_DOWNLOAD_URL = gql`
  query HireSignalExportDownloadUrl($exportJobId: String!, $expiresIn: Int) {
    hireSignal {
      exportDownloadUrl(exportJobId: $exportJobId, expiresIn: $expiresIn) {
        downloadUrl
        expiresIn
      }
    }
  }
`;

export type HireSignalExportSchedulerJob = {
  id: string;
  jobId: string;
  userId: string;
  jobType: string;
  status: string;
  sourceService: string;
  jobFamily: string;
  jobSubtype: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export type HireSignalExportDownloadUrlResponse = {
  downloadUrl: string;
  expiresIn: number;
} | null;

export interface JobListFilters {
  title?: string;
  company?: string;
  location?: string;
  employmentType?: string;
  seniority?: string;
  functionCategory?: string;
  /** ISO date YYYY-MM-DD or RFC3339 */
  postedAfter?: string;
  postedBefore?: string;
  /** Apify / job.server run id (gateway must expose `jobs(runId:)`). */
  runId?: string;
  limit: number;
  offset: number;
}

export async function fetchHiringSignalJobs(filters: JobListFilters) {
  return graphqlQuery<{
    hireSignal: { jobs: HireSignalApiJson };
  }>(
    HIRE_SIGNAL_JOBS,
    {
      limit: filters.limit,
      offset: filters.offset,
      title: filters.title || null,
      company: filters.company || null,
      location: filters.location || null,
      employmentType: filters.employmentType || null,
      seniority: filters.seniority || null,
      functionCategory: filters.functionCategory || null,
      postedAfter: filters.postedAfter || null,
      postedBefore: filters.postedBefore || null,
      runId: filters.runId?.trim() || null,
    },
    HS_GQL,
  );
}

export async function fetchHiringSignalStats() {
  return graphqlQuery<{
    hireSignal: { stats: HireSignalApiJson };
  }>(HIRE_SIGNAL_STATS, {}, HS_GQL);
}

export async function fetchCompanyHiringSignalJobs(
  companyUuid: string,
  limit = 50,
) {
  return graphqlQuery<{
    hireSignal: { companyJobs: HireSignalApiJson };
  }>(
    HIRE_SIGNAL_COMPANY_JOBS,
    {
      companyUuid,
      limit,
    },
    HS_GQL,
  );
}

export async function triggerHireSignalScrape(
  body?: Record<string, unknown> | null,
) {
  return graphqlQuery<{
    hireSignal: { triggerScrape: HireSignalApiJson };
  }>(HIRE_SIGNAL_TRIGGER, { body: body ?? null }, HS_GQL);
}

export type HireSignalScrapeJobRow = {
  id: string;
  userId?: string;
  status?: string;
  apifyRunId?: string | null;
  error?: string | null;
  itemCount?: number | null;
  createdAt?: string | null;
  jobServerResponse?: Record<string, unknown> | null;
};

export async function triggerHireSignalScrapeAndTrack(
  body?: Record<string, unknown> | null,
) {
  return graphqlQuery<{
    hireSignal: { triggerScrapeAndTrack: HireSignalScrapeJobRow };
  }>(HIRE_SIGNAL_TRIGGER_TRACK, { body: body ?? null }, HS_GQL);
}

export async function fetchHireSignalRuns(limit = 20, offset = 0) {
  return graphqlQuery<{
    hireSignal: { runs: HireSignalApiJson };
  }>(HIRE_SIGNAL_RUNS, { limit, offset: Math.max(0, offset) }, HS_GQL);
}

export async function fetchHireSignalRun(runId: string) {
  return graphqlQuery<{
    hireSignal: { run: HireSignalApiJson };
  }>(HIRE_SIGNAL_RUN, { runId }, HS_GQL);
}

export async function refreshHireSignalRun(runId: string) {
  return graphqlQuery<{
    hireSignal: { refreshHireSignalRun: HireSignalApiJson };
  }>(HIRE_SIGNAL_RUN_REFRESH, { runId }, HS_GQL);
}

export async function fetchListScrapeJobs(limit = 50, offset = 0) {
  return graphqlQuery<{
    hireSignal: { listScrapeJobs: HireSignalApiJson };
  }>(HIRE_SIGNAL_LIST_SCRAPE_JOBS, { limit, offset }, HS_GQL);
}

export async function fetchScrapeJobJobs(
  scrapeJobId: string,
  limit = 500,
  offset = 0,
) {
  return graphqlQuery<{
    hireSignal: { scrapeJobJobs: HireSignalApiJson };
  }>(HIRE_SIGNAL_SCRAPE_JOB_JOBS, { scrapeJobId, limit, offset }, HS_GQL);
}

export async function fetchJobConnectraCompany(linkedinJobId: string) {
  return graphqlQuery<{
    hireSignal: { jobConnectraCompany: HireSignalApiJson };
  }>(HIRE_SIGNAL_JOB_CONNECTRA_COMPANY, { linkedinJobId }, HS_GQL);
}

export async function fetchJobConnectraContacts(
  linkedinJobId: string,
  options?: {
    page?: number;
    limit?: number;
    populateCompany?: boolean;
    includePoster?: boolean;
  },
) {
  return graphqlQuery<{
    hireSignal: { jobConnectraContacts: HireSignalApiJson };
  }>(
    HIRE_SIGNAL_JOB_CONNECTRA_CONTACTS,
    {
      linkedinJobId,
      page: options?.page ?? 1,
      limit: options?.limit ?? 25,
      populateCompany: options?.populateCompany ?? true,
      includePoster: options?.includePoster ?? true,
    },
    HS_GQL,
  );
}

export async function fetchConnectraCompany(companyUuid: string) {
  return graphqlQuery<{
    hireSignal: { connectraCompany: HireSignalApiJson };
  }>(HIRE_SIGNAL_CONNECTRA_COMPANY, { companyUuid }, HS_GQL);
}

export async function fetchConnectraContactsForCompany(
  companyUuid: string,
  options?: { page?: number; limit?: number; populateCompany?: boolean },
) {
  return graphqlQuery<{
    hireSignal: { connectraContactsForCompany: HireSignalApiJson };
  }>(
    HIRE_SIGNAL_CONNECTRA_CONTACTS_FOR_COMPANY,
    {
      companyUuid,
      page: options?.page ?? 1,
      limit: options?.limit ?? 25,
      populateCompany: options?.populateCompany ?? true,
    },
    HS_GQL,
  );
}

export async function exportSelectedHireSignalJobs(linkedinJobIds: string[]) {
  return graphqlMutation<{
    hireSignal: { exportSelectedJobs: HireSignalExportSchedulerJob };
  }>(
    HIRE_SIGNAL_EXPORT_SELECTED,
    { linkedinJobIds },
    { showToastOnError: true },
  );
}

export async function fetchHireSignalExportStatus(exportJobId: string) {
  return graphqlQuery<{
    hireSignal: {
      exportJobStatus: HireSignalExportSchedulerJob & {
        statusPayload?: unknown;
      };
    };
  }>(
    HIRE_SIGNAL_EXPORT_JOB_STATUS,
    { exportJobId: exportJobId.trim() },
    HS_GQL,
  );
}

export async function fetchHireSignalExportDownloadUrl(
  exportJobId: string,
  expiresIn?: number,
) {
  return graphqlQuery<{
    hireSignal: { exportDownloadUrl: HireSignalExportDownloadUrlResponse };
  }>(
    HIRE_SIGNAL_EXPORT_DOWNLOAD_URL,
    {
      exportJobId: exportJobId.trim(),
      expiresIn: expiresIn ?? null,
    },
    HS_GQL,
  );
}
