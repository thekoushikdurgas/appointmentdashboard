import { graphqlQuery, graphqlMutation } from "@/lib/graphqlClient";

/** Wallet + plan; API returns unlimited-style values only for SuperAdmin. */
export interface BillingInfoRow {
  credits: number;
  creditsUsed: number;
  creditsLimit: number;
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
  ratePerCredit: number;
  price: number;
  savings?: SavingsRow | null;
}

export interface PlanPeriodsRow {
  monthly?: PlanPeriodRow | null;
  quarterly?: PlanPeriodRow | null;
  yearly?: PlanPeriodRow | null;
}

export interface SubscriptionPlanRow {
  tier: string;
  name: string;
  category: string;
  periods: PlanPeriodsRow;
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
  planTier?: string | null;
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

export interface CreatePlanResult {
  message: string;
  tier: string;
}

export interface UpdatePlanResult {
  message: string;
  tier: string;
}

export interface DeletePlanResult {
  message: string;
  tier: string;
}

export interface CreateAddonResult {
  message: string;
  id: string;
}

export interface UpdateAddonResult {
  message: string;
  id: string;
}

export interface DeleteAddonResult {
  message: string;
  id: string;
}

const PLAN_PERIOD_FIELDS = `
  period
  credits
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
      tier
      name
      category
      periods {
        monthly { ${PLAN_PERIOD_FIELDS} }
        quarterly { ${PLAN_PERIOD_FIELDS} }
        yearly { ${PLAN_PERIOD_FIELDS} }
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
        planTier
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
        planTier
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

const CREATE_PLAN = `mutation CreatePlan($input: CreatePlanInput!) {
  billing {
    createPlan(input: $input) {
      message
      tier
    }
  }
}`;

const UPDATE_PLAN = `mutation UpdatePlan($tier: String!, $input: UpdatePlanInput!) {
  billing {
    updatePlan(tier: $tier, input: $input) {
      message
      tier
    }
  }
}`;

const DELETE_PLAN = `mutation DeletePlan($tier: String!) {
  billing {
    deletePlan(tier: $tier) {
      message
      tier
    }
  }
}`;

const CREATE_ADDON = `mutation CreateAddon($input: CreateAddonInput!) {
  billing {
    createAddon(input: $input) {
      message
      id
    }
  }
}`;

const UPDATE_ADDON = `mutation UpdateAddon($packageId: String!, $input: UpdateAddonInput!) {
  billing {
    updateAddon(packageId: $packageId, input: $input) {
      message
      id
    }
  }
}`;

const DELETE_ADDON = `mutation DeleteAddon($packageId: String!) {
  billing {
    deleteAddon(packageId: $packageId) {
      message
      id
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

  subscribe: (input: { tier: string; period: string }) =>
    graphqlMutation<{ billing: { subscribe: SubscribeResult } }>(SUBSCRIBE, {
      input,
    }),

  /** @deprecated Alias for `subscribe` (tier + period). */
  upgradePlan: (input: { plan: string; period?: string }) =>
    graphqlMutation<{ billing: { subscribe: SubscribeResult } }>(SUBSCRIBE, {
      input: { tier: input.plan, period: input.period ?? "monthly" },
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

  createPlan: (input: unknown) =>
    graphqlMutation<{ billing: { createPlan: CreatePlanResult } }>(
      CREATE_PLAN,
      { input },
    ),

  updatePlan: (tier: string, input: unknown) =>
    graphqlMutation<{ billing: { updatePlan: UpdatePlanResult } }>(
      UPDATE_PLAN,
      { tier, input },
    ),

  deletePlan: (tier: string) =>
    graphqlMutation<{ billing: { deletePlan: DeletePlanResult } }>(
      DELETE_PLAN,
      { tier },
    ),

  createAddon: (input: {
    id: string;
    name: string;
    credits: number;
    ratePerCredit: number;
    price: number;
    isActive?: boolean;
  }) =>
    graphqlMutation<{ billing: { createAddon: CreateAddonResult } }>(
      CREATE_ADDON,
      { input },
    ),

  updateAddon: (packageId: string, input: unknown) =>
    graphqlMutation<{ billing: { updateAddon: UpdateAddonResult } }>(
      UPDATE_ADDON,
      { packageId, input },
    ),

  deleteAddon: (packageId: string) =>
    graphqlMutation<{ billing: { deleteAddon: DeleteAddonResult } }>(
      DELETE_ADDON,
      { packageId },
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
    }>(UPLOAD_PAYMENT_RECEIPT_PHOTO, { input }),

  submitPaymentProof: (input: {
    amount: number;
    screenshotS3Key: string;
    creditsToAdd: number;
    planTier?: string | null;
    planPeriod?: string | null;
    addonPackageId?: string | null;
  }) =>
    graphqlMutation<{ billing: { submitPaymentProof: PaymentSubmission } }>(
      SUBMIT_PAYMENT_PROOF,
      { input },
    ),
};
