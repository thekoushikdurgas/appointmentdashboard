import { graphqlQuery, graphqlMutation } from "@/lib/graphqlClient";

/** Wallet + plan; API returns unlimited-style values for SuperAdmin/Admin. */
export interface BillingInfoRow {
  credits: number;
  creditsUsed: number;
  creditsLimit: number;
  addonCredits?: number;
  dailyCreditsLimit?: number;
  subscriptionPlan: string;
  subscriptionPeriod: string | null;
  subscriptionStatus: string;
  subscriptionStartedAt: string | null;
  subscriptionEndsAt: string | null;
  usagePercentage: number;
}

export interface Invoice {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  description: string | null;
}

export interface SavingsRow {
  amount?: number | null;
  percentage?: number | null;
}

export interface PlanPeriodRow {
  period: string;
  credits: number;
  dailyCreditsLimit: number;
  ratePerCredit: number;
  price: number;
  savings?: SavingsRow | null;
}

export interface PlanPeriodsRow {
  monthly?: PlanPeriodRow | null;
  quarterly?: PlanPeriodRow | null;
  yearly?: PlanPeriodRow | null;
}

export interface PlanFeatureRow {
  id: number;
  label: string;
  sortOrder: number;
}

export interface SubscriptionPlanRow {
  category: string;
  name: string;
  periods: PlanPeriodsRow;
  features?: PlanFeatureRow[];
}

export interface SubscribeResult {
  message: string;
  subscriptionPlan: string;
  subscriptionPeriod: string;
  credits: number;
  subscriptionEndsAt: string | null;
}

export interface CancelSubscriptionResult {
  message: string;
  subscriptionStatus: string;
}

export interface PurchaseAddonResult {
  message: string;
  package: string;
  creditsAdded: number;
  totalCredits: number;
}

export interface AddonPackage {
  id: string;
  name: string;
  credits: number;
  ratePerCredit: number;
  price: number;
}

/** UPI / QR manual payment instructions (gateway shape). */
export interface PaymentInstructions {
  upiId: string;
  phoneNumber: string;
  email: string;
  qrCodeS3Key?: string | null;
  qrCodeBucketId?: string | null;
  qrCodeDownloadUrl?: string | null;
}

export interface PaymentReceiptUploadResult {
  fileKey: string;
}

export interface PaymentSubmission {
  id: string;
  userId: string;
  amount: number;
  screenshotS3Key: string;
  creditsToAdd: number;
  status: string;
  planCategory?: string | null;
  planPeriod?: string | null;
  addonPackageId?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  declineReason?: string | null;
  userEmail?: string | null;
  userBucket?: string | null;
  screenshotDownloadUrl?: string | null;
}

export interface PaymentSubmissionConnection {
  items: PaymentSubmission[];
  total: number;
  limit: number;
  offset: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

const PLAN_PERIOD_FIELDS = `
  period
  credits
  dailyCreditsLimit
  ratePerCredit
  price
  savings {
    amount
    percentage
  }
`;

const BILLING_CORE = `query BillingCore {
  billing {
    billing {
      credits
      creditsUsed
      creditsLimit
      addonCredits
      dailyCreditsLimit
      subscriptionPlan
      subscriptionPeriod
      subscriptionStatus
      subscriptionStartedAt
      subscriptionEndsAt
      usagePercentage
    }
  }
}`;

const BILLING_PLANS = `query BillingPlans {
  billing {
    plans {
      category
      name
      periods {
        monthly { ${PLAN_PERIOD_FIELDS} }
        quarterly { ${PLAN_PERIOD_FIELDS} }
        yearly { ${PLAN_PERIOD_FIELDS} }
      }
      features {
        id
        label
        sortOrder
      }
    }
  }
}`;

const BILLING_INVOICES = `query BillingInvoices($pagination: InvoicePaginationInput) {
  billing {
    invoices(pagination: $pagination) {
      items {
        id
        amount
        status
        createdAt
        description
      }
      total
      limit
      offset
      hasNext
      hasPrevious
    }
  }
}`;

const SUBSCRIBE = `mutation BillingSubscribe($input: SubscribeInput!) {
  billing {
    subscribe(input: $input) {
      message
      subscriptionPlan
      subscriptionPeriod
      credits
      subscriptionEndsAt
    }
  }
}`;

const ADDONS_QUERY = `query BillingAddons {
  billing {
    addons {
      id
      name
      credits
      ratePerCredit
      price
    }
  }
}`;

const PAYMENT_INSTRUCTIONS_QUERY = `query PaymentInstructions {
  billing {
    paymentInstructions {
      upiId
      phoneNumber
      email
      qrCodeS3Key
      qrCodeBucketId
      qrCodeDownloadUrl
    }
  }
}`;

const MY_PAYMENT_SUBMISSIONS_QUERY = `query MyPaymentSubmissions($status: String, $limit: Int!, $offset: Int!) {
  billing {
    myPaymentSubmissions(status: $status, limit: $limit, offset: $offset) {
      items {
        id
        amount
        screenshotS3Key
        creditsToAdd
        status
        planCategory
        planPeriod
        addonPackageId
        createdAt
        reviewedAt
        declineReason
        screenshotDownloadUrl
      }
      total
      limit
      offset
      hasNext
      hasPrevious
    }
  }
}`;

const PAYMENT_SUBMISSIONS_QUERY = `query PaymentSubmissions($status: String, $limit: Int!, $offset: Int!) {
  billing {
    paymentSubmissions(status: $status, limit: $limit, offset: $offset) {
      items {
        id
        userId
        amount
        screenshotS3Key
        creditsToAdd
        status
        planCategory
        planPeriod
        addonPackageId
        createdAt
        reviewedAt
        reviewedBy
        declineReason
        userEmail
        userBucket
        screenshotDownloadUrl
      }
      total
      limit
      offset
      hasNext
      hasPrevious
    }
  }
}`;

const CANCEL_SUBSCRIPTION = `mutation CancelSubscription {
  billing {
    cancelSubscription {
      message
      subscriptionStatus
    }
  }
}`;

const PURCHASE_ADDON = `mutation PurchaseAddon($input: PurchaseAddonInput!) {
  billing {
    purchaseAddon(input: $input) {
      message
      package
      creditsAdded
      totalCredits
    }
  }
}`;

const UPDATE_PAYMENT_INSTRUCTIONS = `mutation UpdatePaymentInstructions($input: UpdatePaymentInstructionsInput!) {
  billing {
    updatePaymentInstructions(input: $input) {
      upiId
      phoneNumber
      email
      qrCodeS3Key
      qrCodeBucketId
      qrCodeDownloadUrl
    }
  }
}`;

const APPROVE_PAYMENT = `mutation ApprovePayment($submissionId: String!) {
  billing {
    approvePayment(submissionId: $submissionId) {
      id
      status
      amount
      creditsToAdd
      reviewedAt
    }
  }
}`;

const DECLINE_PAYMENT = `mutation DeclinePayment($input: DeclinePaymentInput!) {
  billing {
    declinePayment(input: $input) {
      id
      status
      declineReason
      reviewedAt
    }
  }
}`;

const UPLOAD_PAYMENT_RECEIPT_PHOTO = `mutation UploadPaymentReceiptPhoto($input: UploadPaymentReceiptPhotoInput!) {
  billing {
    uploadPaymentReceiptPhoto(input: $input) {
      fileKey
    }
  }
}`;

const SUBMIT_PAYMENT_PROOF = `mutation SubmitPaymentProof($input: SubmitPaymentProofInput!) {
  billing {
    submitPaymentProof(input: $input) {
      id
      status
      amount
      creditsToAdd
      screenshotS3Key
      createdAt
    }
  }
}`;

export const billingService = {
  getBillingInfo: () =>
    graphqlQuery<{ billing: { billing: BillingInfoRow } }>(BILLING_CORE),

  getPlans: () =>
    graphqlQuery<{ billing: { plans: SubscriptionPlanRow[] } }>(
      BILLING_PLANS,
      {},
      { skipAuth: true },
    ),

  getInvoices: (pagination?: { limit?: number; offset?: number }) =>
    graphqlQuery<{
      billing: {
        invoices: {
          items: Invoice[];
          total: number;
          limit: number;
          offset: number;
          hasNext: boolean;
          hasPrevious: boolean;
        };
      };
    }>(BILLING_INVOICES, {
      pagination: pagination ?? { limit: 25, offset: 0 },
    }),

  getAddons: () =>
    graphqlQuery<{ billing: { addons: AddonPackage[] } }>(ADDONS_QUERY),

  getPaymentInstructions: () =>
    graphqlQuery<{
      billing: { paymentInstructions: PaymentInstructions | null };
    }>(PAYMENT_INSTRUCTIONS_QUERY),

  getMyPaymentSubmissions: (args?: {
    status?: string | null;
    limit?: number;
    offset?: number;
  }) =>
    graphqlQuery<{
      billing: { myPaymentSubmissions: PaymentSubmissionConnection };
    }>(MY_PAYMENT_SUBMISSIONS_QUERY, {
      status: args?.status ?? null,
      limit: args?.limit ?? 50,
      offset: args?.offset ?? 0,
    }),

  getPaymentSubmissions: (args?: {
    status?: string | null;
    limit?: number;
    offset?: number;
  }) =>
    graphqlQuery<{
      billing: { paymentSubmissions: PaymentSubmissionConnection };
    }>(PAYMENT_SUBMISSIONS_QUERY, {
      status: args?.status ?? null,
      limit: args?.limit ?? 50,
      offset: args?.offset ?? 0,
    }),

  subscribe: (input: { category: string; period: string }) =>
    graphqlMutation<{ billing: { subscribe: SubscribeResult } }>(SUBSCRIBE, {
      input: {
        category: input.category.trim().toUpperCase(),
        period: input.period,
      },
    }),

  /** @deprecated Alias for `subscribe` (category + period). */
  upgradePlan: (input: { plan: string; period?: string }) =>
    graphqlMutation<{ billing: { subscribe: SubscribeResult } }>(SUBSCRIBE, {
      input: {
        category: input.plan.trim().toUpperCase(),
        period: input.period ?? "monthly",
      },
    }),

  cancelSubscription: () =>
    graphqlMutation<{
      billing: { cancelSubscription: CancelSubscriptionResult };
    }>(CANCEL_SUBSCRIPTION, {}),

  purchaseAddon: (input: { packageId: string }) =>
    graphqlMutation<{ billing: { purchaseAddon: PurchaseAddonResult } }>(
      PURCHASE_ADDON,
      { input },
    ),

  updatePaymentInstructions: (input: {
    upiId: string;
    phoneNumber: string;
    email: string;
    qrCodeS3Key?: string | null;
    qrCodeBucketId?: string | null;
  }) =>
    graphqlMutation<{
      billing: { updatePaymentInstructions: PaymentInstructions };
    }>(UPDATE_PAYMENT_INSTRUCTIONS, { input }),

  approvePayment: (submissionId: string) =>
    graphqlMutation<{ billing: { approvePayment: PaymentSubmission } }>(
      APPROVE_PAYMENT,
      { submissionId },
    ),

  declinePayment: (input: { submissionId: string; reason: string }) =>
    graphqlMutation<{ billing: { declinePayment: PaymentSubmission } }>(
      DECLINE_PAYMENT,
      { input },
    ),

  uploadPaymentReceiptPhoto: (input: {
    imageBase64: string;
    mimeType: string;
  }) =>
    graphqlMutation<{
      billing: { uploadPaymentReceiptPhoto: PaymentReceiptUploadResult };
    }>(UPLOAD_PAYMENT_RECEIPT_PHOTO, { input }, { showToastOnError: false }),

  submitPaymentProof: (input: {
    amount: number;
    screenshotS3Key: string;
    creditsToAdd: number;
    planCategory?: string | null;
    planPeriod?: string | null;
    addonPackageId?: string | null;
  }) =>
    graphqlMutation<{ billing: { submitPaymentProof: PaymentSubmission } }>(
      SUBMIT_PAYMENT_PROOF,
      { input },
    ),
};
