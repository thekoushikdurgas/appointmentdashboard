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
    $titles: [String!]
    $companies: [String!]
    $locations: [String!]
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
        titles: $titles
        companies: $companies
        locations: $locations
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

const HIRE_SIGNAL_JOB_FILTER_OPTIONS = gql`
  query HireSignalJobFilterOptions(
    $field: String!
    $q: String
    $optionLimit: Int
    $titles: [String!]
    $companies: [String!]
    $locations: [String!]
    $employmentType: String
    $seniority: String
    $functionCategory: String
    $postedAfter: String
    $postedBefore: String
    $runId: String
  ) {
    hireSignal {
      jobFilterOptions(
        field: $field
        q: $q
        limit: $optionLimit
        titles: $titles
        companies: $companies
        locations: $locations
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
  /** Substring tokens, OR within field (matches job.server + gateway). */
  titles?: string[];
  companies?: string[];
  locations?: string[];
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

export type HireSignalJobFilterOptionRow = {
  value: string;
  count: number;
};

function hireSignalJobListFilterVars(filters: JobListFilters) {
  return {
    titles: filters.titles?.length ? filters.titles : null,
    companies: filters.companies?.length ? filters.companies : null,
    locations: filters.locations?.length ? filters.locations : null,
    employmentType: filters.employmentType || null,
    seniority: filters.seniority || null,
    functionCategory: filters.functionCategory || null,
    postedAfter: filters.postedAfter || null,
    postedBefore: filters.postedBefore || null,
    runId: filters.runId?.trim() || null,
  };
}

export function parseJobFilterOptionsPayload(
  raw: HireSignalApiJson,
): HireSignalJobFilterOptionRow[] {
  const env = asRecord(raw);
  const data = env?.data;
  if (!Array.isArray(data)) return [];
  const out: HireSignalJobFilterOptionRow[] = [];
  for (const item of data) {
    const o = asRecord(item);
    if (!o) continue;
    const value = String(o.value ?? "").trim();
    if (!value) continue;
    const c = o.count;
    const count = typeof c === "number" ? c : Number(c) || 0;
    out.push({ value, count });
  }
  return out;
}

export async function fetchHiringSignalJobs(filters: JobListFilters) {
  return graphqlQuery<{
    hireSignal: { jobs: HireSignalApiJson };
  }>(
    HIRE_SIGNAL_JOBS,
    {
      limit: filters.limit,
      offset: filters.offset,
      ...hireSignalJobListFilterVars(filters),
    },
    HS_GQL,
  );
}

export async function fetchHireSignalJobFilterOptions(
  field: "title" | "company" | "location",
  filters: JobListFilters,
  options?: { q?: string; limit?: number },
) {
  const res = await graphqlQuery<{
    hireSignal: { jobFilterOptions: HireSignalApiJson };
  }>(
    HIRE_SIGNAL_JOB_FILTER_OPTIONS,
    {
      field,
      q: options?.q?.trim() || null,
      optionLimit: options?.limit ?? 50,
      ...hireSignalJobListFilterVars(filters),
    },
    HS_GQL,
  );
  return parseJobFilterOptionsPayload(res.hireSignal?.jobFilterOptions);
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

function linkedinJobIdFromItem(item: unknown): string {
  const o = asRecord(item);
  if (!o) return "";
  return String(o.linkedinJobId ?? o.linkedin_job_id ?? "").trim();
}

/** Batch size when paging through jobs for export ID collection. */
export const HS_EXPORT_FETCH_BATCH = 150;

/** Hard cap per export request (gateway/job.server may impose its own limit). */
export const HS_MAX_EXPORT_LINKEDIN_IDS = 5000;

/**
 * Collect up to `n` LinkedIn job IDs in list order for the given filters (paged fetch).
 */
export async function fetchLinkedinJobIdsFirstN(
  filters: JobListFilters,
  n: number,
): Promise<string[]> {
  const cap = Math.max(0, Math.floor(n));
  if (cap === 0) return [];

  const ids: string[] = [];
  let offset = 0;

  while (ids.length < cap) {
    const pageSize = Math.min(HS_EXPORT_FETCH_BATCH, cap - ids.length);
    const res = await fetchHiringSignalJobs({
      ...filters,
      limit: pageSize,
      offset,
    });
    const env = hireSignalJobsListFromJson(res.hireSignal?.jobs);
    if (env.data.length === 0) break;

    for (const item of env.data) {
      const id = linkedinJobIdFromItem(item);
      if (id) ids.push(id);
      if (ids.length >= cap) return ids.slice(0, cap);
    }

    if (offset + env.data.length >= env.total) break;
    offset += env.data.length;
  }

  return ids.slice(0, cap);
}

export type CollectAllExportIdsResult = {
  ids: string[];
  totalMatching: number;
  truncated: boolean;
};

/**
 * Collect LinkedIn job IDs for all rows matching filters, up to {@link HS_MAX_EXPORT_LINKEDIN_IDS}.
 */
export async function fetchLinkedinJobIdsAllMatching(
  filters: JobListFilters,
  maxIds: number = HS_MAX_EXPORT_LINKEDIN_IDS,
): Promise<CollectAllExportIdsResult> {
  const ids: string[] = [];
  const seen = new Set<string>();
  let offset = 0;
  let totalMatching = 0;

  for (;;) {
    const res = await fetchHiringSignalJobs({
      ...filters,
      limit: HS_EXPORT_FETCH_BATCH,
      offset,
    });
    const env = hireSignalJobsListFromJson(res.hireSignal?.jobs);
    totalMatching = env.total;

    for (const item of env.data) {
      const id = linkedinJobIdFromItem(item);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      ids.push(id);
      if (ids.length >= maxIds) {
        return {
          ids,
          totalMatching,
          truncated: totalMatching > ids.length,
        };
      }
    }

    if (
      env.data.length === 0 ||
      offset + env.data.length >= env.total ||
      ids.length >= totalMatching
    ) {
      break;
    }
    offset += env.data.length;
  }

  return {
    ids,
    totalMatching,
    truncated: false,
  };
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
