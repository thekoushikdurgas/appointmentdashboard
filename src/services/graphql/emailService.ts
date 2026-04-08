import { graphqlQuery, graphqlMutation } from "@/lib/graphqlClient";

export interface EmailResult {
  uuid: string;
  email: string;
  status?: string | null;
  source?: string | null;
}

export interface EmailFinderResponse {
  emails: EmailResult[];
  total: number;
  success: boolean;
}

export interface VerifiedEmailResult {
  email: string;
  status: string;
  emailState?: string | null;
  emailSubState?: string | null;
  certainty?: string | null;
}

export interface SingleEmailVerifierResponse {
  result: VerifiedEmailResult;
  success: boolean;
}

/** Matches gateway `EmailJobStatusResponse` (email.server GET /jobs/:id/status). */
export interface EmailJobStatusResponse {
  success?: boolean;
  jobId: string;
  jobTitle?: string | null;
  jobType?: string | null;
  status?: string | null;
  processedRows: number;
  progressPercent: number;
  credits?: number | null;
  outputCsvKey?: string | null;
  provider?: string | null;
  done: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface EmailPatternResult {
  uuid: string;
  companyUuid: string;
  patternFormat?: string | null;
  patternString?: string | null;
  isAutoExtracted?: boolean | null;
  domain: string;
  contactCount?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ComingSoonResponse {
  message: string;
  endpoint: string;
}

const FIND_EMAILS = `
  query FindEmails($input: EmailFinderInput!) {
    email {
      findEmails(input: $input) {
        emails { uuid email status source }
        total
        success
      }
    }
  }
`;

const VERIFY_SINGLE = `
  query VerifySingleEmail($input: SingleEmailVerifierInput!) {
    email {
      verifySingleEmail(input: $input) {
        result {
          email
          status
          emailState
          emailSubState
          certainty
        }
        success
      }
    }
  }
`;

const EMAIL_JOB_STATUS = `
  query EmailJobStatus($jobId: String!) {
    email {
      emailJobStatus(jobId: $jobId) {
        success
        jobId
        jobTitle
        jobType
        status
        processedRows
        progressPercent
        credits
        outputCsvKey
        provider
        done
        createdAt
        updatedAt
      }
    }
  }
`;

/** Returns arbitrary JSON from email.server POST /web/web-search. */
const WEB_SEARCH = `
  query WebSearch($input: WebSearchInput!) {
    email {
      webSearch(input: $input)
    }
  }
`;

/** Stub until export is implemented on satellite. */
const EXPORT_EMAILS = `
  query ExportEmailsComingSoon {
    email {
      exportEmails {
        message
        endpoint
      }
    }
  }
`;

const VERIFYEXPORT_EMAIL = `
  query VerifyExportEmailComingSoon {
    email {
      verifyexportEmail {
        message
        endpoint
      }
    }
  }
`;

const FIND_EMAILS_BULK = `
  query FindEmailsBulk($input: BulkEmailFinderInput!) {
    email {
      findEmailsBulk(input: $input) {
        processedCount
        totalRequested
        totalSuccessful
        results {
          firstName
          lastName
          domain
          source
          total
          success
          error
          emails {
            uuid
            email
            status
            source
          }
        }
      }
    }
  }
`;

const VERIFY_EMAILS_BULK = `
  query VerifyEmailsBulk($input: BulkEmailVerifierInput!) {
    email {
      verifyEmailsBulk(input: $input) {
        results {
          email
          status
          emailState
          emailSubState
          certainty
        }
        total
        validCount
        invalidCount
        catchallCount
        unknownCount
        riskyCount
        success
      }
    }
  }
`;

const ADD_EMAIL_PATTERN = `
  mutation AddEmailPattern($input: EmailPatternAddInput!) {
    email {
      addEmailPattern(input: $input) {
        uuid
        companyUuid
        patternFormat
        patternString
        isAutoExtracted
        domain
        contactCount
        createdAt
        updatedAt
      }
    }
  }
`;

const ADD_EMAIL_PATTERN_BULK = `
  mutation AddEmailPatternBulk($input: EmailPatternBulkAddInput!) {
    email {
      addEmailPatternBulk(input: $input) {
        total
        inserted
        skipped
        success
      }
    }
  }
`;

const PREDICT_EMAIL_PATTERN = `
  query PredictEmailPattern($input: EmailPatternPredictInput!) {
    email {
      predictEmailPattern(input: $input) {
        domain
        total
        success
        patterns {
          uuid
          patternFormat
          contactCount
          email
          successRate
          errorRate
          status
        }
      }
    }
  }
`;

const PREDICT_EMAIL_PATTERN_BULK = `
  query PredictEmailPatternBulk($input: BulkEmailPatternPredictInput!) {
    email {
      predictEmailPatternBulk(input: $input) {
        total
        success
        results {
          patterns {
            uuid
            patternFormat
            contactCount
            email
            successRate
            errorRate
            status
          }
        }
      }
    }
  }
`;

export interface EmailPatternPredictRow {
  uuid: string;
  patternFormat: string;
  contactCount: number;
  email: string;
  successRate?: number | null;
  errorRate?: number | null;
  status?: string | null;
}

export interface EmailPatternPredictResult {
  domain: string;
  total: number;
  success: boolean;
  patterns: EmailPatternPredictRow[];
}

export interface EmailPatternPredictBulkResult {
  total: number;
  success: boolean;
  results: Array<{ patterns: EmailPatternPredictRow[] }>;
}

export interface BulkEmailFinderResponse {
  processedCount: number;
  totalRequested: number;
  totalSuccessful: number;
  results: Array<{
    firstName: string;
    lastName: string;
    domain: string;
    emails: EmailResult[];
    source: string;
    total: number;
    success: boolean;
    error?: string | null;
  }>;
}

export interface BulkEmailVerifierResponse {
  results: VerifiedEmailResult[];
  total: number;
  validCount: number;
  invalidCount: number;
  catchallCount: number;
  unknownCount: number;
  riskyCount: number;
  success: boolean;
}

export const emailService = {
  findEmails: (input: {
    firstName: string;
    lastName: string;
    domain?: string | null;
    website?: string | null;
  }) =>
    graphqlQuery<{ email: { findEmails: EmailFinderResponse } }>(FIND_EMAILS, {
      input: {
        firstName: input.firstName,
        lastName: input.lastName,
        domain: input.domain ?? null,
        website: input.website ?? null,
      },
    }),

  verifySingleEmail: (input: { email: string; provider?: string | null }) =>
    graphqlQuery<{ email: { verifySingleEmail: SingleEmailVerifierResponse } }>(
      VERIFY_SINGLE,
      { input },
    ),

  findEmailsBulk: (
    items: Array<{ firstName: string; lastName: string; domain: string }>,
  ) =>
    graphqlQuery<{ email: { findEmailsBulk: BulkEmailFinderResponse } }>(
      FIND_EMAILS_BULK,
      {
        input: { items },
      },
    ),

  verifyEmailsBulk: (emails: string[], provider?: string | null) =>
    graphqlQuery<{ email: { verifyEmailsBulk: BulkEmailVerifierResponse } }>(
      VERIFY_EMAILS_BULK,
      {
        input: {
          emails,
          provider: provider ?? "mailtester",
        },
      },
    ),

  emailJobStatus: (jobId: string) =>
    graphqlQuery<{ email: { emailJobStatus: EmailJobStatusResponse } }>(
      EMAIL_JOB_STATUS,
      { jobId },
    ),

  /** Satellite returns JSON (e.g. list or map); normalize for UI if needed. */
  webSearch: (input: { fullName: string; companyDomain: string }) =>
    graphqlQuery<{ email: { webSearch: unknown } }>(WEB_SEARCH, { input }),

  exportEmailsComingSoon: () =>
    graphqlQuery<{ email: { exportEmails: ComingSoonResponse } }>(
      EXPORT_EMAILS,
      {},
    ),

  verifyexportEmailComingSoon: () =>
    graphqlQuery<{ email: { verifyexportEmail: ComingSoonResponse } }>(
      VERIFYEXPORT_EMAIL,
      {},
    ),

  addEmailPattern: (input: {
    companyUuid: string;
    email: string;
    firstName: string;
    lastName: string;
    domain: string;
  }) =>
    graphqlMutation<{ email: { addEmailPattern: EmailPatternResult } }>(
      ADD_EMAIL_PATTERN,
      { input },
    ),

  addEmailPatternBulk: (
    items: Array<{
      companyUuid: string;
      email: string;
      firstName: string;
      lastName: string;
      domain: string;
    }>,
  ) =>
    graphqlMutation<{
      email: {
        addEmailPatternBulk: {
          total: number | null;
          inserted: number | null;
          skipped: number | null;
          success: boolean;
        };
      };
    }>(ADD_EMAIL_PATTERN_BULK, { input: { items } }),

  predictEmailPattern: (input: {
    firstName: string;
    lastName: string;
    domain: string;
  }) =>
    graphqlQuery<{ email: { predictEmailPattern: EmailPatternPredictResult } }>(
      PREDICT_EMAIL_PATTERN,
      { input },
    ),

  predictEmailPatternBulk: (
    items: Array<{ firstName: string; lastName: string; domain: string }>,
  ) =>
    graphqlQuery<{
      email: { predictEmailPatternBulk: EmailPatternPredictBulkResult };
    }>(PREDICT_EMAIL_PATTERN_BULK, { input: { items } }),

  /** @deprecated Use `findEmails`. */
  findSingle: (input: {
    firstName: string;
    lastName: string;
    domain: string;
  }) => emailService.findEmails(input),

  /** @deprecated Use `verifySingleEmail`. */
  verifySingle: (email: string) =>
    emailService.verifySingleEmail({ email, provider: "mailtester" }),
};
