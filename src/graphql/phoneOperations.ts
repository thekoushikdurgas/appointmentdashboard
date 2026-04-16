/**
 * GraphQL documents for gateway `phone` namespace (phone.server satellite).
 * @see contact360.io/api app/graphql/modules/phone/
 */

export const FIND_PHONE = `
  query FindPhone($input: PhoneFinderInput!) {
    phone {
      findPhone(input: $input)
    }
  }
`;

export const VERIFY_PHONE = `
  query VerifyPhone($input: SinglePhoneVerifierInput!) {
    phone {
      verifyPhone(input: $input)
    }
  }
`;

export const PHONE_JOB_STATUS = `
  query PhoneJobStatus($jobId: String!) {
    phone {
      phoneJobStatus(jobId: $jobId)
    }
  }
`;

export const PHONE_SATELLITE_JOBS = `
  query PhoneSatelliteJobs {
    phone {
      phoneSatelliteJobs
    }
  }
`;
