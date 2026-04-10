import { graphqlQuery, graphqlMutation } from "@/lib/graphqlClient";
import type {
  CreateContact360ExportInput,
  CreateContact360ImportInput,
} from "@/graphql/generated/types";
import { deriveDisplayProgressPercent } from "@/lib/jobs/jobsUtils";
import {
  normalizeEmailSatelliteStatus,
  parseStatusPayload,
} from "@/lib/jobs/statusPayload";

/** Full fields — used for single-job detail view where all payloads are needed. */
const JOB_FIELDS = `
  id
  jobId
  userId
  jobType
  status
  sourceService
  jobFamily
  jobSubtype
  requestPayload
  responsePayload
  statusPayload
  outputObjectKey
  exportOutputBasePath
  createdAt
  updatedAt
`;

/**
 * Slim fields for list queries — omits large JSON payload blobs that are only
 * needed in the detail view.  Reduces list response sizes significantly.
 */
const JOB_LIST_FIELDS = `
  id
  jobId
  userId
  jobType
  status
  sourceService
  jobFamily
  jobSubtype
  statusPayload
  outputObjectKey
  exportOutputBasePath
  createdAt
  updatedAt
`;

export interface Job {
  id: string;
  jobId: string;
  userId: string;
  type: string;
  status: string;
  sourceService: string;
  jobFamily: string;
  jobSubtype: string | null;
  progress: number;
  total: number;
  processed: number;
  inputFile?: string;
  outputFile?: string;
  /** Logical ``{userId}/{output_prefix}/`` for export/finder/verify jobs (API). */
  exportOutputBasePath?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  error?: string;
  /** ``request_payload.output_prefix`` when job was loaded with ``requestPayload`` (detail). */
  storedOutputPrefix?: string;
}

export interface JobRow {
  id: string;
  jobId: string;
  userId: string;
  jobType: string;
  status: string;
  sourceService: string;
  jobFamily: string;
  jobSubtype: string | null;
  requestPayload?: unknown | null;
  responsePayload?: unknown | null;
  statusPayload?: unknown | null;
  outputObjectKey?: string | null;
  exportOutputBasePath?: string | null;
  createdAt: string;
  updatedAt: string | null;
}

function mapJob(r: JobRow): Job {
  const parsed = parseStatusPayload(r.statusPayload);
  const live = normalizeEmailSatelliteStatus(parsed.liveStatus);
  /** Connectra (sync_server) exposes live status on GET /common/jobs/:uuid — same as email.server. */
  const useLiveStatus =
    !!live &&
    (r.sourceService === "email_server" || r.sourceService === "sync_server");
  /** Normalize DB enum strings (e.g. ``processing``) when live JSON is missing or stale. */
  const dbDisplay =
    typeof r.status === "string" && r.status.trim()
      ? (normalizeEmailSatelliteStatus(r.status) ??
        r.status.trim().toUpperCase())
      : r.status;
  const displayStatus = useLiveStatus ? live : dbDisplay;
  const fromResponse =
    r.responsePayload &&
    typeof r.responsePayload === "object" &&
    !Array.isArray(r.responsePayload)
      ? (r.responsePayload as Record<string, unknown>)
      : null;
  const outputFromResponse: string | undefined = fromResponse
    ? typeof fromResponse.download_url === "string"
      ? fromResponse.download_url
      : typeof fromResponse.output_csv_key === "string"
        ? fromResponse.output_csv_key
        : typeof fromResponse.s3_key === "string"
          ? fromResponse.s3_key
          : undefined
    : undefined;

  const apiOutputKey =
    typeof r.outputObjectKey === "string" && r.outputObjectKey.trim()
      ? r.outputObjectKey.trim()
      : undefined;
  const exportPath =
    typeof r.exportOutputBasePath === "string" && r.exportOutputBasePath.trim()
      ? r.exportOutputBasePath.trim()
      : undefined;

  let storedOutputPrefix: string | undefined;
  if (
    r.requestPayload &&
    typeof r.requestPayload === "object" &&
    !Array.isArray(r.requestPayload)
  ) {
    const op = (r.requestPayload as Record<string, unknown>).output_prefix;
    if (typeof op === "string" && op.trim()) storedOutputPrefix = op.trim();
  }

  const progress = deriveDisplayProgressPercent(displayStatus, {
    progress: parsed.progress,
    total: parsed.total,
    processed: parsed.processed,
  });

  return {
    id: r.id,
    jobId: r.jobId,
    userId: r.userId,
    type: r.jobType,
    status: displayStatus,
    sourceService: r.sourceService,
    jobFamily: r.jobFamily,
    jobSubtype: r.jobSubtype,
    progress,
    total: parsed.total,
    processed: parsed.processed,
    // Prefer live ``statusPayload`` (GraphQL resolver) over DB-only ``outputObjectKey``.
    outputFile: parsed.outputFile ?? apiOutputKey ?? outputFromResponse,
    exportOutputBasePath: exportPath,
    storedOutputPrefix,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt ?? "",
    error: parsed.error,
  };
}

const JOBS_LIST = `query JobsGateway($limit: Int, $offset: Int, $status: String, $jobType: String, $jobFamily: String, $relatedFileKey: String) {
  jobs {
    jobs(limit: $limit, offset: $offset, status: $status, jobType: $jobType, jobFamily: $jobFamily, relatedFileKey: $relatedFileKey) {
      jobs { ${JOB_LIST_FIELDS} }
      pageInfo {
        total
        limit
        offset
        hasNext
        hasPrevious
      }
    }
  }
}`;

const JOB_ONE = `query JobGateway($jobId: ID!) {
  jobs {
    job(jobId: $jobId) {
      ${JOB_FIELDS}
    }
  }
}`;

/** Full-payload list used when raw requestPayload/responsePayload is needed (e.g. related-file view). */
const JOBS_LIST_FULL = `query JobsGatewayFull($limit: Int, $offset: Int, $status: String, $jobType: String, $jobFamily: String, $relatedFileKey: String) {
  jobs {
    jobs(limit: $limit, offset: $offset, status: $status, jobType: $jobType, jobFamily: $jobFamily, relatedFileKey: $relatedFileKey) {
      jobs { ${JOB_FIELDS} }
      pageInfo {
        total
        limit
        offset
        hasNext
        hasPrevious
      }
    }
  }
}`;

const RETRY_JOB = `mutation RetryJobGateway($input: RetryJobInput!) {
  jobs {
    retryJob(input: $input)
  }
}`;

const PAUSE_JOB = `mutation PauseJobGateway($input: PauseJobInput!) {
  jobs {
    pauseJob(input: $input)
  }
}`;

const TERMINATE_JOB = `mutation TerminateJobGateway($input: TerminateJobInput!) {
  jobs {
    terminateJob(input: $input)
  }
}`;

const RESUME_JOB = `mutation ResumeJobGateway($input: ResumeJobInput!) {
  jobs {
    resumeJob(input: $input)
  }
}`;

const CREATE_EMAIL_FINDER_EXPORT = `mutation CreateEmailFinderExport($input: CreateEmailFinderExportInput!) {
  jobs {
    createEmailFinderExport(input: $input) {
      id
      jobId
      status
      jobType
      jobFamily
      createdAt
    }
  }
}`;

const CREATE_EMAIL_VERIFY_EXPORT = `mutation CreateEmailVerifyExport($input: CreateEmailVerifyExportInput!) {
  jobs {
    createEmailVerifyExport(input: $input) {
      id
      jobId
      status
      jobType
      jobFamily
      createdAt
    }
  }
}`;

const CREATE_EMAIL_PATTERN_EXPORT = `mutation CreateEmailPatternExport($input: CreateEmailPatternExportInput!) {
  jobs {
    createEmailPatternExport(input: $input) {
      id
      jobId
      status
      jobType
      jobFamily
      createdAt
    }
  }
}`;

const CREATE_CONTACT360_EXPORT = `mutation CreateContact360Export($input: CreateContact360ExportInput!) {
  jobs {
    createContact360Export(input: $input) {
      id
      jobId
      status
      jobType
      jobFamily
      createdAt
    }
  }
}`;

const CREATE_CONTACT360_IMPORT = `mutation CreateContact360Import($input: CreateContact360ImportInput!) {
  jobs {
    createContact360Import(input: $input) {
      id
      jobId
      status
      jobType
      jobFamily
      createdAt
    }
  }
}`;

const PAUSE_CONNECTRA_JOB = `mutation PauseConnectraJob($jobUuid: String!) {
  jobs {
    pauseConnectraJob(jobUuid: $jobUuid)
  }
}`;

const RESUME_CONNECTRA_JOB = `mutation ResumeConnectraJob($jobUuid: String!) {
  jobs {
    resumeConnectraJob(jobUuid: $jobUuid)
  }
}`;

const TERMINATE_CONNECTRA_JOB = `mutation TerminateConnectraJob($jobUuid: String!) {
  jobs {
    terminateConnectraJob(jobUuid: $jobUuid)
  }
}`;

export const jobsService = {
  list: async (opts?: {
    limit?: number;
    offset?: number;
    status?: string;
    jobType?: string;
    jobFamily?: string;
    /** When set, only jobs whose stored JSON payloads mention this string (e.g. S3 logical key). */
    relatedFileKey?: string | null;
  }) => {
    const data = await graphqlQuery<{
      jobs: {
        jobs: {
          jobs: JobRow[];
          pageInfo: {
            total: number;
            limit: number;
            offset: number;
          };
        };
      };
    }>(JOBS_LIST, {
      limit: opts?.limit ?? 25,
      offset: opts?.offset ?? 0,
      status: opts?.status ?? null,
      jobType: opts?.jobType ?? null,
      jobFamily: opts?.jobFamily ?? null,
      relatedFileKey: opts?.relatedFileKey?.trim() || null,
    });
    const conn = data.jobs.jobs;
    return {
      jobs: conn.jobs.map(mapJob),
      pageInfo: conn.pageInfo,
    };
  },

  /**
   * Scheduler jobs tied to an S3 object (email finder/verify inputCsvKey, import s3_key, etc.).
   * Returns raw rows so UIs can show `requestPayload` / `statusPayload`.
   */
  listRawForRelatedFile: async (
    relatedFileKey: string,
    opts?: { limit?: number },
  ): Promise<{
    jobs: JobRow[];
    pageInfo: { total: number; limit: number; offset: number };
  }> => {
    const data = await graphqlQuery<{
      jobs: {
        jobs: {
          jobs: JobRow[];
          pageInfo: { total: number; limit: number; offset: number };
        };
      };
    }>(JOBS_LIST_FULL, {
      limit: opts?.limit ?? 100,
      offset: 0,
      status: null,
      jobType: null,
      jobFamily: null,
      relatedFileKey: relatedFileKey.trim(),
    });
    const conn = data.jobs.jobs;
    return { jobs: conn.jobs, pageInfo: conn.pageInfo };
  },

  get: async (jobId: string) => {
    const data = await graphqlQuery<{
      jobs: { job: JobRow };
    }>(JOB_ONE, { jobId });
    return mapJob(data.jobs.job);
  },

  retry: (jobId: string) =>
    graphqlMutation<{ jobs: { retryJob: unknown } }>(RETRY_JOB, {
      input: { jobId },
    }),

  pause: (jobId: string) =>
    graphqlMutation<{ jobs: { pauseJob: unknown } }>(PAUSE_JOB, {
      input: { jobId },
    }),

  /** Gateway uses terminateJob on email.server jobs. */
  cancel: (jobId: string) =>
    graphqlMutation<{ jobs: { terminateJob: unknown } }>(TERMINATE_JOB, {
      input: { jobId },
    }),

  resume: (jobId: string) =>
    graphqlMutation<{ jobs: { resumeJob: unknown } }>(RESUME_JOB, {
      input: { jobId },
    }),

  /**
   * email.server POST /email/finder/s3 — requires uploaded CSV key in S3.
   * See `CreateEmailFinderExportInput` in API schema.
   */
  createEmailFinderExport: (input: {
    inputCsvKey: string;
    outputPrefix: string;
    s3Bucket?: string | null;
    csvColumns?: {
      email?: string | null;
      firstName?: string;
      lastName?: string;
      domain?: string;
    } | null;
  }) =>
    graphqlMutation<{ jobs: { createEmailFinderExport: JobRow } }>(
      CREATE_EMAIL_FINDER_EXPORT,
      { input },
    ),

  createEmailVerifyExport: (input: {
    inputCsvKey: string;
    outputPrefix: string;
    s3Bucket?: string | null;
    provider?: string | null;
    csvColumns?: {
      email?: string | null;
      firstName?: string;
      lastName?: string;
      domain?: string;
    } | null;
  }) =>
    graphqlMutation<{ jobs: { createEmailVerifyExport: JobRow } }>(
      CREATE_EMAIL_VERIFY_EXPORT,
      { input },
    ),

  createEmailPatternExport: (input: {
    inputCsvKey: string;
    outputPrefix: string;
    s3Bucket?: string | null;
    csvColumns?: {
      companyUuid?: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      domain?: string;
    } | null;
  }) =>
    graphqlMutation<{ jobs: { createEmailPatternExport: JobRow } }>(
      CREATE_EMAIL_PATTERN_EXPORT,
      { input },
    ),

  createContact360Export: (input: CreateContact360ExportInput) =>
    graphqlMutation<{ jobs: { createContact360Export: JobRow } }>(
      CREATE_CONTACT360_EXPORT,
      { input },
    ),

  createContact360Import: (input: CreateContact360ImportInput) =>
    graphqlMutation<{ jobs: { createContact360Import: JobRow } }>(
      CREATE_CONTACT360_IMPORT,
      { input },
    ),

  /** Pause a sync.server (Connectra) job directly by UUID. */
  pauseConnectraJob: (jobUuid: string) =>
    graphqlMutation<{ jobs: { pauseConnectraJob: unknown } }>(
      PAUSE_CONNECTRA_JOB,
      { jobUuid },
    ),

  /** Resume a paused sync.server (Connectra) job directly by UUID. */
  resumeConnectraJob: (jobUuid: string) =>
    graphqlMutation<{ jobs: { resumeConnectraJob: unknown } }>(
      RESUME_CONNECTRA_JOB,
      { jobUuid },
    ),

  /** Terminate a sync.server (Connectra) job directly by UUID. */
  terminateConnectraJob: (jobUuid: string) =>
    graphqlMutation<{ jobs: { terminateConnectraJob: unknown } }>(
      TERMINATE_CONNECTRA_JOB,
      { jobUuid },
    ),
};
