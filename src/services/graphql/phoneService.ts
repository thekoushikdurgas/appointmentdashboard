import { graphqlQuery } from "@/lib/graphqlClient";
import {
  FIND_PHONE,
  VERIFY_PHONE,
  PHONE_JOB_STATUS,
  PHONE_SATELLITE_JOBS,
} from "@/graphql/phoneOperations";

export interface PhoneFinderInput {
  firstName: string;
  lastName: string;
  domain?: string | null;
  website?: string | null;
}

export interface SinglePhoneVerifierInput {
  email: string;
  provider?: string | null;
}

export const phoneService = {
  findPhone: async (
    input: PhoneFinderInput,
  ): Promise<{ phone: { findPhone: unknown } }> =>
    graphqlQuery(FIND_PHONE, {
      input: {
        firstName: input.firstName,
        lastName: input.lastName,
        domain: input.domain ?? null,
        website: input.website ?? null,
      },
    }),

  verifyPhone: async (
    input: SinglePhoneVerifierInput,
  ): Promise<{ phone: { verifyPhone: unknown } }> =>
    graphqlQuery(VERIFY_PHONE, {
      input: {
        email: input.email,
        provider: input.provider ?? null,
      },
    }),

  phoneJobStatus: async (
    jobId: string,
  ): Promise<{ phone: { phoneJobStatus: unknown } }> =>
    graphqlQuery(PHONE_JOB_STATUS, { jobId }),

  phoneSatelliteJobs: async (): Promise<{
    phone: { phoneSatelliteJobs: unknown };
  }> => graphqlQuery(PHONE_SATELLITE_JOBS),
};
