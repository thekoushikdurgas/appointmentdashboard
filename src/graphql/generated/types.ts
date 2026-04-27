export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T,
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never;
    };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  BigInt: { input: string; output: string };
  DateTime: { input: any; output: any };
  JSON: { input: Record<string, unknown>; output: Record<string, unknown> };
};

export type AiChat = {
  createdAt: Scalars["DateTime"]["output"];
  messages: Array<Message>;
  title: Scalars["String"]["output"];
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
  userId: Scalars["String"]["output"];
  uuid: Scalars["String"]["output"];
};

export type AiChatConnection = {
  items: Array<AiChatListItem>;
  pageInfo: PageInfo;
};

export type AiChatFilterInput = {
  /** Filter chats created after the provided timestamp (inclusive) */
  createdAtAfter?: InputMaybe<Scalars["DateTime"]["input"]>;
  /** Filter chats created before the provided timestamp (inclusive) */
  createdAtBefore?: InputMaybe<Scalars["DateTime"]["input"]>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  /** Order by field. Prepend '-' for descending. Valid: 'created_at', 'updated_at', '-created_at', '-updated_at' */
  ordering?: InputMaybe<Scalars["String"]["input"]>;
  /** General-purpose search term applied across chat text columns */
  search?: InputMaybe<Scalars["String"]["input"]>;
  /** Case-insensitive substring match against chat title */
  title?: InputMaybe<Scalars["String"]["input"]>;
};

export type AiChatListItem = {
  createdAt: Scalars["DateTime"]["output"];
  title: Scalars["String"]["output"];
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
  uuid: Scalars["String"]["output"];
};

export type AiChatMutation = {
  analyzeEmailRisk: EmailRiskAnalysisResponse;
  createAIChat: AiChat;
  deleteAIChat: Scalars["Boolean"]["output"];
  generateCompanySummary: CompanySummaryResponse;
  parseContactFilters: ParseFiltersResponse;
  sendMessage: AiChat;
  updateAIChat: AiChat;
};

export type AiChatMutationAnalyzeEmailRiskArgs = {
  input: AnalyzeEmailRiskInput;
};

export type AiChatMutationCreateAiChatArgs = {
  input: CreateAiChatInput;
};

export type AiChatMutationDeleteAiChatArgs = {
  chatId: Scalars["String"]["input"];
};

export type AiChatMutationGenerateCompanySummaryArgs = {
  input: GenerateCompanySummaryInput;
};

export type AiChatMutationParseContactFiltersArgs = {
  input: ParseFiltersInput;
};

export type AiChatMutationSendMessageArgs = {
  chatId: Scalars["String"]["input"];
  input: SendMessageInput;
};

export type AiChatMutationUpdateAiChatArgs = {
  chatId: Scalars["String"]["input"];
  input: UpdateAiChatInput;
};

export type AiChatQuery = {
  aiChat: AiChat;
  aiChats: AiChatConnection;
};

export type AiChatQueryAiChatArgs = {
  chatId: Scalars["String"]["input"];
};

export type AiChatQueryAiChatsArgs = {
  filters?: InputMaybe<AiChatFilterInput>;
};

export type ApiKey = {
  createdAt: Scalars["DateTime"]["output"];
  expiresAt?: Maybe<Scalars["DateTime"]["output"]>;
  id: Scalars["ID"]["output"];
  key?: Maybe<Scalars["String"]["output"]>;
  lastUsedAt?: Maybe<Scalars["DateTime"]["output"]>;
  name: Scalars["String"]["output"];
  prefix: Scalars["String"]["output"];
  readAccess: Scalars["Boolean"]["output"];
  writeAccess: Scalars["Boolean"]["output"];
};

export type ApiKeyList = {
  keys: Array<ApiKey>;
  total: Scalars["Int"]["output"];
};

export type AbortUploadInput = {
  uploadId: Scalars["String"]["input"];
};

export type AbortUploadResponse = {
  status: Scalars["String"]["output"];
  uploadId: Scalars["String"]["output"];
};

export type Activity = {
  actionType: Scalars["String"]["output"];
  createdAt: Scalars["DateTime"]["output"];
  errorMessage?: Maybe<Scalars["String"]["output"]>;
  id: Scalars["Int"]["output"];
  ipAddress?: Maybe<Scalars["String"]["output"]>;
  requestParams?: Maybe<Scalars["JSON"]["output"]>;
  resultCount: Scalars["Int"]["output"];
  resultSummary?: Maybe<Scalars["JSON"]["output"]>;
  serviceType: Scalars["String"]["output"];
  status: Scalars["String"]["output"];
  userAgent?: Maybe<Scalars["String"]["output"]>;
  userId: Scalars["ID"]["output"];
};

export type ActivityConnection = {
  hasNext: Scalars["Boolean"]["output"];
  hasPrevious: Scalars["Boolean"]["output"];
  items: Array<Activity>;
  limit: Scalars["Int"]["output"];
  offset: Scalars["Int"]["output"];
  total: Scalars["Int"]["output"];
};

export type ActivityFilterInput = {
  actionType?: InputMaybe<Scalars["String"]["input"]>;
  endDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  serviceType?: InputMaybe<Scalars["String"]["input"]>;
  startDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  status?: InputMaybe<Scalars["String"]["input"]>;
};

export type ActivityQuery = {
  activities: ActivityConnection;
  activityStats: ActivityStats;
};

export type ActivityQueryActivitiesArgs = {
  filters?: InputMaybe<ActivityFilterInput>;
};

export type ActivityQueryActivityStatsArgs = {
  filters?: InputMaybe<ActivityStatsInput>;
};

export type ActivityStats = {
  byActionType: Scalars["JSON"]["output"];
  byServiceType: Scalars["JSON"]["output"];
  byStatus: Scalars["JSON"]["output"];
  recentActivities: Scalars["Int"]["output"];
  totalActivities: Scalars["Int"]["output"];
};

export type ActivityStatsInput = {
  endDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  startDate?: InputMaybe<Scalars["DateTime"]["input"]>;
};

export type AddSequenceStepInput = {
  body?: InputMaybe<Scalars["String"]["input"]>;
  delayHours?: InputMaybe<Scalars["Int"]["input"]>;
  stepType: Scalars["String"]["input"];
  subject?: InputMaybe<Scalars["String"]["input"]>;
  templateId?: InputMaybe<Scalars["String"]["input"]>;
};

export type AddonPackage = {
  credits: Scalars["Int"]["output"];
  id: Scalars["String"]["output"];
  name: Scalars["String"]["output"];
  price: Scalars["Float"]["output"];
  ratePerCredit: Scalars["Float"]["output"];
};

export type AdminMutation = {
  createLog: LogEntry;
  createLogsBatch: Array<LogEntry>;
  deleteLog: Scalars["Boolean"]["output"];
  deleteLogsBulk: DeleteLogsBulkResponse;
  deleteUser: Scalars["Boolean"]["output"];
  promoteToAdmin: User;
  promoteToSuperAdmin: User;
  requestDangerousOperationApproval: DangerousApprovalTicket;
  runSubscriptionExpirySweep: Scalars["Int"]["output"];
  updateJobTicketStatus: JobTicket;
  updateLog: LogEntry;
  updateUserCredits: User;
  updateUserRole: User;
};

export type AdminMutationCreateLogArgs = {
  input: CreateLogInput;
};

export type AdminMutationCreateLogsBatchArgs = {
  input: CreateLogsBatchInput;
};

export type AdminMutationDeleteLogArgs = {
  input: DeleteLogInput;
};

export type AdminMutationDeleteLogsBulkArgs = {
  input: DeleteLogsBulkInput;
};

export type AdminMutationDeleteUserArgs = {
  input: DeleteUserInput;
};

export type AdminMutationPromoteToAdminArgs = {
  input: PromoteToAdminInput;
};

export type AdminMutationPromoteToSuperAdminArgs = {
  input: PromoteToSuperAdminInput;
};

export type AdminMutationRequestDangerousOperationApprovalArgs = {
  input: RequestDangerousApprovalInput;
};

export type AdminMutationRunSubscriptionExpirySweepArgs = {
  limit?: Scalars["Int"]["input"];
  maxBatches?: Scalars["Int"]["input"];
};

export type AdminMutationUpdateJobTicketStatusArgs = {
  input: UpdateJobTicketStatusInput;
};

export type AdminMutationUpdateLogArgs = {
  input: UpdateLogInput;
};

export type AdminMutationUpdateUserCreditsArgs = {
  input: UpdateUserCreditsInput;
};

export type AdminMutationUpdateUserRoleArgs = {
  input: UpdateUserRoleInput;
};

export type AdminQuery = {
  graphqlAuditEvents: Array<GraphQlAuditEventGql>;
  jobTicket: JobTicket;
  jobTickets: JobTicketConnection;
  logStatistics: LogStatistics;
  logs: LogConnection;
  schedulerJobs: JobConnection;
  searchLogs: LogSearchConnection;
  userHistory: UserHistoryConnection;
  userStats: AdminUserStats;
  users: UserConnection;
  usersWithBuckets: UserConnection;
};

export type AdminQueryGraphqlAuditEventsArgs = {
  limit?: Scalars["Int"]["input"];
  offset?: Scalars["Int"]["input"];
};

export type AdminQueryJobTicketArgs = {
  ticketId: Scalars["ID"]["input"];
};

export type AdminQueryJobTicketsArgs = {
  externalJobId?: InputMaybe<Scalars["String"]["input"]>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  status?: InputMaybe<Scalars["String"]["input"]>;
  userId?: InputMaybe<Scalars["ID"]["input"]>;
};

export type AdminQueryLogStatisticsArgs = {
  timeRange?: Scalars["String"]["input"];
};

export type AdminQueryLogsArgs = {
  filters?: InputMaybe<LogQueryFilterInput>;
};

export type AdminQuerySchedulerJobsArgs = {
  jobFamily?: InputMaybe<Scalars["String"]["input"]>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  sourceService?: InputMaybe<Scalars["String"]["input"]>;
  status?: InputMaybe<Scalars["String"]["input"]>;
  userId?: InputMaybe<Scalars["ID"]["input"]>;
};

export type AdminQuerySearchLogsArgs = {
  input: LogSearchInput;
};

export type AdminQueryUserHistoryArgs = {
  filters?: InputMaybe<UserHistoryFilterInput>;
};

export type AdminQueryUsersArgs = {
  filters?: InputMaybe<UserFilterInput>;
};

export type AdminQueryUsersWithBucketsArgs = {
  filters?: InputMaybe<UserFilterInput>;
};

export type AdminUserStats = {
  activeUsers: Scalars["Int"]["output"];
  totalUsers: Scalars["Int"]["output"];
  usersByPlan: Scalars["JSON"]["output"];
  usersByRole: Scalars["JSON"]["output"];
};

export type AggregateMetricsInput = {
  /** End date for aggregation */
  endDate: Scalars["DateTime"]["input"];
  /** Name of the metric to aggregate (e.g., 'LCP', 'FID', 'CLS') */
  metricName: Scalars["String"]["input"];
  /** Start date for aggregation */
  startDate: Scalars["DateTime"]["input"];
};

export type AnalyticsMutation = {
  submitPerformanceMetric: PerformanceMetricResponse;
};

export type AnalyticsMutationSubmitPerformanceMetricArgs = {
  input: SubmitPerformanceMetricInput;
};

export type AnalyticsQuery = {
  aggregateMetrics: MetricAggregation;
  performanceMetrics: Array<PerformanceMetric>;
};

export type AnalyticsQueryAggregateMetricsArgs = {
  input: AggregateMetricsInput;
};

export type AnalyticsQueryPerformanceMetricsArgs = {
  input?: InputMaybe<GetMetricsInput>;
};

export type AnalyzeEmailRiskInput = {
  /** Email address to analyze. Must be a valid email format. */
  email: Scalars["String"]["input"];
};

export type ApiHealth = {
  environment: Scalars["String"]["output"];
  status: Scalars["String"]["output"];
};

export type ApiMetadata = {
  buildSha?: Maybe<Scalars["String"]["output"]>;
  docs: Scalars["String"]["output"];
  gitRef?: Maybe<Scalars["String"]["output"]>;
  name: Scalars["String"]["output"];
  version: Scalars["String"]["output"];
};

export type AuthMutation = {
  completeTwoFactorLogin: AuthPayload;
  login: AuthPayload;
  logout: Scalars["Boolean"]["output"];
  refreshToken: AuthPayload;
  register: AuthPayload;
  requestPasswordReset: Scalars["Boolean"]["output"];
  resetPassword: Scalars["Boolean"]["output"];
};

export type AuthMutationCompleteTwoFactorLoginArgs = {
  input: CompleteTwoFactorLoginInput;
  pageType?: InputMaybe<Scalars["String"]["input"]>;
};

export type AuthMutationLoginArgs = {
  input: LoginInput;
  pageType?: InputMaybe<Scalars["String"]["input"]>;
};

export type AuthMutationRefreshTokenArgs = {
  input: RefreshTokenInput;
  pageType?: InputMaybe<Scalars["String"]["input"]>;
};

export type AuthMutationRegisterArgs = {
  input: RegisterInput;
  pageType?: InputMaybe<Scalars["String"]["input"]>;
};

export type AuthMutationRequestPasswordResetArgs = {
  input: RequestPasswordResetInput;
};

export type AuthMutationResetPasswordArgs = {
  input: ResetPasswordInput;
};

export type AuthPayload = {
  accessToken: Scalars["String"]["output"];
  challengeToken?: Maybe<Scalars["String"]["output"]>;
  pages?: Maybe<Array<PageSummary>>;
  refreshToken: Scalars["String"]["output"];
  twoFactorRequired: Scalars["Boolean"]["output"];
  user: UserInfo;
};

export type AuthQuery = {
  me?: Maybe<User>;
  session: SessionInfo;
};

export type BatchCreateContactsInput = {
  contacts: Array<CreateContactInput>;
};

export type BillingInfo = {
  credits: Scalars["Int"]["output"];
  creditsLimit: Scalars["Int"]["output"];
  creditsUsed: Scalars["Int"]["output"];
  subscriptionEndsAt?: Maybe<Scalars["DateTime"]["output"]>;
  subscriptionPeriod?: Maybe<Scalars["String"]["output"]>;
  subscriptionPlan: Scalars["String"]["output"];
  subscriptionStartedAt?: Maybe<Scalars["DateTime"]["output"]>;
  subscriptionStatus: Scalars["String"]["output"];
  usagePercentage: Scalars["Float"]["output"];
};

export type BillingMutation = {
  approvePayment: PaymentSubmission;
  cancelSubscription: CancelSubscriptionResult;
  createAddon: CreateAddonResult;
  createPlan: CreatePlanResult;
  createPlanPeriod: CreatePlanPeriodResult;
  declinePayment: PaymentSubmission;
  deleteAddon: DeleteAddonResult;
  deletePlan: DeletePlanResult;
  deletePlanPeriod: DeletePlanPeriodResult;
  purchaseAddon: PurchaseAddonResult;
  submitPaymentProof: PaymentSubmission;
  subscribe: SubscribeResult;
  updateAddon: UpdateAddonResult;
  updatePaymentInstructions: PaymentInstructions;
  updatePlan: UpdatePlanResult;
  updatePlanPeriod: CreatePlanPeriodResult;
  uploadPaymentReceiptPhoto: PaymentReceiptUploadResult;
};

export type BillingMutationApprovePaymentArgs = {
  submissionId: Scalars["String"]["input"];
};

export type BillingMutationCreateAddonArgs = {
  input: CreateAddonInput;
};

export type BillingMutationCreatePlanArgs = {
  input: CreatePlanInput;
};

export type BillingMutationCreatePlanPeriodArgs = {
  input: CreatePlanPeriodInput;
  tier: Scalars["String"]["input"];
};

export type BillingMutationDeclinePaymentArgs = {
  input: DeclinePaymentInput;
};

export type BillingMutationDeleteAddonArgs = {
  packageId: Scalars["String"]["input"];
};

export type BillingMutationDeletePlanArgs = {
  tier: Scalars["String"]["input"];
};

export type BillingMutationDeletePlanPeriodArgs = {
  period: Scalars["String"]["input"];
  tier: Scalars["String"]["input"];
};

export type BillingMutationPurchaseAddonArgs = {
  input: PurchaseAddonInput;
};

export type BillingMutationSubmitPaymentProofArgs = {
  input: SubmitPaymentProofInput;
};

export type BillingMutationSubscribeArgs = {
  input: SubscribeInput;
};

export type BillingMutationUpdateAddonArgs = {
  input: UpdateAddonInput;
  packageId: Scalars["String"]["input"];
};

export type BillingMutationUpdatePaymentInstructionsArgs = {
  input: UpdatePaymentInstructionsInput;
};

export type BillingMutationUpdatePlanArgs = {
  input: UpdatePlanInput;
  tier: Scalars["String"]["input"];
};

export type BillingMutationUpdatePlanPeriodArgs = {
  input: UpdatePlanPeriodInput;
  period: Scalars["String"]["input"];
  tier: Scalars["String"]["input"];
};

export type BillingMutationUploadPaymentReceiptPhotoArgs = {
  input: UploadPaymentReceiptPhotoInput;
};

export type BillingQuery = {
  addons: Array<AddonPackage>;
  billing: BillingInfo;
  invoices: InvoiceConnection;
  myPaymentSubmissions: PaymentSubmissionConnection;
  paymentInstructions?: Maybe<PaymentInstructions>;
  paymentSubmissions: PaymentSubmissionConnection;
  plans: Array<SubscriptionPlan>;
};

export type BillingQueryInvoicesArgs = {
  pagination?: InputMaybe<InvoicePaginationInput>;
};

export type BillingQueryMyPaymentSubmissionsArgs = {
  limit?: Scalars["Int"]["input"];
  offset?: Scalars["Int"]["input"];
  status?: InputMaybe<Scalars["String"]["input"]>;
};

export type BillingQueryPaymentSubmissionsArgs = {
  limit?: Scalars["Int"]["input"];
  offset?: Scalars["Int"]["input"];
  status?: InputMaybe<Scalars["String"]["input"]>;
};

export type BulkEmailFinderInput = {
  items: Array<BulkEmailFinderItemInput>;
};

export type BulkEmailFinderItemInput = {
  domain: Scalars["String"]["input"];
  firstName: Scalars["String"]["input"];
  lastName: Scalars["String"]["input"];
};

export type BulkEmailFinderResponse = {
  processedCount: Scalars["Int"]["output"];
  results: Array<BulkEmailFinderResult>;
  totalRequested: Scalars["Int"]["output"];
  totalSuccessful: Scalars["Int"]["output"];
};

export type BulkEmailFinderResult = {
  domain: Scalars["String"]["output"];
  emails: Array<EmailResult>;
  error?: Maybe<Scalars["String"]["output"]>;
  firstName: Scalars["String"]["output"];
  lastName: Scalars["String"]["output"];
  source: Scalars["String"]["output"];
  success: Scalars["Boolean"]["output"];
  total: Scalars["Int"]["output"];
};

export type BulkEmailPatternPredictInput = {
  items: Array<BulkEmailPatternPredictItemInput>;
};

export type BulkEmailPatternPredictItemInput = {
  domain: Scalars["String"]["input"];
  firstName: Scalars["String"]["input"];
  lastName: Scalars["String"]["input"];
};

export type BulkEmailVerifierInput = {
  emails: Array<Scalars["String"]["input"]>;
  provider?: InputMaybe<Scalars["String"]["input"]>;
};

export type BulkEmailVerifierResponse = {
  catchallCount: Scalars["Int"]["output"];
  invalidCount: Scalars["Int"]["output"];
  results: Array<VerifiedEmailResult>;
  riskyCount: Scalars["Int"]["output"];
  success: Scalars["Boolean"]["output"];
  total: Scalars["Int"]["output"];
  unknownCount: Scalars["Int"]["output"];
  validCount: Scalars["Int"]["output"];
};

export type BulkPhoneFinderInput = {
  items: Array<BulkPhoneFinderItemInput>;
};

export type BulkPhoneFinderItemInput = {
  domain: Scalars["String"]["input"];
  firstName: Scalars["String"]["input"];
  lastName: Scalars["String"]["input"];
};

export type BulkPhonePatternPredictInput = {
  items: Array<BulkPhonePatternPredictItemInput>;
};

export type BulkPhonePatternPredictItemInput = {
  domain: Scalars["String"]["input"];
  firstName: Scalars["String"]["input"];
  lastName: Scalars["String"]["input"];
};

export type BulkPhoneVerifierInput = {
  emails: Array<Scalars["String"]["input"]>;
  provider?: InputMaybe<Scalars["String"]["input"]>;
};

export type CacheStats = {
  enabled: Scalars["Boolean"]["output"];
  hitRate: Scalars["Float"]["output"];
  hits: Scalars["Int"]["output"];
  maxSize: Scalars["Int"]["output"];
  misses: Scalars["Int"]["output"];
  size: Scalars["Int"]["output"];
  useRedis: Scalars["Boolean"]["output"];
};

export type CampaignModuleMutation = {
  addSequenceStep: Scalars["JSON"]["output"];
  createCampaign: Scalars["JSON"]["output"];
  createCampaignTemplate: Scalars["JSON"]["output"];
  createSequence: Scalars["JSON"]["output"];
  deleteCampaign: Scalars["Boolean"]["output"];
  deleteCampaignTemplate: Scalars["Boolean"]["output"];
  deleteSequence: Scalars["Boolean"]["output"];
  deleteSequenceStep: Scalars["Boolean"]["output"];
  pauseCampaign: Scalars["JSON"]["output"];
  pauseSequence: Scalars["JSON"]["output"];
  resumeCampaign: Scalars["JSON"]["output"];
  resumeSequence: Scalars["JSON"]["output"];
  triggerSequence: Scalars["JSON"]["output"];
  updateCampaignTemplate: Scalars["JSON"]["output"];
  updateSequenceStep: Scalars["JSON"]["output"];
};

export type CampaignModuleMutationAddSequenceStepArgs = {
  input: AddSequenceStepInput;
  sequenceId: Scalars["String"]["input"];
};

export type CampaignModuleMutationCreateCampaignArgs = {
  input: CreateCampaignInput;
};

export type CampaignModuleMutationCreateCampaignTemplateArgs = {
  input: CreateCampaignTemplateInput;
};

export type CampaignModuleMutationCreateSequenceArgs = {
  input: CreateSequenceInput;
};

export type CampaignModuleMutationDeleteCampaignArgs = {
  campaignId: Scalars["String"]["input"];
};

export type CampaignModuleMutationDeleteCampaignTemplateArgs = {
  templateId: Scalars["String"]["input"];
};

export type CampaignModuleMutationDeleteSequenceArgs = {
  sequenceId: Scalars["String"]["input"];
};

export type CampaignModuleMutationDeleteSequenceStepArgs = {
  sequenceId: Scalars["String"]["input"];
  stepId: Scalars["String"]["input"];
};

export type CampaignModuleMutationPauseCampaignArgs = {
  campaignId: Scalars["String"]["input"];
};

export type CampaignModuleMutationPauseSequenceArgs = {
  sequenceId: Scalars["String"]["input"];
};

export type CampaignModuleMutationResumeCampaignArgs = {
  campaignId: Scalars["String"]["input"];
};

export type CampaignModuleMutationResumeSequenceArgs = {
  sequenceId: Scalars["String"]["input"];
};

export type CampaignModuleMutationTriggerSequenceArgs = {
  input: TriggerSequenceInput;
  sequenceId: Scalars["String"]["input"];
};

export type CampaignModuleMutationUpdateCampaignTemplateArgs = {
  input: UpdateCampaignTemplateInput;
  templateId: Scalars["String"]["input"];
};

export type CampaignModuleMutationUpdateSequenceStepArgs = {
  input: UpdateSequenceStepInput;
  sequenceId: Scalars["String"]["input"];
  stepId: Scalars["String"]["input"];
};

export type CampaignModuleQuery = {
  campaign: Scalars["JSON"]["output"];
  campaignTemplate: Scalars["JSON"]["output"];
  campaignTemplates: Scalars["JSON"]["output"];
  campaigns: Scalars["JSON"]["output"];
  cqlParse: Scalars["JSON"]["output"];
  cqlValidate: Scalars["JSON"]["output"];
  renderTemplatePreview: Scalars["JSON"]["output"];
  sequence: Scalars["JSON"]["output"];
  sequenceSteps: Scalars["JSON"]["output"];
  sequences: Scalars["JSON"]["output"];
};

export type CampaignModuleQueryCampaignArgs = {
  id: Scalars["String"]["input"];
};

export type CampaignModuleQueryCampaignTemplateArgs = {
  id: Scalars["String"]["input"];
};

export type CampaignModuleQueryCqlParseArgs = {
  query: Scalars["String"]["input"];
  target?: InputMaybe<Scalars["String"]["input"]>;
};

export type CampaignModuleQueryCqlValidateArgs = {
  cql: Scalars["JSON"]["input"];
};

export type CampaignModuleQueryRenderTemplatePreviewArgs = {
  email?: Scalars["String"]["input"];
  firstName?: Scalars["String"]["input"];
  lastName?: Scalars["String"]["input"];
  templateId: Scalars["String"]["input"];
};

export type CampaignModuleQuerySequenceArgs = {
  id: Scalars["String"]["input"];
};

export type CampaignModuleQuerySequenceStepsArgs = {
  sequenceId: Scalars["String"]["input"];
};

export type CancelSubscriptionResult = {
  message: Scalars["String"]["output"];
  subscriptionStatus: Scalars["String"]["output"];
};

export type ComingSoonResponse = {
  endpoint: Scalars["String"]["output"];
  message: Scalars["String"]["output"];
};

export type Company = {
  address?: Maybe<Scalars["String"]["output"]>;
  annualRevenue?: Maybe<Scalars["Int"]["output"]>;
  city?: Maybe<Scalars["String"]["output"]>;
  companyNameForEmails?: Maybe<Scalars["String"]["output"]>;
  contacts?: Maybe<Array<Contact>>;
  country?: Maybe<Scalars["String"]["output"]>;
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  employeesCount?: Maybe<Scalars["Int"]["output"]>;
  facebookUrl?: Maybe<Scalars["String"]["output"]>;
  industries?: Maybe<Array<Scalars["String"]["output"]>>;
  keywords?: Maybe<Array<Scalars["String"]["output"]>>;
  lastRaisedAt?: Maybe<Scalars["String"]["output"]>;
  latestFunding?: Maybe<Scalars["String"]["output"]>;
  latestFundingAmount?: Maybe<Scalars["Int"]["output"]>;
  linkedinSalesUrl?: Maybe<Scalars["String"]["output"]>;
  linkedinUrl?: Maybe<Scalars["String"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  normalizedDomain?: Maybe<Scalars["String"]["output"]>;
  phoneNumber?: Maybe<Scalars["String"]["output"]>;
  state?: Maybe<Scalars["String"]["output"]>;
  technologies?: Maybe<Array<Scalars["String"]["output"]>>;
  totalFunding?: Maybe<Scalars["Int"]["output"]>;
  twitterUrl?: Maybe<Scalars["String"]["output"]>;
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
  uuid: Scalars["ID"]["output"];
  website?: Maybe<Scalars["String"]["output"]>;
};

export type CompanyBasic = {
  address?: Maybe<Scalars["String"]["output"]>;
  annualRevenue?: Maybe<Scalars["Int"]["output"]>;
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  employeesCount?: Maybe<Scalars["Int"]["output"]>;
  industries?: Maybe<Array<Scalars["String"]["output"]>>;
  keywords?: Maybe<Array<Scalars["String"]["output"]>>;
  name?: Maybe<Scalars["String"]["output"]>;
  technologies?: Maybe<Array<Scalars["String"]["output"]>>;
  textSearch?: Maybe<Scalars["String"]["output"]>;
  totalFunding?: Maybe<Scalars["Int"]["output"]>;
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
  uuid: Scalars["ID"]["output"];
};

export type CompanyConnection = {
  items: Array<Company>;
  limit: Scalars["Int"]["output"];
  /** Pass as search_after on the next request; from last row cursor. */
  nextSearchAfter?: Maybe<Array<Scalars["String"]["output"]>>;
  offset: Scalars["Int"]["output"];
  total: Scalars["Int"]["output"];
};

export type CompanyFilter = {
  active: Scalars["Boolean"]["output"];
  directDerived: Scalars["Boolean"]["output"];
  displayName: Scalars["String"]["output"];
  filterKey: Scalars["String"]["output"];
  filterType: Scalars["String"]["output"];
  id: Scalars["Int"]["output"];
  key: Scalars["String"]["output"];
  service: Scalars["String"]["output"];
};

export type CompanyFilterConnection = {
  items: Array<CompanyFilter>;
  total: Scalars["Int"]["output"];
};

export type CompanyFilterData = {
  count?: Maybe<Scalars["Int"]["output"]>;
  displayValue: Scalars["String"]["output"];
  value: Scalars["String"]["output"];
};

export type CompanyFilterDataConnection = {
  items: Array<CompanyFilterData>;
  total: Scalars["Int"]["output"];
};

export type CompanyFilterDataInput = {
  filterKey: Scalars["String"]["input"];
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  page?: InputMaybe<Scalars["Int"]["input"]>;
  searchText?: InputMaybe<Scalars["String"]["input"]>;
};

export type CompanyMetadataBasic = {
  city?: Maybe<Scalars["String"]["output"]>;
  companyNameForEmails?: Maybe<Scalars["String"]["output"]>;
  country?: Maybe<Scalars["String"]["output"]>;
  facebookUrl?: Maybe<Scalars["String"]["output"]>;
  lastRaisedAt?: Maybe<Scalars["DateTime"]["output"]>;
  latestFunding?: Maybe<Scalars["String"]["output"]>;
  latestFundingAmount?: Maybe<Scalars["Int"]["output"]>;
  linkedinSalesUrl?: Maybe<Scalars["String"]["output"]>;
  linkedinUrl?: Maybe<Scalars["String"]["output"]>;
  phoneNumber?: Maybe<Scalars["String"]["output"]>;
  state?: Maybe<Scalars["String"]["output"]>;
  twitterUrl?: Maybe<Scalars["String"]["output"]>;
  uuid: Scalars["ID"]["output"];
  website?: Maybe<Scalars["String"]["output"]>;
};

export type CompanyMutation = {
  createCompany: Company;
  deleteCompany: Scalars["Boolean"]["output"];
  exportCompanies: SchedulerJob;
  importCompanies: SchedulerJob;
  updateCompany: Company;
};

export type CompanyMutationCreateCompanyArgs = {
  input: CreateCompanyInput;
};

export type CompanyMutationDeleteCompanyArgs = {
  uuid: Scalars["ID"]["input"];
};

export type CompanyMutationExportCompaniesArgs = {
  input: CreateContact360ExportInput;
};

export type CompanyMutationImportCompaniesArgs = {
  input: CreateContact360ImportInput;
};

export type CompanyMutationUpdateCompanyArgs = {
  input: UpdateCompanyInput;
  uuid: Scalars["ID"]["input"];
};

export type CompanyQuery = {
  companies: CompanyConnection;
  company: Company;
  companyContacts: ContactConnection;
  companyCount: Scalars["Int"]["output"];
  companyQuery: CompanyConnection;
  filterData: CompanyFilterDataConnection;
  filters: CompanyFilterConnection;
};

export type CompanyQueryCompaniesArgs = {
  query?: InputMaybe<VqlQueryInput>;
};

export type CompanyQueryCompanyArgs = {
  uuid: Scalars["ID"]["input"];
};

export type CompanyQueryCompanyContactsArgs = {
  companyUuid: Scalars["ID"]["input"];
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  query?: InputMaybe<VqlQueryInput>;
};

export type CompanyQueryCompanyCountArgs = {
  query?: InputMaybe<VqlQueryInput>;
};

export type CompanyQueryCompanyQueryArgs = {
  query: VqlQueryInput;
};

export type CompanyQueryFilterDataArgs = {
  input: CompanyFilterDataInput;
};

export type CompanySummaryResponse = {
  /** AI-generated company summary providing insights and context about the company */
  summary: Scalars["String"]["output"];
};

export type CompanyWithRelations = {
  company: CompanyBasic;
  contacts: Array<ContactWithRelations>;
  metadata?: Maybe<CompanyMetadataBasic>;
};

export type CompleteTwoFactorLoginInput = {
  challengeToken: Scalars["String"]["input"];
  code: Scalars["String"]["input"];
};

export type CompleteUploadInput = {
  uploadId: Scalars["String"]["input"];
};

export type CompleteUploadResponse = {
  fileKey: Scalars["String"]["output"];
  location?: Maybe<Scalars["String"]["output"]>;
  metadataQueued: Scalars["Boolean"]["output"];
  s3Url: Scalars["String"]["output"];
  status: Scalars["String"]["output"];
};

export type ConnectraDetails = {
  status: Scalars["String"]["output"];
  uptime?: Maybe<Scalars["Int"]["output"]>;
  version?: Maybe<Scalars["String"]["output"]>;
};

export type Contact = {
  city?: Maybe<Scalars["String"]["output"]>;
  company?: Maybe<Company>;
  companyUuid?: Maybe<Scalars["ID"]["output"]>;
  country?: Maybe<Scalars["String"]["output"]>;
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  departments?: Maybe<Array<Scalars["String"]["output"]>>;
  email?: Maybe<Scalars["String"]["output"]>;
  emailStatus?: Maybe<Scalars["String"]["output"]>;
  facebookUrl?: Maybe<Scalars["String"]["output"]>;
  firstName?: Maybe<Scalars["String"]["output"]>;
  homePhone?: Maybe<Scalars["String"]["output"]>;
  lastName?: Maybe<Scalars["String"]["output"]>;
  linkedinSalesUrl?: Maybe<Scalars["String"]["output"]>;
  linkedinUrl?: Maybe<Scalars["String"]["output"]>;
  mobilePhone?: Maybe<Scalars["String"]["output"]>;
  otherPhone?: Maybe<Scalars["String"]["output"]>;
  seniority?: Maybe<Scalars["String"]["output"]>;
  stage?: Maybe<Scalars["String"]["output"]>;
  state?: Maybe<Scalars["String"]["output"]>;
  status?: Maybe<Scalars["String"]["output"]>;
  title?: Maybe<Scalars["String"]["output"]>;
  twitterUrl?: Maybe<Scalars["String"]["output"]>;
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
  uuid: Scalars["ID"]["output"];
  website?: Maybe<Scalars["String"]["output"]>;
  workDirectPhone?: Maybe<Scalars["String"]["output"]>;
};

export type ContactBasic = {
  companyId?: Maybe<Scalars["ID"]["output"]>;
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  departments?: Maybe<Array<Scalars["String"]["output"]>>;
  email?: Maybe<Scalars["String"]["output"]>;
  emailStatus?: Maybe<Scalars["String"]["output"]>;
  firstName?: Maybe<Scalars["String"]["output"]>;
  lastName?: Maybe<Scalars["String"]["output"]>;
  mobilePhone?: Maybe<Scalars["String"]["output"]>;
  seniority?: Maybe<Scalars["String"]["output"]>;
  title?: Maybe<Scalars["String"]["output"]>;
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
  uuid: Scalars["ID"]["output"];
};

export type ContactConnection = {
  items: Array<Contact>;
  limit: Scalars["Int"]["output"];
  /** Pass as search_after on the next request; from last row cursor. */
  nextSearchAfter?: Maybe<Array<Scalars["String"]["output"]>>;
  offset: Scalars["Int"]["output"];
  total: Scalars["Int"]["output"];
};

export type ContactFilter = {
  active: Scalars["Boolean"]["output"];
  directDerived: Scalars["Boolean"]["output"];
  displayName: Scalars["String"]["output"];
  filterKey: Scalars["String"]["output"];
  filterType: Scalars["String"]["output"];
  id: Scalars["Int"]["output"];
  key: Scalars["String"]["output"];
  service: Scalars["String"]["output"];
};

export type ContactFilterConnection = {
  items: Array<ContactFilter>;
  total: Scalars["Int"]["output"];
};

export type ContactFilterData = {
  count?: Maybe<Scalars["Int"]["output"]>;
  displayValue: Scalars["String"]["output"];
  value: Scalars["String"]["output"];
};

export type ContactFilterDataConnection = {
  items: Array<ContactFilterData>;
  total: Scalars["Int"]["output"];
};

export type ContactFilterDataInput = {
  filterKey: Scalars["String"]["input"];
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  page?: InputMaybe<Scalars["Int"]["input"]>;
  searchText?: InputMaybe<Scalars["String"]["input"]>;
};

export type ContactInMessage = {
  city?: Maybe<Scalars["String"]["output"]>;
  company?: Maybe<Scalars["String"]["output"]>;
  country?: Maybe<Scalars["String"]["output"]>;
  email?: Maybe<Scalars["String"]["output"]>;
  firstName?: Maybe<Scalars["String"]["output"]>;
  lastName?: Maybe<Scalars["String"]["output"]>;
  state?: Maybe<Scalars["String"]["output"]>;
  title?: Maybe<Scalars["String"]["output"]>;
  uuid?: Maybe<Scalars["String"]["output"]>;
};

export type ContactInMessageInput = {
  city?: InputMaybe<Scalars["String"]["input"]>;
  company?: InputMaybe<Scalars["String"]["input"]>;
  country?: InputMaybe<Scalars["String"]["input"]>;
  email?: InputMaybe<Scalars["String"]["input"]>;
  firstName?: InputMaybe<Scalars["String"]["input"]>;
  lastName?: InputMaybe<Scalars["String"]["input"]>;
  state?: InputMaybe<Scalars["String"]["input"]>;
  title?: InputMaybe<Scalars["String"]["input"]>;
  uuid?: InputMaybe<Scalars["String"]["input"]>;
};

export type ContactMetadataBasic = {
  city?: Maybe<Scalars["String"]["output"]>;
  country?: Maybe<Scalars["String"]["output"]>;
  facebookUrl?: Maybe<Scalars["String"]["output"]>;
  homePhone?: Maybe<Scalars["String"]["output"]>;
  linkedinSalesUrl?: Maybe<Scalars["String"]["output"]>;
  linkedinUrl?: Maybe<Scalars["String"]["output"]>;
  otherPhone?: Maybe<Scalars["String"]["output"]>;
  stage?: Maybe<Scalars["String"]["output"]>;
  state?: Maybe<Scalars["String"]["output"]>;
  twitterUrl?: Maybe<Scalars["String"]["output"]>;
  uuid: Scalars["ID"]["output"];
  website?: Maybe<Scalars["String"]["output"]>;
  workDirectPhone?: Maybe<Scalars["String"]["output"]>;
};

export type ContactMutation = {
  batchCreateContacts: Array<Contact>;
  createContact: Contact;
  deleteContact: Scalars["Boolean"]["output"];
  exportContacts: SchedulerJob;
  importContacts: SchedulerJob;
  updateContact: Contact;
};

export type ContactMutationBatchCreateContactsArgs = {
  input: BatchCreateContactsInput;
};

export type ContactMutationCreateContactArgs = {
  input: CreateContactInput;
};

export type ContactMutationDeleteContactArgs = {
  uuid: Scalars["ID"]["input"];
};

export type ContactMutationExportContactsArgs = {
  input: CreateContact360ExportInput;
};

export type ContactMutationImportContactsArgs = {
  input: CreateContact360ImportInput;
};

export type ContactMutationUpdateContactArgs = {
  input: UpdateContactInput;
  uuid: Scalars["ID"]["input"];
};

export type ContactQuery = {
  contact: Contact;
  contactCount: Scalars["Int"]["output"];
  contactQuery: ContactConnection;
  contacts: ContactConnection;
  filterData: ContactFilterDataConnection;
  filters: ContactFilterConnection;
};

export type ContactQueryContactArgs = {
  uuid: Scalars["ID"]["input"];
};

export type ContactQueryContactCountArgs = {
  query?: InputMaybe<VqlQueryInput>;
};

export type ContactQueryContactQueryArgs = {
  query: VqlQueryInput;
};

export type ContactQueryContactsArgs = {
  query?: InputMaybe<VqlQueryInput>;
};

export type ContactQueryFilterDataArgs = {
  input: ContactFilterDataInput;
};

export type ContactWithRelations = {
  company?: Maybe<CompanyBasic>;
  companyMetadata?: Maybe<CompanyMetadataBasic>;
  contact: ContactBasic;
  metadata?: Maybe<ContactMetadataBasic>;
};

export type CreateAiChatInput = {
  /** List of messages */
  messages?: InputMaybe<Array<MessageInput>>;
  /** Chat title (max 255 characters) */
  title?: InputMaybe<Scalars["String"]["input"]>;
};

export type CreateApiKeyInput = {
  expiresAt?: InputMaybe<Scalars["String"]["input"]>;
  name: Scalars["String"]["input"];
  readAccess?: Scalars["Boolean"]["input"];
  writeAccess?: Scalars["Boolean"]["input"];
};

export type CreateAddonInput = {
  credits: Scalars["Int"]["input"];
  id: Scalars["String"]["input"];
  isActive?: InputMaybe<Scalars["Boolean"]["input"]>;
  name: Scalars["String"]["input"];
  price: Scalars["Float"]["input"];
  ratePerCredit: Scalars["Float"]["input"];
};

export type CreateAddonResult = {
  id: Scalars["String"]["output"];
  message: Scalars["String"]["output"];
};

export type CreateCampaignInput = {
  audience?: InputMaybe<Scalars["String"]["input"]>;
  fromEmail: Scalars["String"]["input"];
  fromName: Scalars["String"]["input"];
  name: Scalars["String"]["input"];
  scheduleType?: InputMaybe<Scalars["String"]["input"]>;
  scheduledAt?: InputMaybe<Scalars["String"]["input"]>;
  subject: Scalars["String"]["input"];
  templateId?: InputMaybe<Scalars["String"]["input"]>;
};

export type CreateCampaignTemplateInput = {
  body?: InputMaybe<Scalars["String"]["input"]>;
  category?: InputMaybe<Scalars["String"]["input"]>;
  name: Scalars["String"]["input"];
  subject?: InputMaybe<Scalars["String"]["input"]>;
};

export type CreateCompanyInput = {
  address?: InputMaybe<Scalars["String"]["input"]>;
  annualRevenue?: InputMaybe<Scalars["Int"]["input"]>;
  employeesCount?: InputMaybe<Scalars["Int"]["input"]>;
  industries?: InputMaybe<Array<Scalars["String"]["input"]>>;
  keywords?: InputMaybe<Array<Scalars["String"]["input"]>>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  technologies?: InputMaybe<Array<Scalars["String"]["input"]>>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  totalFunding?: InputMaybe<Scalars["Int"]["input"]>;
};

export type CreateContact360ExportInput = {
  outputPrefix: Scalars["String"]["input"];
  pageSize?: Scalars["Int"]["input"];
  retryCount?: Scalars["Int"]["input"];
  retryInterval?: Scalars["Int"]["input"];
  s3Bucket?: InputMaybe<Scalars["String"]["input"]>;
  savedSearchId?: InputMaybe<Scalars["ID"]["input"]>;
  service: Scalars["String"]["input"];
  sliceCount?: Scalars["Int"]["input"];
  vql: Scalars["JSON"]["input"];
  workflowId?: InputMaybe<Scalars["String"]["input"]>;
};

export type CreateContact360ImportInput = {
  chunkCount?: Scalars["Int"]["input"];
  csvColumns?: InputMaybe<Scalars["JSON"]["input"]>;
  /** "contact" or "company" — sets job_family for sync import jobs. */
  importTarget?: Scalars["String"]["input"];
  outputPrefix?: Scalars["String"]["input"];
  retryCount?: Scalars["Int"]["input"];
  retryInterval?: Scalars["Int"]["input"];
  s3Bucket: Scalars["String"]["input"];
  s3Key: Scalars["String"]["input"];
  workflowId?: InputMaybe<Scalars["String"]["input"]>;
};

export type CreateContactInput = {
  companyUuid?: InputMaybe<Scalars["ID"]["input"]>;
  departments?: InputMaybe<Array<Scalars["String"]["input"]>>;
  email?: InputMaybe<Scalars["String"]["input"]>;
  emailStatus?: InputMaybe<Scalars["String"]["input"]>;
  firstName?: InputMaybe<Scalars["String"]["input"]>;
  lastName?: InputMaybe<Scalars["String"]["input"]>;
  mobilePhone?: InputMaybe<Scalars["String"]["input"]>;
  seniority?: InputMaybe<Scalars["String"]["input"]>;
  status?: InputMaybe<Scalars["String"]["input"]>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  title?: InputMaybe<Scalars["String"]["input"]>;
};

export type CreateEmailFinderExportInput = {
  csvColumns?: InputMaybe<EmailExportCsvColumnsInput>;
  inputCsvKey: Scalars["String"]["input"];
  outputPrefix: Scalars["String"]["input"];
  s3Bucket?: InputMaybe<Scalars["String"]["input"]>;
};

export type CreateEmailPatternExportInput = {
  csvColumns?: InputMaybe<EmailPatternCsvColumnsInput>;
  inputCsvKey: Scalars["String"]["input"];
  outputPrefix: Scalars["String"]["input"];
  s3Bucket?: InputMaybe<Scalars["String"]["input"]>;
};

export type CreateEmailVerifyExportInput = {
  csvColumns?: InputMaybe<EmailExportCsvColumnsInput>;
  inputCsvKey: Scalars["String"]["input"];
  outputPrefix: Scalars["String"]["input"];
  provider?: InputMaybe<Scalars["String"]["input"]>;
  s3Bucket?: InputMaybe<Scalars["String"]["input"]>;
};

export type CreateJobTicketInput = {
  description: Scalars["String"]["input"];
  externalJobId: Scalars["String"]["input"];
  jobSource: Scalars["String"]["input"];
  severity?: Scalars["String"]["input"];
  title: Scalars["String"]["input"];
};

export type CreateKnowledgeArticleInput = {
  body: Scalars["String"]["input"];
  tags?: InputMaybe<Array<Scalars["String"]["input"]>>;
  title: Scalars["String"]["input"];
};

export type CreateLogInput = {
  context?: InputMaybe<Scalars["JSON"]["input"]>;
  error?: InputMaybe<Scalars["JSON"]["input"]>;
  level: Scalars["String"]["input"];
  logger: Scalars["String"]["input"];
  message: Scalars["String"]["input"];
  performance?: InputMaybe<Scalars["JSON"]["input"]>;
  requestId?: InputMaybe<Scalars["String"]["input"]>;
  timestamp?: InputMaybe<Scalars["DateTime"]["input"]>;
  userId?: InputMaybe<Scalars["ID"]["input"]>;
};

export type CreateLogsBatchInput = {
  logs: Array<CreateLogInput>;
};

export type CreatePlanInput = {
  category: Scalars["String"]["input"];
  isActive?: InputMaybe<Scalars["Boolean"]["input"]>;
  name: Scalars["String"]["input"];
  periods: Array<PlanPeriodInput>;
  tier: Scalars["String"]["input"];
};

export type CreatePlanPeriodInput = {
  credits: Scalars["Int"]["input"];
  period: Scalars["String"]["input"];
  price: Scalars["Float"]["input"];
  ratePerCredit: Scalars["Float"]["input"];
  savingsAmount?: InputMaybe<Scalars["Float"]["input"]>;
  savingsPercentage?: InputMaybe<Scalars["Int"]["input"]>;
};

export type CreatePlanPeriodResult = {
  message: Scalars["String"]["output"];
  period: Scalars["String"]["output"];
  tier: Scalars["String"]["output"];
};

export type CreatePlanResult = {
  message: Scalars["String"]["output"];
  tier: Scalars["String"]["output"];
};

export type CreateSavedSearchInput = {
  description?: InputMaybe<Scalars["String"]["input"]>;
  filters?: InputMaybe<Scalars["JSON"]["input"]>;
  name: Scalars["String"]["input"];
  pageSize?: InputMaybe<Scalars["Int"]["input"]>;
  searchTerm?: InputMaybe<Scalars["String"]["input"]>;
  sortDirection?: InputMaybe<Scalars["String"]["input"]>;
  sortField?: InputMaybe<Scalars["String"]["input"]>;
  type: Scalars["String"]["input"];
};

export type CreateSequenceInput = {
  description?: InputMaybe<Scalars["String"]["input"]>;
  name: Scalars["String"]["input"];
  trigger?: InputMaybe<Scalars["String"]["input"]>;
};

export type DangerousAdminOperation = "DELETE_USER" | "PROMOTE_SUPER_ADMIN";

export type DangerousApprovalTicket = {
  approvalId: Scalars["ID"]["output"];
  expiresAt: Scalars["DateTime"]["output"];
  operationKind: Scalars["String"]["output"];
  targetUserId: Scalars["ID"]["output"];
};

export type DashboardPageList = {
  hasNext: Scalars["Boolean"]["output"];
  hasPrevious: Scalars["Boolean"]["output"];
  page: Scalars["Int"]["output"];
  pageSize: Scalars["Int"]["output"];
  pages: Array<PageSummary>;
  total: Scalars["Int"]["output"];
  totalPages: Scalars["Int"]["output"];
};

export type DatabaseHealth = {
  activeConnections: Scalars["Int"]["output"];
  idleConnections: Scalars["Int"]["output"];
  poolSize: Scalars["Int"]["output"];
  status: Scalars["String"]["output"];
};

export type DeclinePaymentInput = {
  reason: Scalars["String"]["input"];
  submissionId: Scalars["String"]["input"];
};

export type DeleteAddonResult = {
  id: Scalars["String"]["output"];
  message: Scalars["String"]["output"];
};

export type DeleteLogInput = {
  logId: Scalars["ID"]["input"];
};

export type DeleteLogsBulkInput = {
  endTime?: InputMaybe<Scalars["DateTime"]["input"]>;
  level?: InputMaybe<Scalars["String"]["input"]>;
  logger?: InputMaybe<Scalars["String"]["input"]>;
  requestId?: InputMaybe<Scalars["String"]["input"]>;
  startTime?: InputMaybe<Scalars["DateTime"]["input"]>;
  userId?: InputMaybe<Scalars["ID"]["input"]>;
};

export type DeleteLogsBulkResponse = {
  deletedCount: Scalars["Int"]["output"];
};

export type DeleteNotificationsInput = {
  /** List of notification IDs to delete */
  notificationIds: Array<Scalars["ID"]["input"]>;
};

export type DeleteNotificationsResponse = {
  count: Scalars["Int"]["output"];
};

export type DeletePlanPeriodResult = {
  message: Scalars["String"]["output"];
  period: Scalars["String"]["output"];
  tier: Scalars["String"]["output"];
};

export type DeletePlanResult = {
  message: Scalars["String"]["output"];
  tier: Scalars["String"]["output"];
};

export type DeleteUserInput = {
  approvalId?: InputMaybe<Scalars["ID"]["input"]>;
  userId: Scalars["ID"]["input"];
};

export type EmailExportCsvColumnsInput = {
  domain?: Scalars["String"]["input"];
  email?: InputMaybe<Scalars["String"]["input"]>;
  firstName?: Scalars["String"]["input"];
  lastName?: Scalars["String"]["input"];
};

export type EmailFinderInput = {
  domain?: InputMaybe<Scalars["String"]["input"]>;
  firstName: Scalars["String"]["input"];
  lastName: Scalars["String"]["input"];
  website?: InputMaybe<Scalars["String"]["input"]>;
};

export type EmailFinderResponse = {
  emails: Array<EmailResult>;
  success: Scalars["Boolean"]["output"];
  total: Scalars["Int"]["output"];
};

export type EmailJobStatusResponse = {
  createdAt?: Maybe<Scalars["String"]["output"]>;
  credits?: Maybe<Scalars["Int"]["output"]>;
  done: Scalars["Boolean"]["output"];
  jobId: Scalars["String"]["output"];
  jobTitle?: Maybe<Scalars["String"]["output"]>;
  jobType?: Maybe<Scalars["String"]["output"]>;
  outputCsvKey?: Maybe<Scalars["String"]["output"]>;
  processedRows: Scalars["Int"]["output"];
  progressPercent: Scalars["Int"]["output"];
  provider?: Maybe<Scalars["String"]["output"]>;
  status?: Maybe<Scalars["String"]["output"]>;
  success: Scalars["Boolean"]["output"];
  updatedAt?: Maybe<Scalars["String"]["output"]>;
};

export type EmailMutation = {
  addEmailPattern: EmailPatternResult;
  addEmailPatternBulk: EmailPatternBulkAddResponse;
};

export type EmailMutationAddEmailPatternArgs = {
  input: EmailPatternAddInput;
};

export type EmailMutationAddEmailPatternBulkArgs = {
  input: EmailPatternBulkAddInput;
};

export type EmailPatternAddInput = {
  companyUuid: Scalars["String"]["input"];
  domain: Scalars["String"]["input"];
  email: Scalars["String"]["input"];
  firstName: Scalars["String"]["input"];
  lastName: Scalars["String"]["input"];
};

export type EmailPatternBulkAddInput = {
  items: Array<EmailPatternBulkItemInput>;
};

export type EmailPatternBulkAddResponse = {
  inserted?: Maybe<Scalars["Int"]["output"]>;
  results: Array<EmailPatternResult>;
  skipped?: Maybe<Scalars["Int"]["output"]>;
  success: Scalars["Boolean"]["output"];
  total?: Maybe<Scalars["Int"]["output"]>;
};

export type EmailPatternBulkItemInput = {
  companyUuid: Scalars["String"]["input"];
  domain: Scalars["String"]["input"];
  email: Scalars["String"]["input"];
  firstName: Scalars["String"]["input"];
  lastName: Scalars["String"]["input"];
};

export type EmailPatternCsvColumnsInput = {
  companyUuid?: Scalars["String"]["input"];
  domain?: Scalars["String"]["input"];
  email?: Scalars["String"]["input"];
  firstName?: Scalars["String"]["input"];
  lastName?: Scalars["String"]["input"];
};

export type EmailPatternPredictBulkResult = {
  results: Array<EmailPatternPredictRowGroup>;
  success: Scalars["Boolean"]["output"];
  total: Scalars["Int"]["output"];
};

export type EmailPatternPredictInput = {
  domain: Scalars["String"]["input"];
  firstName: Scalars["String"]["input"];
  lastName: Scalars["String"]["input"];
};

export type EmailPatternPredictResult = {
  domain: Scalars["String"]["output"];
  patterns: Array<EmailPatternPredictRow>;
  success: Scalars["Boolean"]["output"];
  total: Scalars["Int"]["output"];
};

export type EmailPatternPredictRow = {
  contactCount: Scalars["Int"]["output"];
  email: Scalars["String"]["output"];
  errorRate?: Maybe<Scalars["Float"]["output"]>;
  patternFormat: Scalars["String"]["output"];
  status?: Maybe<Scalars["String"]["output"]>;
  successRate?: Maybe<Scalars["Float"]["output"]>;
  uuid: Scalars["String"]["output"];
};

export type EmailPatternPredictRowGroup = {
  patterns: Array<EmailPatternPredictRow>;
};

export type EmailPatternResult = {
  companyUuid: Scalars["String"]["output"];
  contactCount?: Maybe<Scalars["Int"]["output"]>;
  createdAt?: Maybe<Scalars["String"]["output"]>;
  domain: Scalars["String"]["output"];
  isAutoExtracted?: Maybe<Scalars["Boolean"]["output"]>;
  patternFormat?: Maybe<Scalars["String"]["output"]>;
  patternString?: Maybe<Scalars["String"]["output"]>;
  updatedAt?: Maybe<Scalars["String"]["output"]>;
  uuid: Scalars["String"]["output"];
};

export type EmailQuery = {
  emailJobStatus: EmailJobStatusResponse;
  emailSatelliteJobs: Array<EmailSatelliteJobSummary>;
  exportEmails: ComingSoonResponse;
  findEmails: EmailFinderResponse;
  findEmailsBulk: BulkEmailFinderResponse;
  predictEmailPattern: EmailPatternPredictResult;
  predictEmailPatternBulk: EmailPatternPredictBulkResult;
  verifyEmailsBulk: BulkEmailVerifierResponse;
  verifySingleEmail: SingleEmailVerifierResponse;
  verifyexportEmail: ComingSoonResponse;
  webSearch: Scalars["JSON"]["output"];
};

export type EmailQueryEmailJobStatusArgs = {
  jobId: Scalars["String"]["input"];
};

export type EmailQueryFindEmailsArgs = {
  input: EmailFinderInput;
};

export type EmailQueryFindEmailsBulkArgs = {
  input: BulkEmailFinderInput;
};

export type EmailQueryPredictEmailPatternArgs = {
  input: EmailPatternPredictInput;
};

export type EmailQueryPredictEmailPatternBulkArgs = {
  input: BulkEmailPatternPredictInput;
};

export type EmailQueryVerifyEmailsBulkArgs = {
  input: BulkEmailVerifierInput;
};

export type EmailQueryVerifySingleEmailArgs = {
  input: SingleEmailVerifierInput;
};

export type EmailQueryWebSearchArgs = {
  input: WebSearchInput;
};

export type EmailResult = {
  email: Scalars["String"]["output"];
  source?: Maybe<Scalars["String"]["output"]>;
  status?: Maybe<Scalars["String"]["output"]>;
  uuid: Scalars["ID"]["output"];
};

export type EmailRiskAnalysisResponse = {
  /** Detailed text analysis of the email address risk factors */
  analysis: Scalars["String"]["output"];
  /** Whether the email is from a disposable email service */
  isDisposable: Scalars["Boolean"]["output"];
  /** Whether the email is a role-based email (e.g., info@, support@, admin@) */
  isRoleBased: Scalars["Boolean"]["output"];
  /** Risk score from 0-100, where higher scores indicate higher risk */
  riskScore: Scalars["Int"]["output"];
};

export type EmailSatelliteJobSummary = {
  completed: Scalars["Int"]["output"];
  createdAt?: Maybe<Scalars["String"]["output"]>;
  done: Scalars["Boolean"]["output"];
  id: Scalars["String"]["output"];
  provider: Scalars["String"]["output"];
  status: Scalars["String"]["output"];
  totalEmails: Scalars["Int"]["output"];
  unknownCount: Scalars["Int"]["output"];
  updatedAt?: Maybe<Scalars["String"]["output"]>;
};

export type EndpointPerformance = {
  averageResponseTimeMs: Scalars["Float"]["output"];
  p95ResponseTimeMs: Scalars["Float"]["output"];
  p99ResponseTimeMs: Scalars["Float"]["output"];
  slowEndpoints: Array<SlowEndpoint>;
  totalRequests: Scalars["Int"]["output"];
};

export type EntitiesByUuidsResponse = {
  companies: Scalars["JSON"]["output"];
  contacts: Scalars["JSON"]["output"];
};

export type FeatureOverview = {
  activities: Array<Activity>;
  feature: Scalars["String"]["output"];
  jobs: Array<SchedulerJob>;
  usage?: Maybe<FeatureUsageInfo>;
};

export type FeatureOverviewQuery = {
  featureOverview: FeatureOverview;
};

export type FeatureOverviewQueryFeatureOverviewArgs = {
  feature: Scalars["String"]["input"];
};

export type FeatureUsageInfo = {
  feature: Scalars["String"]["output"];
  limit: Scalars["Int"]["output"];
  remaining: Scalars["Int"]["output"];
  resetAt?: Maybe<Scalars["String"]["output"]>;
  used: Scalars["Int"]["output"];
};

export type FileSchemaColumn = {
  name: Scalars["String"]["output"];
  nullable: Scalars["Boolean"]["output"];
  type: Scalars["String"]["output"];
};

export type GenerateCompanySummaryInput = {
  /** Name of the company to generate a summary for */
  companyName: Scalars["String"]["input"];
  /** Industry or sector the company operates in */
  industry: Scalars["String"]["input"];
};

export type GeolocationInput = {
  asname?: InputMaybe<Scalars["String"]["input"]>;
  city?: InputMaybe<Scalars["String"]["input"]>;
  continent?: InputMaybe<Scalars["String"]["input"]>;
  continentCode?: InputMaybe<Scalars["String"]["input"]>;
  country?: InputMaybe<Scalars["String"]["input"]>;
  countryCode?: InputMaybe<Scalars["String"]["input"]>;
  currency?: InputMaybe<Scalars["String"]["input"]>;
  device?: InputMaybe<Scalars["String"]["input"]>;
  district?: InputMaybe<Scalars["String"]["input"]>;
  hosting?: InputMaybe<Scalars["Boolean"]["input"]>;
  ip?: InputMaybe<Scalars["String"]["input"]>;
  isp?: InputMaybe<Scalars["String"]["input"]>;
  lat?: InputMaybe<Scalars["Float"]["input"]>;
  lon?: InputMaybe<Scalars["Float"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  org?: InputMaybe<Scalars["String"]["input"]>;
  proxy?: InputMaybe<Scalars["Boolean"]["input"]>;
  region?: InputMaybe<Scalars["String"]["input"]>;
  regionName?: InputMaybe<Scalars["String"]["input"]>;
  reverse?: InputMaybe<Scalars["String"]["input"]>;
  timezone?: InputMaybe<Scalars["String"]["input"]>;
  zip?: InputMaybe<Scalars["String"]["input"]>;
};

export type GetMetricsInput = {
  /** Optional end date filter */
  endDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  /** Maximum number of results (default: 100, max: 1000) */
  limit?: Scalars["Int"]["input"];
  /** Optional metric name filter (e.g., 'LCP', 'FID', 'CLS') */
  metricName?: InputMaybe<Scalars["String"]["input"]>;
  /** Optional start date filter */
  startDate?: InputMaybe<Scalars["DateTime"]["input"]>;
};

export type GraphQlAuditEventGql = {
  actorUserId: Scalars["String"]["output"];
  createdAt: Scalars["DateTime"]["output"];
  detail?: Maybe<Scalars["JSON"]["output"]>;
  id: Scalars["Int"]["output"];
  operationName: Scalars["String"]["output"];
  targetUserId?: Maybe<Scalars["String"]["output"]>;
};

export type GraphQlNotificationPriority = "HIGH" | "LOW" | "MEDIUM" | "URGENT";

export type GraphQlNotificationType =
  | "ACTIVITY"
  | "BILLING"
  | "MARKETING"
  | "SECURITY"
  | "SYSTEM";

export type HealthQuery = {
  apiHealth: ApiHealth;
  apiMetadata: ApiMetadata;
  performanceStats: PerformanceStats;
  satelliteHealth: Array<SatellitePingResult>;
  vqlHealth: VqlHealth;
  vqlStats: VqlStats;
};

export type HireSignalMutation = {
  exportSelectedJobs: SchedulerJob;
  triggerScrape: Scalars["JSON"]["output"];
  triggerScrapeAndTrack: ScrapeJobType;
};

export type HireSignalMutationExportSelectedJobsArgs = {
  linkedinJobIds: Array<Scalars["String"]["input"]>;
};

export type HireSignalMutationTriggerScrapeArgs = {
  body?: InputMaybe<Scalars["JSON"]["input"]>;
};

export type HireSignalMutationTriggerScrapeAndTrackArgs = {
  body?: InputMaybe<Scalars["JSON"]["input"]>;
};

export type HireSignalQuery = {
  companies: Scalars["JSON"]["output"];
  companyJobs: Scalars["JSON"]["output"];
  connectraCompany: Scalars["JSON"]["output"];
  connectraContactsForCompany: Scalars["JSON"]["output"];
  exportDownloadUrl?: Maybe<S3DownloadUrlResponse>;
  exportJobStatus: SchedulerJob;
  getScrapeJob: Scalars["JSON"]["output"];
  job: Scalars["JSON"]["output"];
  jobConnectraCompany: Scalars["JSON"]["output"];
  jobConnectraContacts: Scalars["JSON"]["output"];
  jobFilterOptions: Scalars["JSON"]["output"];
  jobs: Scalars["JSON"]["output"];
  listScrapeJobs: Scalars["JSON"]["output"];
  refreshHireSignalRun: Scalars["JSON"]["output"];
  run: Scalars["JSON"]["output"];
  runs: Scalars["JSON"]["output"];
  scrapeJobJobs: Scalars["JSON"]["output"];
  stats: Scalars["JSON"]["output"];
};

export type HireSignalQueryCompaniesArgs = {
  limit?: Scalars["Int"]["input"];
};

export type HireSignalQueryCompanyJobsArgs = {
  companyUuid: Scalars["String"]["input"];
  limit?: Scalars["Int"]["input"];
};

export type HireSignalQueryConnectraCompanyArgs = {
  companyUuid: Scalars["String"]["input"];
};

export type HireSignalQueryConnectraContactsForCompanyArgs = {
  companyUuid: Scalars["String"]["input"];
  limit?: Scalars["Int"]["input"];
  page?: Scalars["Int"]["input"];
  populateCompany?: Scalars["Boolean"]["input"];
};

export type HireSignalQueryExportDownloadUrlArgs = {
  expiresIn?: InputMaybe<Scalars["Int"]["input"]>;
  exportJobId: Scalars["String"]["input"];
};

export type HireSignalQueryExportJobStatusArgs = {
  exportJobId: Scalars["String"]["input"];
};

export type HireSignalQueryGetScrapeJobArgs = {
  pollApify?: Scalars["Boolean"]["input"];
  scrapeJobId: Scalars["String"]["input"];
};

export type HireSignalQueryJobArgs = {
  linkedinJobId: Scalars["String"]["input"];
};

export type HireSignalQueryJobConnectraCompanyArgs = {
  linkedinJobId: Scalars["String"]["input"];
};

export type HireSignalQueryJobConnectraContactsArgs = {
  includePoster?: Scalars["Boolean"]["input"];
  limit?: Scalars["Int"]["input"];
  linkedinJobId: Scalars["String"]["input"];
  page?: Scalars["Int"]["input"];
  populateCompany?: Scalars["Boolean"]["input"];
};

export type HireSignalQueryJobFilterOptionsArgs = {
  companies?: InputMaybe<Array<Scalars["String"]["input"]>>;
  company?: InputMaybe<Scalars["String"]["input"]>;
  employmentType?: InputMaybe<Scalars["String"]["input"]>;
  field: Scalars["String"]["input"];
  functionCategory?: InputMaybe<Scalars["String"]["input"]>;
  limit?: Scalars["Int"]["input"];
  location?: InputMaybe<Scalars["String"]["input"]>;
  locations?: InputMaybe<Array<Scalars["String"]["input"]>>;
  postedAfter?: InputMaybe<Scalars["String"]["input"]>;
  postedBefore?: InputMaybe<Scalars["String"]["input"]>;
  q?: InputMaybe<Scalars["String"]["input"]>;
  runId?: InputMaybe<Scalars["String"]["input"]>;
  seniority?: InputMaybe<Scalars["String"]["input"]>;
  title?: InputMaybe<Scalars["String"]["input"]>;
  titles?: InputMaybe<Array<Scalars["String"]["input"]>>;
};

export type HireSignalQueryJobsArgs = {
  companies?: InputMaybe<Array<Scalars["String"]["input"]>>;
  company?: InputMaybe<Scalars["String"]["input"]>;
  employmentType?: InputMaybe<Scalars["String"]["input"]>;
  functionCategory?: InputMaybe<Scalars["String"]["input"]>;
  limit?: Scalars["Int"]["input"];
  location?: InputMaybe<Scalars["String"]["input"]>;
  locations?: InputMaybe<Array<Scalars["String"]["input"]>>;
  offset?: Scalars["Int"]["input"];
  postedAfter?: InputMaybe<Scalars["String"]["input"]>;
  postedBefore?: InputMaybe<Scalars["String"]["input"]>;
  runId?: InputMaybe<Scalars["String"]["input"]>;
  seniority?: InputMaybe<Scalars["String"]["input"]>;
  title?: InputMaybe<Scalars["String"]["input"]>;
  titles?: InputMaybe<Array<Scalars["String"]["input"]>>;
};

export type HireSignalQueryListScrapeJobsArgs = {
  limit?: Scalars["Int"]["input"];
  offset?: Scalars["Int"]["input"];
};

export type HireSignalQueryRefreshHireSignalRunArgs = {
  runId: Scalars["String"]["input"];
};

export type HireSignalQueryRunArgs = {
  runId: Scalars["String"]["input"];
};

export type HireSignalQueryRunsArgs = {
  limit?: Scalars["Int"]["input"];
  offset?: Scalars["Int"]["input"];
};

export type HireSignalQueryScrapeJobJobsArgs = {
  limit?: Scalars["Int"]["input"];
  offset?: Scalars["Int"]["input"];
  scrapeJobId: Scalars["String"]["input"];
};

export type InitiateCsvUploadInput = {
  fileSize: Scalars["BigInt"]["input"];
  filename: Scalars["String"]["input"];
  idempotencyKey?: InputMaybe<Scalars["String"]["input"]>;
};

export type InitiateUploadInput = {
  contentType?: Scalars["String"]["input"];
  fileSize: Scalars["BigInt"]["input"];
  filename: Scalars["String"]["input"];
  idempotencyKey?: InputMaybe<Scalars["String"]["input"]>;
  prefix?: InputMaybe<Scalars["String"]["input"]>;
};

export type InitiateUploadResponse = {
  chunkSize: Scalars["Int"]["output"];
  fileKey: Scalars["String"]["output"];
  numParts: Scalars["Int"]["output"];
  s3UploadId: Scalars["String"]["output"];
  uploadId: Scalars["String"]["output"];
};

export type InviteTeamMemberInput = {
  email: Scalars["String"]["input"];
  role?: Scalars["String"]["input"];
};

export type Invoice = {
  amount: Scalars["Float"]["output"];
  createdAt: Scalars["DateTime"]["output"];
  description?: Maybe<Scalars["String"]["output"]>;
  id: Scalars["String"]["output"];
  status: Scalars["String"]["output"];
};

export type InvoiceConnection = {
  hasNext: Scalars["Boolean"]["output"];
  hasPrevious: Scalars["Boolean"]["output"];
  items: Array<Invoice>;
  limit: Scalars["Int"]["output"];
  offset: Scalars["Int"]["output"];
  total: Scalars["Int"]["output"];
};

export type InvoicePaginationInput = {
  limit?: Scalars["Int"]["input"];
  offset?: Scalars["Int"]["input"];
};

export type JobConnection = {
  jobs: Array<SchedulerJob>;
  pageInfo: PageInfo;
};

export type JobMutation = {
  createContact360Export: SchedulerJob;
  createContact360Import: SchedulerJob;
  createEmailFinderExport: SchedulerJob;
  createEmailPatternExport: SchedulerJob;
  createEmailVerifyExport: SchedulerJob;
  createJobTicket: JobTicket;
  pauseConnectraJob: Scalars["JSON"]["output"];
  pauseJob: Scalars["JSON"]["output"];
  resumeConnectraJob: Scalars["JSON"]["output"];
  resumeJob: Scalars["JSON"]["output"];
  retryJob: Scalars["JSON"]["output"];
  terminateConnectraJob: Scalars["JSON"]["output"];
  terminateJob: Scalars["JSON"]["output"];
};

export type JobMutationCreateContact360ExportArgs = {
  input: CreateContact360ExportInput;
};

export type JobMutationCreateContact360ImportArgs = {
  input: CreateContact360ImportInput;
};

export type JobMutationCreateEmailFinderExportArgs = {
  input: CreateEmailFinderExportInput;
};

export type JobMutationCreateEmailPatternExportArgs = {
  input: CreateEmailPatternExportInput;
};

export type JobMutationCreateEmailVerifyExportArgs = {
  input: CreateEmailVerifyExportInput;
};

export type JobMutationCreateJobTicketArgs = {
  input: CreateJobTicketInput;
};

export type JobMutationPauseConnectraJobArgs = {
  jobUuid: Scalars["String"]["input"];
};

export type JobMutationPauseJobArgs = {
  input: PauseJobInput;
};

export type JobMutationResumeConnectraJobArgs = {
  jobUuid: Scalars["String"]["input"];
};

export type JobMutationResumeJobArgs = {
  input: ResumeJobInput;
};

export type JobMutationRetryJobArgs = {
  input: RetryJobInput;
};

export type JobMutationTerminateConnectraJobArgs = {
  jobUuid: Scalars["String"]["input"];
};

export type JobMutationTerminateJobArgs = {
  input: TerminateJobInput;
};

export type JobQuery = {
  deadLetterJobs: JobConnection;
  job: SchedulerJob;
  jobOutputCsvDownloadUrl?: Maybe<S3DownloadUrlResponse>;
  jobs: JobConnection;
  myJobTickets: JobTicketConnection;
};

export type JobQueryDeadLetterJobsArgs = {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

export type JobQueryJobArgs = {
  jobId: Scalars["ID"]["input"];
};

export type JobQueryJobOutputCsvDownloadUrlArgs = {
  expiresIn?: InputMaybe<Scalars["Int"]["input"]>;
  jobId: Scalars["ID"]["input"];
};

export type JobQueryJobsArgs = {
  jobFamily?: InputMaybe<Scalars["String"]["input"]>;
  jobType?: InputMaybe<Scalars["String"]["input"]>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  relatedFileKey?: InputMaybe<Scalars["String"]["input"]>;
  status?: InputMaybe<Scalars["String"]["input"]>;
};

export type JobQueryMyJobTicketsArgs = {
  externalJobId?: InputMaybe<Scalars["String"]["input"]>;
  jobSource?: InputMaybe<Scalars["String"]["input"]>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  status?: InputMaybe<Scalars["String"]["input"]>;
};

export type JobTicket = {
  adminNotes?: Maybe<Scalars["String"]["output"]>;
  createdAt: Scalars["DateTime"]["output"];
  description: Scalars["String"]["output"];
  externalJobId: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  jobSource: Scalars["String"]["output"];
  jobStatusSnapshot?: Maybe<Scalars["String"]["output"]>;
  jobType?: Maybe<Scalars["String"]["output"]>;
  resolvedAt?: Maybe<Scalars["DateTime"]["output"]>;
  resolvedByUserId?: Maybe<Scalars["ID"]["output"]>;
  severity: Scalars["String"]["output"];
  status: Scalars["String"]["output"];
  title: Scalars["String"]["output"];
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
  userId: Scalars["ID"]["output"];
};

export type JobTicketConnection = {
  pageInfo: PageInfo;
  tickets: Array<JobTicket>;
};

export type KnowledgeArticle = {
  body: Scalars["String"]["output"];
  createdAt: Scalars["DateTime"]["output"];
  createdByUserId?: Maybe<Scalars["String"]["output"]>;
  id: Scalars["String"]["output"];
  tags: Scalars["JSON"]["output"];
  title: Scalars["String"]["output"];
  updatedAt: Scalars["DateTime"]["output"];
};

export type KnowledgeMutation = {
  createArticle: KnowledgeArticle;
  deleteArticle: Scalars["Boolean"]["output"];
  updateArticle: KnowledgeArticle;
};

export type KnowledgeMutationCreateArticleArgs = {
  input: CreateKnowledgeArticleInput;
};

export type KnowledgeMutationDeleteArticleArgs = {
  articleId: Scalars["ID"]["input"];
};

export type KnowledgeMutationUpdateArticleArgs = {
  input: UpdateKnowledgeArticleInput;
};

export type KnowledgeQuery = {
  articles: Array<KnowledgeArticle>;
};

export type KnowledgeQueryArticlesArgs = {
  limit?: Scalars["Int"]["input"];
  offset?: Scalars["Int"]["input"];
};

export type LinkedInMutation = {
  search: LinkedInSearchResponse;
  upsertByLinkedInUrl: LinkedInUpsertResponse;
};

export type LinkedInMutationSearchArgs = {
  input: LinkedInSearchInput;
};

export type LinkedInMutationUpsertByLinkedInUrlArgs = {
  input: LinkedInUpsertInput;
};

export type LinkedInSearchInput = {
  url: Scalars["String"]["input"];
};

export type LinkedInSearchResponse = {
  companies: Array<CompanyWithRelations>;
  contacts: Array<ContactWithRelations>;
  totalCompanies: Scalars["Int"]["output"];
  totalContacts: Scalars["Int"]["output"];
};

export type LinkedInUpsertInput = {
  companyData?: InputMaybe<Scalars["JSON"]["input"]>;
  companyMetadata?: InputMaybe<Scalars["JSON"]["input"]>;
  contactData?: InputMaybe<Scalars["JSON"]["input"]>;
  contactMetadata?: InputMaybe<Scalars["JSON"]["input"]>;
  url: Scalars["String"]["input"];
};

export type LinkedInUpsertResponse = {
  company?: Maybe<CompanyWithRelations>;
  contact?: Maybe<ContactWithRelations>;
  created: Scalars["Boolean"]["output"];
  errors: Array<Scalars["String"]["output"]>;
  success: Scalars["Boolean"]["output"];
};

export type LogConnection = {
  items: Array<LogEntry>;
  pageInfo: PageInfo;
};

export type LogEntry = {
  context?: Maybe<Scalars["JSON"]["output"]>;
  error?: Maybe<Scalars["JSON"]["output"]>;
  id: Scalars["String"]["output"];
  level: Scalars["String"]["output"];
  logger: Scalars["String"]["output"];
  message: Scalars["String"]["output"];
  performance?: Maybe<Scalars["JSON"]["output"]>;
  requestId?: Maybe<Scalars["String"]["output"]>;
  timestamp: Scalars["DateTime"]["output"];
  userId?: Maybe<Scalars["String"]["output"]>;
};

export type LogQueryFilterInput = {
  endTime?: InputMaybe<Scalars["DateTime"]["input"]>;
  level?: InputMaybe<Scalars["String"]["input"]>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  logger?: InputMaybe<Scalars["String"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  requestId?: InputMaybe<Scalars["String"]["input"]>;
  startTime?: InputMaybe<Scalars["DateTime"]["input"]>;
  userId?: InputMaybe<Scalars["ID"]["input"]>;
};

export type LogSearchConnection = {
  items: Array<LogEntry>;
  pageInfo: PageInfo;
  query: Scalars["String"]["output"];
};

export type LogSearchInput = {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  query: Scalars["String"]["input"];
};

export type LogStatistics = {
  avgResponseTimeMs: Scalars["Float"]["output"];
  byLevel: Scalars["JSON"]["output"];
  byLogger?: Maybe<Scalars["JSON"]["output"]>;
  errorRate: Scalars["Float"]["output"];
  performanceTrends: Array<PerformanceTrend>;
  slowQueriesCount: Scalars["Int"]["output"];
  timeRange: Scalars["String"]["output"];
  topErrors: Array<TopError>;
  totalLogs: Scalars["Int"]["output"];
  userActivity: UserActivity;
};

export type LoginInput = {
  email: Scalars["String"]["input"];
  geolocation?: InputMaybe<GeolocationInput>;
  password: Scalars["String"]["input"];
};

export type MarkReadInput = {
  /** List of notification IDs to mark as read */
  notificationIds: Array<Scalars["ID"]["input"]>;
};

export type MarkReadResponse = {
  count: Scalars["Int"]["output"];
};

export type Message = {
  /** Optional model confidence label or score (AI messages; Stage 4.2). */
  confidence?: Maybe<Scalars["String"]["output"]>;
  contacts?: Maybe<Array<ContactInMessage>>;
  /** Optional short rationale for the reply (AI messages; Stage 4.2). */
  explanation?: Maybe<Scalars["String"]["output"]>;
  sender: Scalars["String"]["output"];
  text: Scalars["String"]["output"];
};

export type MessageInput = {
  /** Optional confidence label or score (AI messages) */
  confidence?: InputMaybe<Scalars["String"]["input"]>;
  /** Array of contact objects when AI returns search results */
  contacts?: InputMaybe<Array<ContactInMessageInput>>;
  /** Optional rationale text (AI messages) */
  explanation?: InputMaybe<Scalars["String"]["input"]>;
  /** Message sender: 'user' or 'ai' */
  sender: Scalars["String"]["input"];
  /** Message text content */
  text: Scalars["String"]["input"];
};

export type MetricAggregation = {
  avg: Scalars["Float"]["output"];
  count: Scalars["Int"]["output"];
  max: Scalars["Float"]["output"];
  min: Scalars["Float"]["output"];
  p50: Scalars["Float"]["output"];
  p75: Scalars["Float"]["output"];
  p95: Scalars["Float"]["output"];
};

export type ModelSelection = "FLASH" | "FLASH_2_0" | "PRO" | "PRO_2_5";

export type Mutation = {
  admin: AdminMutation;
  aiChats: AiChatMutation;
  analytics: AnalyticsMutation;
  auth: AuthMutation;
  billing: BillingMutation;
  campaigns: CampaignModuleMutation;
  companies: CompanyMutation;
  contacts: ContactMutation;
  email: EmailMutation;
  hireSignal: HireSignalMutation;
  jobs: JobMutation;
  knowledge: KnowledgeMutation;
  linkedin: LinkedInMutation;
  notifications: NotificationMutation;
  phone: PhoneMutation;
  profile: ProfileMutation;
  resume: ResumeMutation;
  s3: S3Mutation;
  salesNavigator: SalesNavigatorMutation;
  savedSearches: SavedSearchMutation;
  twoFactor: TwoFactorMutation;
  upload: UploadMutation;
  usage: UsageMutation;
  users: UserMutation;
};

export type Notification = {
  actionLabel?: Maybe<Scalars["String"]["output"]>;
  actionUrl?: Maybe<Scalars["String"]["output"]>;
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["ID"]["output"];
  message: Scalars["String"]["output"];
  metadata?: Maybe<Scalars["JSON"]["output"]>;
  priority: GraphQlNotificationPriority;
  read: Scalars["Boolean"]["output"];
  readAt?: Maybe<Scalars["DateTime"]["output"]>;
  title: Scalars["String"]["output"];
  type: GraphQlNotificationType;
  userId: Scalars["ID"]["output"];
};

export type NotificationConnection = {
  items: Array<Notification>;
  pageInfo: PageInfo;
};

export type NotificationFilterInput = {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  /** Optional notification type filter */
  type?: InputMaybe<GraphQlNotificationType>;
  /** If true, only return unread notifications */
  unreadOnly?: Scalars["Boolean"]["input"];
};

export type NotificationMutation = {
  deleteNotifications: DeleteNotificationsResponse;
  markNotificationAsRead: Notification;
  markNotificationsAsRead: MarkReadResponse;
  updateNotificationPreferences: NotificationPreferences;
};

export type NotificationMutationDeleteNotificationsArgs = {
  input: DeleteNotificationsInput;
};

export type NotificationMutationMarkNotificationAsReadArgs = {
  notificationId: Scalars["ID"]["input"];
};

export type NotificationMutationMarkNotificationsAsReadArgs = {
  input: MarkReadInput;
};

export type NotificationMutationUpdateNotificationPreferencesArgs = {
  input: UpdateNotificationPreferencesInput;
};

export type NotificationPreferences = {
  billingUpdates: Scalars["Boolean"]["output"];
  emailDigest: Scalars["Boolean"]["output"];
  emailEnabled: Scalars["Boolean"]["output"];
  marketing: Scalars["Boolean"]["output"];
  newLeads: Scalars["Boolean"]["output"];
  pushEnabled: Scalars["Boolean"]["output"];
  securityAlerts: Scalars["Boolean"]["output"];
};

export type NotificationQuery = {
  notification: Notification;
  notificationPreferences: NotificationPreferences;
  notifications: NotificationConnection;
  unreadCount: UnreadCountResponse;
};

export type NotificationQueryNotificationArgs = {
  notificationId: Scalars["ID"]["input"];
};

export type NotificationQueryNotificationsArgs = {
  filters?: InputMaybe<NotificationFilterInput>;
};

export type PageContent = {
  content: Scalars["String"]["output"];
  pageId: Scalars["String"]["output"];
};

export type PageDetail = {
  category?: Maybe<Scalars["String"]["output"]>;
  contentUrl?: Maybe<Scalars["String"]["output"]>;
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  description?: Maybe<Scalars["String"]["output"]>;
  pageId: Scalars["String"]["output"];
  pageType: Scalars["String"]["output"];
  route?: Maybe<Scalars["String"]["output"]>;
  status: Scalars["String"]["output"];
  title: Scalars["String"]["output"];
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
  version: Scalars["Int"]["output"];
};

export type PageInfo = {
  hasNext: Scalars["Boolean"]["output"];
  hasPrevious: Scalars["Boolean"]["output"];
  limit: Scalars["Int"]["output"];
  offset: Scalars["Int"]["output"];
  total: Scalars["Int"]["output"];
};

export type PageList = {
  pages: Array<PageSummary>;
  total: Scalars["Int"]["output"];
};

export type PageSummary = {
  pageId: Scalars["String"]["output"];
  pageType: Scalars["String"]["output"];
  route?: Maybe<Scalars["String"]["output"]>;
  status: Scalars["String"]["output"];
  title: Scalars["String"]["output"];
};

export type PageTypeInfo = {
  count: Scalars["Int"]["output"];
  type: Scalars["String"]["output"];
};

export type PageTypeList = {
  total: Scalars["Int"]["output"];
  types: Array<PageTypeInfo>;
};

export type PagesQuery = {
  dashboardPages: DashboardPageList;
  marketingPages: DashboardPageList;
  myPages: PageList;
  page: PageDetail;
  pageAccessControl: Scalars["JSON"]["output"];
  pageComponents: Scalars["JSON"]["output"];
  pageContent: PageContent;
  pageEndpoints: Scalars["JSON"]["output"];
  pageSections: Scalars["JSON"]["output"];
  pageStatistics: TypeStatistics;
  pageTypes: PageTypeList;
  pageVersions: Scalars["JSON"]["output"];
  pages: PageList;
  pagesByDocsaiUserType: PageList;
  pagesByState: PageList;
  pagesByStateCount: Scalars["Int"]["output"];
  pagesByType: PageList;
  pagesByUserType: PageList;
};

export type PagesQueryDashboardPagesArgs = {
  page?: Scalars["Int"]["input"];
  pageSize?: Scalars["Int"]["input"];
  pageType?: InputMaybe<Scalars["String"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
  status?: InputMaybe<Scalars["String"]["input"]>;
};

export type PagesQueryMarketingPagesArgs = {
  page?: Scalars["Int"]["input"];
  pageSize?: Scalars["Int"]["input"];
  search?: InputMaybe<Scalars["String"]["input"]>;
  status?: InputMaybe<Scalars["String"]["input"]>;
};

export type PagesQueryMyPagesArgs = {
  pageType?: InputMaybe<Scalars["String"]["input"]>;
};

export type PagesQueryPageArgs = {
  pageId: Scalars["String"]["input"];
  pageType?: InputMaybe<Scalars["String"]["input"]>;
};

export type PagesQueryPageAccessControlArgs = {
  pageId: Scalars["String"]["input"];
};

export type PagesQueryPageComponentsArgs = {
  pageId: Scalars["String"]["input"];
};

export type PagesQueryPageContentArgs = {
  pageId: Scalars["String"]["input"];
};

export type PagesQueryPageEndpointsArgs = {
  pageId: Scalars["String"]["input"];
};

export type PagesQueryPageSectionsArgs = {
  pageId: Scalars["String"]["input"];
};

export type PagesQueryPageStatisticsArgs = {
  pageType: Scalars["String"]["input"];
};

export type PagesQueryPageVersionsArgs = {
  pageId: Scalars["String"]["input"];
};

export type PagesQueryPagesArgs = {
  includeDeleted?: Scalars["Boolean"]["input"];
  includeDrafts?: Scalars["Boolean"]["input"];
  limit?: Scalars["Int"]["input"];
  offset?: Scalars["Int"]["input"];
  pageType?: InputMaybe<Scalars["String"]["input"]>;
  status?: InputMaybe<Scalars["String"]["input"]>;
};

export type PagesQueryPagesByDocsaiUserTypeArgs = {
  pageType?: InputMaybe<Scalars["String"]["input"]>;
  userType: Scalars["String"]["input"];
};

export type PagesQueryPagesByStateArgs = {
  state: Scalars["String"]["input"];
};

export type PagesQueryPagesByStateCountArgs = {
  state: Scalars["String"]["input"];
};

export type PagesQueryPagesByTypeArgs = {
  includeDeleted?: Scalars["Boolean"]["input"];
  includeDrafts?: Scalars["Boolean"]["input"];
  pageType: Scalars["String"]["input"];
  status?: InputMaybe<Scalars["String"]["input"]>;
};

export type PagesQueryPagesByUserTypeArgs = {
  userType: Scalars["String"]["input"];
};

export type ParseFiltersInput = {
  /** Natural language query describing the contact filters to extract */
  query: Scalars["String"]["input"];
};

export type ParseFiltersResponse = {
  /** List of extracted company names */
  companyNames?: Maybe<Array<Scalars["String"]["output"]>>;
  /** Employee count range as [min, max]. Returns null if no range specified */
  employees?: Maybe<Array<Scalars["Int"]["output"]>>;
  /** List of extracted industry sectors */
  industry?: Maybe<Array<Scalars["String"]["output"]>>;
  /** List of extracted job titles (e.g., 'VP', 'CEO', 'Director', 'Engineer') */
  jobTitles?: Maybe<Array<Scalars["String"]["output"]>>;
  /** List of extracted locations (city, state, country) */
  location?: Maybe<Array<Scalars["String"]["output"]>>;
  /** List of extracted seniority levels (e.g., 'CXO', 'VP', 'Director', 'Manager') */
  seniority?: Maybe<Array<Scalars["String"]["output"]>>;
};

export type PauseJobInput = {
  jobId: Scalars["ID"]["input"];
};

export type PaymentInstructions = {
  email: Scalars["String"]["output"];
  phoneNumber: Scalars["String"]["output"];
  qrCodeBucketId?: Maybe<Scalars["String"]["output"]>;
  qrCodeDownloadUrl?: Maybe<Scalars["String"]["output"]>;
  qrCodeS3Key?: Maybe<Scalars["String"]["output"]>;
  upiId: Scalars["String"]["output"];
};

export type PaymentReceiptUploadResult = {
  fileKey: Scalars["String"]["output"];
};

export type PaymentSubmission = {
  addonPackageId?: Maybe<Scalars["String"]["output"]>;
  amount: Scalars["Float"]["output"];
  createdAt: Scalars["DateTime"]["output"];
  creditsToAdd: Scalars["Int"]["output"];
  declineReason?: Maybe<Scalars["String"]["output"]>;
  id: Scalars["String"]["output"];
  planPeriod?: Maybe<Scalars["String"]["output"]>;
  planTier?: Maybe<Scalars["String"]["output"]>;
  reviewedAt?: Maybe<Scalars["DateTime"]["output"]>;
  reviewedBy?: Maybe<Scalars["String"]["output"]>;
  screenshotDownloadUrl?: Maybe<Scalars["String"]["output"]>;
  screenshotS3Key: Scalars["String"]["output"];
  status: Scalars["String"]["output"];
  userBucket?: Maybe<Scalars["String"]["output"]>;
  userEmail?: Maybe<Scalars["String"]["output"]>;
  userId: Scalars["String"]["output"];
};

export type PaymentSubmissionConnection = {
  hasNext: Scalars["Boolean"]["output"];
  hasPrevious: Scalars["Boolean"]["output"];
  items: Array<PaymentSubmission>;
  limit: Scalars["Int"]["output"];
  offset: Scalars["Int"]["output"];
  total: Scalars["Int"]["output"];
};

export type PerformanceMetric = {
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["ID"]["output"];
  metadata?: Maybe<Scalars["JSON"]["output"]>;
  metricName: Scalars["String"]["output"];
  metricValue: Scalars["Float"]["output"];
  timestamp: Scalars["DateTime"]["output"];
  userId: Scalars["ID"]["output"];
};

export type PerformanceMetricResponse = {
  message: Scalars["String"]["output"];
  success: Scalars["Boolean"]["output"];
};

export type PerformanceStats = {
  cache: CacheStats;
  database: DatabaseHealth;
  endpointPerformance: EndpointPerformance;
  s3: S3Health;
  slowQueries: SlowQueriesStats;
  tokenBlacklistCleanup: TokenBlacklistCleanupStats;
};

export type PerformanceTrend = {
  avgDurationMs: Scalars["Float"]["output"];
  p95DurationMs: Scalars["Float"]["output"];
  slowQueriesCount: Scalars["Int"]["output"];
  time: Scalars["DateTime"]["output"];
};

export type PhoneFinderInput = {
  domain?: InputMaybe<Scalars["String"]["input"]>;
  firstName: Scalars["String"]["input"];
  lastName: Scalars["String"]["input"];
  website?: InputMaybe<Scalars["String"]["input"]>;
};

export type PhoneMutation = {
  addPhonePattern: PhonePatternResult;
  addPhonePatternBulk: PhonePatternBulkAddResponse;
};

export type PhoneMutationAddPhonePatternArgs = {
  input: PhonePatternAddInput;
};

export type PhoneMutationAddPhonePatternBulkArgs = {
  input: PhonePatternBulkAddInput;
};

export type PhonePatternAddInput = {
  companyUuid: Scalars["String"]["input"];
  domain: Scalars["String"]["input"];
  email: Scalars["String"]["input"];
  firstName: Scalars["String"]["input"];
  lastName: Scalars["String"]["input"];
};

export type PhonePatternBulkAddInput = {
  items: Array<PhonePatternBulkItemInput>;
};

export type PhonePatternBulkAddResponse = {
  inserted?: Maybe<Scalars["Int"]["output"]>;
  results: Array<PhonePatternResult>;
  skipped?: Maybe<Scalars["Int"]["output"]>;
  success: Scalars["Boolean"]["output"];
  total?: Maybe<Scalars["Int"]["output"]>;
};

export type PhonePatternBulkItemInput = {
  companyUuid: Scalars["String"]["input"];
  domain: Scalars["String"]["input"];
  email: Scalars["String"]["input"];
  firstName: Scalars["String"]["input"];
  lastName: Scalars["String"]["input"];
};

export type PhonePatternPredictInput = {
  domain: Scalars["String"]["input"];
  firstName: Scalars["String"]["input"];
  lastName: Scalars["String"]["input"];
};

export type PhonePatternResult = {
  companyUuid: Scalars["String"]["output"];
  contactCount?: Maybe<Scalars["Int"]["output"]>;
  createdAt?: Maybe<Scalars["String"]["output"]>;
  domain: Scalars["String"]["output"];
  isAutoExtracted?: Maybe<Scalars["Boolean"]["output"]>;
  patternFormat?: Maybe<Scalars["String"]["output"]>;
  patternString?: Maybe<Scalars["String"]["output"]>;
  updatedAt?: Maybe<Scalars["String"]["output"]>;
  uuid: Scalars["String"]["output"];
};

export type PhoneQuery = {
  findPhone: Scalars["JSON"]["output"];
  findPhoneBulk: Scalars["JSON"]["output"];
  phoneJobStatus: Scalars["JSON"]["output"];
  phoneSatelliteJobs: Scalars["JSON"]["output"];
  predictPhonePattern: Scalars["JSON"]["output"];
  predictPhonePatternBulk: Scalars["JSON"]["output"];
  verifyPhone: Scalars["JSON"]["output"];
  verifyPhonesBulk: Scalars["JSON"]["output"];
};

export type PhoneQueryFindPhoneArgs = {
  input: PhoneFinderInput;
};

export type PhoneQueryFindPhoneBulkArgs = {
  input: BulkPhoneFinderInput;
};

export type PhoneQueryPhoneJobStatusArgs = {
  jobId: Scalars["String"]["input"];
};

export type PhoneQueryPredictPhonePatternArgs = {
  input: PhonePatternPredictInput;
};

export type PhoneQueryPredictPhonePatternBulkArgs = {
  input: BulkPhonePatternPredictInput;
};

export type PhoneQueryVerifyPhoneArgs = {
  input: SinglePhoneVerifierInput;
};

export type PhoneQueryVerifyPhonesBulkArgs = {
  input: BulkPhoneVerifierInput;
};

export type PlanPeriod = {
  credits: Scalars["Int"]["output"];
  period: Scalars["String"]["output"];
  price: Scalars["Float"]["output"];
  ratePerCredit: Scalars["Float"]["output"];
  savings?: Maybe<Savings>;
};

export type PlanPeriodInput = {
  credits: Scalars["Int"]["input"];
  period: Scalars["String"]["input"];
  price: Scalars["Float"]["input"];
  ratePerCredit: Scalars["Float"]["input"];
  savingsAmount?: InputMaybe<Scalars["Float"]["input"]>;
  savingsPercentage?: InputMaybe<Scalars["Int"]["input"]>;
};

export type PlanPeriods = {
  monthly?: Maybe<PlanPeriod>;
  quarterly?: Maybe<PlanPeriod>;
  yearly?: Maybe<PlanPeriod>;
};

export type PopulateConfigInput = {
  populate?: Scalars["Boolean"]["input"];
  selectColumns?: InputMaybe<Array<Scalars["String"]["input"]>>;
};

export type PresignedUrlResponse = {
  alreadyUploaded: Scalars["Boolean"]["output"];
  etag?: Maybe<Scalars["String"]["output"]>;
  partNumber: Scalars["Int"]["output"];
  presignedUrl?: Maybe<Scalars["String"]["output"]>;
};

export type ProfileMutation = {
  createAPIKey: ApiKey;
  deleteAPIKey: Scalars["Boolean"]["output"];
  inviteTeamMember: TeamMember;
  removeTeamMember: Scalars["Boolean"]["output"];
  revokeAllOtherSessions: Scalars["Boolean"]["output"];
  revokeSession: Scalars["Boolean"]["output"];
  updateTeamMemberRole: TeamMember;
};

export type ProfileMutationCreateApiKeyArgs = {
  input: CreateApiKeyInput;
};

export type ProfileMutationDeleteApiKeyArgs = {
  id: Scalars["ID"]["input"];
};

export type ProfileMutationInviteTeamMemberArgs = {
  input: InviteTeamMemberInput;
};

export type ProfileMutationRemoveTeamMemberArgs = {
  id: Scalars["ID"]["input"];
};

export type ProfileMutationRevokeSessionArgs = {
  id: Scalars["ID"]["input"];
};

export type ProfileMutationUpdateTeamMemberRoleArgs = {
  id: Scalars["ID"]["input"];
  role: Scalars["String"]["input"];
};

export type ProfileQuery = {
  listAPIKeys: ApiKeyList;
  listSessions: SessionList;
  listTeamMembers: TeamList;
};

export type PromoteToAdminInput = {
  userId: Scalars["ID"]["input"];
};

export type PromoteToSuperAdminInput = {
  approvalId?: InputMaybe<Scalars["ID"]["input"]>;
  userId: Scalars["ID"]["input"];
};

export type PurchaseAddonInput = {
  packageId: Scalars["String"]["input"];
};

export type PurchaseAddonResult = {
  creditsAdded: Scalars["Int"]["output"];
  message: Scalars["String"]["output"];
  package: Scalars["String"]["output"];
  totalCredits: Scalars["Int"]["output"];
};

export type Query = {
  activities: ActivityQuery;
  admin: AdminQuery;
  aiChats: AiChatQuery;
  analytics: AnalyticsQuery;
  auth: AuthQuery;
  billing: BillingQuery;
  campaignSatellite: CampaignModuleQuery;
  companies: CompanyQuery;
  contacts: ContactQuery;
  email: EmailQuery;
  featureOverview: FeatureOverviewQuery;
  health: HealthQuery;
  hireSignal: HireSignalQuery;
  jobs: JobQuery;
  knowledge: KnowledgeQuery;
  notifications: NotificationQuery;
  pages: PagesQuery;
  phone: PhoneQuery;
  profile: ProfileQuery;
  resume: ResumeQuery;
  s3: S3Query;
  salesNavigator: SalesNavigatorQuery;
  savedSearches: SavedSearchQuery;
  twoFactor: TwoFactorQuery;
  upload: UploadQuery;
  usage: UsageQuery;
  users: UserQuery;
};

export type RefreshTokenInput = {
  refreshToken: Scalars["String"]["input"];
};

export type RegenerateBackupCodesResponse = {
  backupCodes: Array<Scalars["String"]["output"]>;
};

export type RegisterInput = {
  email: Scalars["String"]["input"];
  geolocation?: InputMaybe<GeolocationInput>;
  name: Scalars["String"]["input"];
  password: Scalars["String"]["input"];
};

export type RegisterPartInput = {
  etag: Scalars["String"]["input"];
  partNumber: Scalars["Int"]["input"];
  uploadId: Scalars["String"]["input"];
};

export type RegisterPartResponse = {
  partNumber: Scalars["Int"]["output"];
  status: Scalars["String"]["output"];
};

export type RequestDangerousApprovalInput = {
  operation: DangerousAdminOperation;
  targetUserId: Scalars["ID"]["input"];
};

export type RequestPasswordResetInput = {
  email: Scalars["String"]["input"];
};

export type ResetPasswordInput = {
  email: Scalars["String"]["input"];
  newPassword: Scalars["String"]["input"];
  token: Scalars["String"]["input"];
};

export type ResetUsageInput = {
  feature: Scalars["String"]["input"];
};

export type ResetUsageResponse = {
  feature: Scalars["String"]["output"];
  limit: Scalars["Int"]["output"];
  success: Scalars["Boolean"]["output"];
  used: Scalars["Int"]["output"];
};

export type ResumeJobInput = {
  jobId: Scalars["ID"]["input"];
};

export type ResumeMutation = {
  deleteResume: Scalars["Boolean"]["output"];
  saveResume: ResumeRecord;
};

export type ResumeMutationDeleteResumeArgs = {
  id: Scalars["ID"]["input"];
};

export type ResumeMutationSaveResumeArgs = {
  input: SaveResumeInput;
};

export type ResumeQuery = {
  resume: ResumeRecord;
  resumes: Array<ResumeRecord>;
};

export type ResumeQueryResumeArgs = {
  id: Scalars["ID"]["input"];
};

export type ResumeRecord = {
  createdAt: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  resumeData: Scalars["JSON"]["output"];
  updatedAt: Scalars["String"]["output"];
  userId: Scalars["String"]["output"];
};

export type RetryJobInput = {
  data?: InputMaybe<Scalars["JSON"]["input"]>;
  jobId: Scalars["ID"]["input"];
  priority?: InputMaybe<Scalars["Int"]["input"]>;
  retryCount?: Scalars["Int"]["input"];
  retryInterval?: Scalars["Int"]["input"];
  runAfter?: InputMaybe<Scalars["String"]["input"]>;
};

export type S3DownloadUrlResponse = {
  downloadUrl: Scalars["String"]["output"];
  expiresIn: Scalars["Int"]["output"];
};

export type S3FileData = {
  fileKey: Scalars["String"]["output"];
  limit: Scalars["Int"]["output"];
  offset: Scalars["Int"]["output"];
  rows: Array<S3FileDataRow>;
  totalRows?: Maybe<Scalars["Int"]["output"]>;
};

export type S3FileDataRow = {
  data: Scalars["JSON"]["output"];
};

export type S3FileInfo = {
  contentType?: Maybe<Scalars["String"]["output"]>;
  filename: Scalars["String"]["output"];
  key: Scalars["String"]["output"];
  lastModified?: Maybe<Scalars["DateTime"]["output"]>;
  size?: Maybe<Scalars["BigInt"]["output"]>;
};

export type S3FileList = {
  bucketDisplayName?: Maybe<Scalars["String"]["output"]>;
  files: Array<S3FileInfo>;
  total: Scalars["Int"]["output"];
};

export type S3FileStats = {
  columns: Scalars["JSON"]["output"];
  rowCount?: Maybe<Scalars["Int"]["output"]>;
};

export type S3Health = {
  bucket?: Maybe<Scalars["String"]["output"]>;
  error?: Maybe<Scalars["String"]["output"]>;
  message: Scalars["String"]["output"];
  region?: Maybe<Scalars["String"]["output"]>;
  status: Scalars["String"]["output"];
};

export type S3Mutation = {
  completeCsvUpload: CompleteUploadResponse;
  deleteFile: Scalars["Boolean"]["output"];
  initiateCsvUpload: InitiateUploadResponse;
};

export type S3MutationCompleteCsvUploadArgs = {
  input: CompleteUploadInput;
};

export type S3MutationDeleteFileArgs = {
  fileKey: Scalars["String"]["input"];
};

export type S3MutationInitiateCsvUploadArgs = {
  input: InitiateCsvUploadInput;
};

export type S3Query = {
  s3BucketMetadata: Scalars["JSON"]["output"];
  s3FileData: S3FileData;
  s3FileDownloadUrl: S3DownloadUrlResponse;
  s3FileInfo: S3FileInfo;
  s3FileSchema: Array<FileSchemaColumn>;
  s3FileStats: S3FileStats;
  s3Files: S3FileList;
};

export type S3QueryS3FileDataArgs = {
  fileKey: Scalars["String"]["input"];
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

export type S3QueryS3FileDownloadUrlArgs = {
  expiresIn?: InputMaybe<Scalars["Int"]["input"]>;
  fileKey: Scalars["String"]["input"];
};

export type S3QueryS3FileInfoArgs = {
  fileKey: Scalars["String"]["input"];
};

export type S3QueryS3FileSchemaArgs = {
  fileKey: Scalars["String"]["input"];
};

export type S3QueryS3FileStatsArgs = {
  fileKey: Scalars["String"]["input"];
};

export type S3QueryS3FilesArgs = {
  prefix?: InputMaybe<Scalars["String"]["input"]>;
};

export type SalesNavigatorFilterInput = {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

export type SalesNavigatorMutation = {
  saveSalesNavigatorProfiles: SaveProfilesResponse;
  scrapeSalesNavigatorHtml: ScrapeSalesNavigatorHtmlResponse;
};

export type SalesNavigatorMutationSaveSalesNavigatorProfilesArgs = {
  input: SaveProfilesInput;
};

export type SalesNavigatorMutationScrapeSalesNavigatorHtmlArgs = {
  input: ScrapeSalesNavigatorHtmlInput;
};

export type SalesNavigatorQuery = {
  entitiesByUuids: EntitiesByUuidsResponse;
  salesNavigatorRecords: UserScrapingConnection;
};

export type SalesNavigatorQueryEntitiesByUuidsArgs = {
  companyUuids?: InputMaybe<Array<Scalars["String"]["input"]>>;
  contactUuids?: InputMaybe<Array<Scalars["String"]["input"]>>;
};

export type SalesNavigatorQuerySalesNavigatorRecordsArgs = {
  filters?: InputMaybe<SalesNavigatorFilterInput>;
};

export type SatellitePingResult = {
  configured: Scalars["Boolean"]["output"];
  detail?: Maybe<Scalars["String"]["output"]>;
  name: Scalars["String"]["output"];
  status: Scalars["String"]["output"];
};

export type SaveProfilesInput = {
  profiles: Array<Scalars["JSON"]["input"]>;
};

export type SaveProfilesResponse = {
  companyUuids: Array<Scalars["String"]["output"]>;
  contactUuids: Array<Scalars["String"]["output"]>;
  errors: Array<Scalars["String"]["output"]>;
  savedCompanies?: Maybe<Scalars["JSON"]["output"]>;
  savedContacts?: Maybe<Scalars["JSON"]["output"]>;
  savedCount: Scalars["Int"]["output"];
  success: Scalars["Boolean"]["output"];
  totalProfiles: Scalars["Int"]["output"];
};

export type SaveResumeInput = {
  id?: InputMaybe<Scalars["ID"]["input"]>;
  resumeData: Scalars["JSON"]["input"];
};

export type SavedSearch = {
  createdAt: Scalars["DateTime"]["output"];
  description?: Maybe<Scalars["String"]["output"]>;
  filters?: Maybe<Scalars["JSON"]["output"]>;
  id: Scalars["ID"]["output"];
  lastUsedAt?: Maybe<Scalars["DateTime"]["output"]>;
  name: Scalars["String"]["output"];
  pageSize?: Maybe<Scalars["Int"]["output"]>;
  searchTerm?: Maybe<Scalars["String"]["output"]>;
  sortDirection?: Maybe<Scalars["String"]["output"]>;
  sortField?: Maybe<Scalars["String"]["output"]>;
  type: Scalars["String"]["output"];
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
  useCount: Scalars["Int"]["output"];
};

export type SavedSearchList = {
  searches: Array<SavedSearch>;
  total: Scalars["Int"]["output"];
};

export type SavedSearchMutation = {
  createSavedSearch: SavedSearch;
  deleteSavedSearch: Scalars["Boolean"]["output"];
  updateSavedSearch: SavedSearch;
  updateSavedSearchUsage: Scalars["Boolean"]["output"];
};

export type SavedSearchMutationCreateSavedSearchArgs = {
  input: CreateSavedSearchInput;
};

export type SavedSearchMutationDeleteSavedSearchArgs = {
  id: Scalars["ID"]["input"];
};

export type SavedSearchMutationUpdateSavedSearchArgs = {
  id: Scalars["ID"]["input"];
  input: UpdateSavedSearchInput;
};

export type SavedSearchMutationUpdateSavedSearchUsageArgs = {
  id: Scalars["ID"]["input"];
};

export type SavedSearchQuery = {
  getSavedSearch: SavedSearch;
  listSavedSearches: SavedSearchList;
};

export type SavedSearchQueryGetSavedSearchArgs = {
  id: Scalars["ID"]["input"];
};

export type SavedSearchQueryListSavedSearchesArgs = {
  limit?: Scalars["Int"]["input"];
  offset?: Scalars["Int"]["input"];
  type?: InputMaybe<Scalars["String"]["input"]>;
};

export type Savings = {
  amount?: Maybe<Scalars["Float"]["output"]>;
  percentage?: Maybe<Scalars["Int"]["output"]>;
};

export type SchedulerJob = {
  createdAt: Scalars["DateTime"]["output"];
  dagPayload?: Maybe<Scalars["JSON"]["output"]>;
  exportOutputBasePath?: Maybe<Scalars["String"]["output"]>;
  id: Scalars["ID"]["output"];
  jobFamily: Scalars["String"]["output"];
  jobId: Scalars["ID"]["output"];
  jobSubtype?: Maybe<Scalars["String"]["output"]>;
  jobType: Scalars["String"]["output"];
  outputObjectKey?: Maybe<Scalars["String"]["output"]>;
  processedRows?: Maybe<Scalars["Int"]["output"]>;
  requestPayload?: Maybe<Scalars["JSON"]["output"]>;
  responsePayload?: Maybe<Scalars["JSON"]["output"]>;
  sourceService: Scalars["String"]["output"];
  status: Scalars["String"]["output"];
  statusPayload?: Maybe<Scalars["JSON"]["output"]>;
  timelinePayload?: Maybe<Scalars["JSON"]["output"]>;
  totalRows?: Maybe<Scalars["Int"]["output"]>;
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
  userId: Scalars["ID"]["output"];
};

export type ScrapeJobType = {
  apifyRunId?: Maybe<Scalars["String"]["output"]>;
  completedAt?: Maybe<Scalars["DateTime"]["output"]>;
  createdAt: Scalars["DateTime"]["output"];
  error?: Maybe<Scalars["String"]["output"]>;
  id: Scalars["String"]["output"];
  itemCount?: Maybe<Scalars["Int"]["output"]>;
  jobServerResponse?: Maybe<Scalars["JSON"]["output"]>;
  requestBody: Scalars["JSON"]["output"];
  status: Scalars["String"]["output"];
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
  userId: Scalars["String"]["output"];
};

export type ScrapeSalesNavigatorHtmlInput = {
  html: Scalars["String"]["input"];
  includeMetadata?: Scalars["Boolean"]["input"];
  save?: Scalars["Boolean"]["input"];
};

export type ScrapeSalesNavigatorHtmlResponse = {
  companies?: Maybe<Scalars["JSON"]["output"]>;
  companyUuids: Array<Scalars["String"]["output"]>;
  contactUuids: Array<Scalars["String"]["output"]>;
  errors: Array<Scalars["String"]["output"]>;
  pageMetadata: Scalars["JSON"]["output"];
  profiles: Scalars["JSON"]["output"];
  saveSummary?: Maybe<Scalars["JSON"]["output"]>;
  savedCompanies?: Maybe<Scalars["JSON"]["output"]>;
  savedContacts?: Maybe<Scalars["JSON"]["output"]>;
  success: Scalars["Boolean"]["output"];
  warnings: Array<Scalars["String"]["output"]>;
};

export type SendMessageInput = {
  /** User message text (min length: 1) */
  message: Scalars["String"]["input"];
  /** Optional model selection override (defaults to configured model) */
  model?: InputMaybe<ModelSelection>;
};

export type Session = {
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["ID"]["output"];
  ipAddress?: Maybe<Scalars["String"]["output"]>;
  isCurrent: Scalars["Boolean"]["output"];
  lastActivity: Scalars["DateTime"]["output"];
  userAgent?: Maybe<Scalars["String"]["output"]>;
};

export type SessionInfo = {
  email: Scalars["String"]["output"];
  isAuthenticated: Scalars["Boolean"]["output"];
  lastSignInAt?: Maybe<Scalars["DateTime"]["output"]>;
  userUuid: Scalars["ID"]["output"];
};

export type SessionList = {
  sessions: Array<Session>;
  total: Scalars["Int"]["output"];
};

export type SingleEmailVerifierInput = {
  email: Scalars["String"]["input"];
  provider?: InputMaybe<Scalars["String"]["input"]>;
};

export type SingleEmailVerifierResponse = {
  result: VerifiedEmailResult;
  success: Scalars["Boolean"]["output"];
};

export type SinglePhoneVerifierInput = {
  email: Scalars["String"]["input"];
  provider?: InputMaybe<Scalars["String"]["input"]>;
};

export type SlowEndpoint = {
  averageTimeMs: Scalars["Float"]["output"];
  endpoint: Scalars["String"]["output"];
  requestCount: Scalars["Int"]["output"];
};

export type SlowQueriesStats = {
  countLastHour: Scalars["Int"]["output"];
  thresholdMs: Scalars["Int"]["output"];
};

export type SubmitPaymentProofInput = {
  addonPackageId?: InputMaybe<Scalars["String"]["input"]>;
  amount: Scalars["Float"]["input"];
  creditsToAdd: Scalars["Int"]["input"];
  planPeriod?: InputMaybe<Scalars["String"]["input"]>;
  planTier?: InputMaybe<Scalars["String"]["input"]>;
  screenshotS3Key: Scalars["String"]["input"];
};

export type SubmitPerformanceMetricInput = {
  /** Additional metadata about the metric (e.g., URL, user agent, connection type, endpoint, method) */
  metadata?: InputMaybe<Scalars["JSON"]["input"]>;
  /** Metric name (e.g., 'LCP', 'FID', 'CLS', 'TTFB', or custom metric name) */
  name: Scalars["String"]["input"];
  /** Timestamp in milliseconds (Unix timestamp * 1000) */
  timestamp: Scalars["BigInt"]["input"];
  /** Metric value (e.g., seconds for LCP, milliseconds for FID, score for CLS) */
  value: Scalars["Float"]["input"];
};

export type SubscribeInput = {
  period: Scalars["String"]["input"];
  tier: Scalars["String"]["input"];
};

export type SubscribeResult = {
  credits: Scalars["Int"]["output"];
  message: Scalars["String"]["output"];
  subscriptionEndsAt?: Maybe<Scalars["DateTime"]["output"]>;
  subscriptionPeriod: Scalars["String"]["output"];
  subscriptionPlan: Scalars["String"]["output"];
};

export type SubscriptionPlan = {
  category: Scalars["String"]["output"];
  name: Scalars["String"]["output"];
  periods: PlanPeriods;
  tier: Scalars["String"]["output"];
};

export type TeamList = {
  members: Array<TeamMember>;
  total: Scalars["Int"]["output"];
};

export type TeamMember = {
  email: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  invitedAt: Scalars["DateTime"]["output"];
  joinedAt?: Maybe<Scalars["DateTime"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  role: Scalars["String"]["output"];
  status: Scalars["String"]["output"];
};

export type TerminateJobInput = {
  jobId: Scalars["ID"]["input"];
};

export type TokenBlacklistCleanupStats = {
  cleanupIntervalSeconds: Scalars["Int"]["output"];
  lastError?: Maybe<Scalars["String"]["output"]>;
  lastReason?: Maybe<Scalars["String"]["output"]>;
  lastRemovedCount: Scalars["Int"]["output"];
  lastRunStatus: Scalars["String"]["output"];
};

export type TopError = {
  count: Scalars["Int"]["output"];
  lastSeen: Scalars["DateTime"]["output"];
  message: Scalars["String"]["output"];
  type: Scalars["String"]["output"];
};

export type TopUser = {
  requestCount: Scalars["Int"]["output"];
  userId: Scalars["String"]["output"];
};

export type TrackUsageInput = {
  amount?: Scalars["Int"]["input"];
  feature: Scalars["String"]["input"];
};

export type TrackUsageResponse = {
  feature: Scalars["String"]["output"];
  limit: Scalars["Int"]["output"];
  success: Scalars["Boolean"]["output"];
  used: Scalars["Int"]["output"];
};

export type TriggerSequenceInput = {
  contactId?: InputMaybe<Scalars["String"]["input"]>;
  email?: InputMaybe<Scalars["String"]["input"]>;
};

export type TwoFactorMutation = {
  disable2FA: Scalars["Boolean"]["output"];
  regenerateBackupCodes: RegenerateBackupCodesResponse;
  setup2FA: TwoFactorSetupResponse;
  verify2FA: Verify2FaResponse;
};

export type TwoFactorMutationDisable2FaArgs = {
  backupCode?: InputMaybe<Scalars["String"]["input"]>;
  password?: InputMaybe<Scalars["String"]["input"]>;
};

export type TwoFactorMutationVerify2FaArgs = {
  code: Scalars["String"]["input"];
};

export type TwoFactorQuery = {
  get2FAStatus: TwoFactorStatus;
};

export type TwoFactorSetupResponse = {
  backupCodes: Array<Scalars["String"]["output"]>;
  qrCodeData: Scalars["String"]["output"];
  qrCodeUrl: Scalars["String"]["output"];
  secret: Scalars["String"]["output"];
};

export type TwoFactorStatus = {
  enabled: Scalars["Boolean"]["output"];
  verified: Scalars["Boolean"]["output"];
};

export type TypeStatistics = {
  deleted: Scalars["Int"]["output"];
  draft: Scalars["Int"]["output"];
  lastUpdated?: Maybe<Scalars["String"]["output"]>;
  pageType: Scalars["String"]["output"];
  published: Scalars["Int"]["output"];
  total: Scalars["Int"]["output"];
};

export type UnreadCountResponse = {
  count: Scalars["Int"]["output"];
};

export type UpdateAiChatInput = {
  /** Complete list of messages (replaces existing messages) */
  messages?: InputMaybe<Array<MessageInput>>;
  /** Chat title (max 255 characters) */
  title?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateAddonInput = {
  credits?: InputMaybe<Scalars["Int"]["input"]>;
  isActive?: InputMaybe<Scalars["Boolean"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  price?: InputMaybe<Scalars["Float"]["input"]>;
  ratePerCredit?: InputMaybe<Scalars["Float"]["input"]>;
};

export type UpdateAddonResult = {
  id: Scalars["String"]["output"];
  message: Scalars["String"]["output"];
};

export type UpdateCampaignTemplateInput = {
  body?: InputMaybe<Scalars["String"]["input"]>;
  category?: InputMaybe<Scalars["String"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  subject?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateCompanyInput = {
  address?: InputMaybe<Scalars["String"]["input"]>;
  annualRevenue?: InputMaybe<Scalars["Int"]["input"]>;
  employeesCount?: InputMaybe<Scalars["Int"]["input"]>;
  industries?: InputMaybe<Array<Scalars["String"]["input"]>>;
  keywords?: InputMaybe<Array<Scalars["String"]["input"]>>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  technologies?: InputMaybe<Array<Scalars["String"]["input"]>>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  totalFunding?: InputMaybe<Scalars["Int"]["input"]>;
};

export type UpdateContactInput = {
  companyUuid?: InputMaybe<Scalars["ID"]["input"]>;
  departments?: InputMaybe<Array<Scalars["String"]["input"]>>;
  email?: InputMaybe<Scalars["String"]["input"]>;
  emailStatus?: InputMaybe<Scalars["String"]["input"]>;
  firstName?: InputMaybe<Scalars["String"]["input"]>;
  lastName?: InputMaybe<Scalars["String"]["input"]>;
  mobilePhone?: InputMaybe<Scalars["String"]["input"]>;
  seniority?: InputMaybe<Scalars["String"]["input"]>;
  status?: InputMaybe<Scalars["String"]["input"]>;
  textSearch?: InputMaybe<Scalars["String"]["input"]>;
  title?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateJobTicketStatusInput = {
  adminNotes?: InputMaybe<Scalars["String"]["input"]>;
  status: Scalars["String"]["input"];
  ticketId: Scalars["ID"]["input"];
};

export type UpdateKnowledgeArticleInput = {
  articleId: Scalars["ID"]["input"];
  body?: InputMaybe<Scalars["String"]["input"]>;
  tags?: InputMaybe<Array<Scalars["String"]["input"]>>;
  title?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateLogInput = {
  context?: InputMaybe<Scalars["JSON"]["input"]>;
  logId: Scalars["ID"]["input"];
  message?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateNotificationPreferencesInput = {
  billingUpdates?: InputMaybe<Scalars["Boolean"]["input"]>;
  emailDigest?: InputMaybe<Scalars["Boolean"]["input"]>;
  emailEnabled?: InputMaybe<Scalars["Boolean"]["input"]>;
  marketing?: InputMaybe<Scalars["Boolean"]["input"]>;
  newLeads?: InputMaybe<Scalars["Boolean"]["input"]>;
  pushEnabled?: InputMaybe<Scalars["Boolean"]["input"]>;
  securityAlerts?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type UpdatePaymentInstructionsInput = {
  email: Scalars["String"]["input"];
  phoneNumber: Scalars["String"]["input"];
  qrCodeBucketId?: InputMaybe<Scalars["String"]["input"]>;
  qrCodeS3Key?: InputMaybe<Scalars["String"]["input"]>;
  upiId: Scalars["String"]["input"];
};

export type UpdatePlanInput = {
  category?: InputMaybe<Scalars["String"]["input"]>;
  isActive?: InputMaybe<Scalars["Boolean"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdatePlanPeriodInput = {
  credits?: InputMaybe<Scalars["Int"]["input"]>;
  price?: InputMaybe<Scalars["Float"]["input"]>;
  ratePerCredit?: InputMaybe<Scalars["Float"]["input"]>;
  savingsAmount?: InputMaybe<Scalars["Float"]["input"]>;
  savingsPercentage?: InputMaybe<Scalars["Int"]["input"]>;
};

export type UpdatePlanResult = {
  message: Scalars["String"]["output"];
  tier: Scalars["String"]["output"];
};

export type UpdateProfileInput = {
  bio?: InputMaybe<Scalars["String"]["input"]>;
  jobTitle?: InputMaybe<Scalars["String"]["input"]>;
  notifications?: InputMaybe<Scalars["JSON"]["input"]>;
  timezone?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateSavedSearchInput = {
  description?: InputMaybe<Scalars["String"]["input"]>;
  filters?: InputMaybe<Scalars["JSON"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  pageSize?: InputMaybe<Scalars["Int"]["input"]>;
  searchTerm?: InputMaybe<Scalars["String"]["input"]>;
  sortDirection?: InputMaybe<Scalars["String"]["input"]>;
  sortField?: InputMaybe<Scalars["String"]["input"]>;
  type?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateSequenceStepInput = {
  body?: InputMaybe<Scalars["String"]["input"]>;
  delayHours?: InputMaybe<Scalars["Int"]["input"]>;
  stepType?: InputMaybe<Scalars["String"]["input"]>;
  subject?: InputMaybe<Scalars["String"]["input"]>;
  templateId?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateUserCreditsInput = {
  credits: Scalars["Int"]["input"];
  userId: Scalars["ID"]["input"];
};

export type UpdateUserInput = {
  email?: InputMaybe<Scalars["String"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateUserRoleInput = {
  role: Scalars["String"]["input"];
  userId: Scalars["ID"]["input"];
};

export type UploadAvatarInput = {
  fileData?: InputMaybe<Scalars["String"]["input"]>;
  filePath?: InputMaybe<Scalars["String"]["input"]>;
};

export type UploadMutation = {
  abortUpload: AbortUploadResponse;
  completeUpload: CompleteUploadResponse;
  initiateUpload: InitiateUploadResponse;
  registerPart: RegisterPartResponse;
};

export type UploadMutationAbortUploadArgs = {
  input: AbortUploadInput;
};

export type UploadMutationCompleteUploadArgs = {
  input: CompleteUploadInput;
};

export type UploadMutationInitiateUploadArgs = {
  input: InitiateUploadInput;
};

export type UploadMutationRegisterPartArgs = {
  input: RegisterPartInput;
};

export type UploadPaymentReceiptPhotoInput = {
  imageBase64: Scalars["String"]["input"];
  mimeType: Scalars["String"]["input"];
};

export type UploadQuery = {
  presignedUrl: PresignedUrlResponse;
  uploadStatus: UploadStatusResponse;
};

export type UploadQueryPresignedUrlArgs = {
  partNumber: Scalars["Int"]["input"];
  uploadId: Scalars["String"]["input"];
};

export type UploadQueryUploadStatusArgs = {
  uploadId: Scalars["String"]["input"];
};

export type UploadStatusResponse = {
  chunkSize: Scalars["Int"]["output"];
  fileKey: Scalars["String"]["output"];
  fileSize: Scalars["BigInt"]["output"];
  status: Scalars["String"]["output"];
  totalParts: Scalars["Int"]["output"];
  uploadId: Scalars["String"]["output"];
  uploadedBytes: Scalars["BigInt"]["output"];
  uploadedParts: Array<Scalars["Int"]["output"]>;
};

export type UsageMutation = {
  resetUsage: ResetUsageResponse;
  trackUsage: TrackUsageResponse;
};

export type UsageMutationResetUsageArgs = {
  input: ResetUsageInput;
};

export type UsageMutationTrackUsageArgs = {
  input: TrackUsageInput;
};

export type UsageQuery = {
  usage: UsageResponse;
};

export type UsageQueryUsageArgs = {
  feature?: InputMaybe<Scalars["String"]["input"]>;
};

export type UsageResponse = {
  features: Array<FeatureUsageInfo>;
};

export type User = {
  bucket?: Maybe<Scalars["String"]["output"]>;
  createdAt: Scalars["DateTime"]["output"];
  email: Scalars["String"]["output"];
  isActive: Scalars["Boolean"]["output"];
  lastSignInAt?: Maybe<Scalars["DateTime"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  profile?: Maybe<UserProfile>;
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
  uuid: Scalars["ID"]["output"];
};

export type UserActivity = {
  activeUsers: Scalars["Int"]["output"];
  requestsPerUserAvg: Scalars["Float"]["output"];
  topUsers: Array<TopUser>;
};

export type UserConnection = {
  items: Array<User>;
  pageInfo: PageInfo;
};

export type UserFilterInput = {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

export type UserHistoryConnection = {
  items: Array<UserHistoryItem>;
  pageInfo: PageInfo;
};

export type UserHistoryFilterInput = {
  eventType?: InputMaybe<Scalars["String"]["input"]>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  userId?: InputMaybe<Scalars["ID"]["input"]>;
};

export type UserHistoryItem = {
  city?: Maybe<Scalars["String"]["output"]>;
  continent?: Maybe<Scalars["String"]["output"]>;
  continentCode?: Maybe<Scalars["String"]["output"]>;
  country?: Maybe<Scalars["String"]["output"]>;
  countryCode?: Maybe<Scalars["String"]["output"]>;
  createdAt: Scalars["DateTime"]["output"];
  currency?: Maybe<Scalars["String"]["output"]>;
  device?: Maybe<Scalars["String"]["output"]>;
  district?: Maybe<Scalars["String"]["output"]>;
  eventType: Scalars["String"]["output"];
  hosting?: Maybe<Scalars["Boolean"]["output"]>;
  id: Scalars["ID"]["output"];
  ip?: Maybe<Scalars["String"]["output"]>;
  isp?: Maybe<Scalars["String"]["output"]>;
  lat?: Maybe<Scalars["Float"]["output"]>;
  lon?: Maybe<Scalars["Float"]["output"]>;
  org?: Maybe<Scalars["String"]["output"]>;
  proxy?: Maybe<Scalars["Boolean"]["output"]>;
  region?: Maybe<Scalars["String"]["output"]>;
  regionName?: Maybe<Scalars["String"]["output"]>;
  timezone?: Maybe<Scalars["String"]["output"]>;
  userEmail?: Maybe<Scalars["String"]["output"]>;
  userId: Scalars["ID"]["output"];
  userName?: Maybe<Scalars["String"]["output"]>;
  zip?: Maybe<Scalars["String"]["output"]>;
};

export type UserInfo = {
  email: Scalars["String"]["output"];
  name?: Maybe<Scalars["String"]["output"]>;
  role?: Maybe<Scalars["String"]["output"]>;
  userType?: Maybe<Scalars["String"]["output"]>;
  uuid: Scalars["ID"]["output"];
};

export type UserMutation = {
  promoteToAdmin: User;
  promoteToSuperAdmin: User;
  updateProfile: UserProfile;
  updateUser: User;
  uploadAvatar: UserProfile;
};

export type UserMutationPromoteToAdminArgs = {
  input: PromoteToAdminInput;
};

export type UserMutationPromoteToSuperAdminArgs = {
  input: PromoteToSuperAdminInput;
};

export type UserMutationUpdateProfileArgs = {
  input: UpdateProfileInput;
};

export type UserMutationUpdateUserArgs = {
  input: UpdateUserInput;
};

export type UserMutationUploadAvatarArgs = {
  input: UploadAvatarInput;
};

export type UserProfile = {
  avatarUrl?: Maybe<Scalars["String"]["output"]>;
  bio?: Maybe<Scalars["String"]["output"]>;
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  credits: Scalars["Int"]["output"];
  jobTitle?: Maybe<Scalars["String"]["output"]>;
  role?: Maybe<Scalars["String"]["output"]>;
  subscriptionEndsAt?: Maybe<Scalars["DateTime"]["output"]>;
  subscriptionPeriod?: Maybe<Scalars["String"]["output"]>;
  subscriptionPlan?: Maybe<Scalars["String"]["output"]>;
  subscriptionStartedAt?: Maybe<Scalars["DateTime"]["output"]>;
  subscriptionStatus?: Maybe<Scalars["String"]["output"]>;
  timezone?: Maybe<Scalars["String"]["output"]>;
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
  userId: Scalars["ID"]["output"];
};

export type UserQuery = {
  user: User;
  userStats: UserStats;
  users: Array<User>;
};

export type UserQueryUserArgs = {
  uuid: Scalars["ID"]["input"];
};

export type UserQueryUsersArgs = {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

export type UserRoleCount = {
  count: Scalars["Int"]["output"];
  role: Scalars["String"]["output"];
};

export type UserScrapingConnection = {
  items: Array<UserScrapingRecord>;
  pageInfo: PageInfo;
};

export type UserScrapingRecord = {
  applicationInfo?: Maybe<Scalars["JSON"]["output"]>;
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["ID"]["output"];
  pagination?: Maybe<Scalars["JSON"]["output"]>;
  searchContext?: Maybe<Scalars["JSON"]["output"]>;
  source: Scalars["String"]["output"];
  timestamp: Scalars["DateTime"]["output"];
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
  userId: Scalars["ID"]["output"];
  userInfo?: Maybe<Scalars["JSON"]["output"]>;
  version: Scalars["String"]["output"];
};

export type UserStats = {
  activeUsers: Scalars["Int"]["output"];
  inactiveUsers: Scalars["Int"]["output"];
  totalUsers: Scalars["Int"]["output"];
  usersByRole: Array<UserRoleCount>;
  usersBySubscription: Array<UserSubscriptionCount>;
};

export type UserSubscriptionCount = {
  count: Scalars["Int"]["output"];
  subscriptionPlan: Scalars["String"]["output"];
};

export type VqlConditionInput = {
  field: Scalars["String"]["input"];
  fuzzy?: InputMaybe<Scalars["Boolean"]["input"]>;
  matchOperator?: InputMaybe<Scalars["String"]["input"]>;
  operator: Scalars["String"]["input"];
  searchType?: InputMaybe<Scalars["String"]["input"]>;
  slop?: InputMaybe<Scalars["Int"]["input"]>;
  value: Scalars["JSON"]["input"];
};

export type VqlFilterInput = {
  allOf?: InputMaybe<Array<VqlFilterInput>>;
  anyOf?: InputMaybe<Array<VqlFilterInput>>;
  conditions?: InputMaybe<Array<VqlConditionInput>>;
};

export type VqlHealth = {
  connectraBaseUrl: Scalars["String"]["output"];
  connectraDetails?: Maybe<ConnectraDetails>;
  connectraEnabled: Scalars["Boolean"]["output"];
  connectraError?: Maybe<Scalars["String"]["output"]>;
  connectraStatus: Scalars["String"]["output"];
  monitoringAvailable: Scalars["Boolean"]["output"];
};

export type VqlOrderByInput = {
  orderBy: Scalars["String"]["input"];
  orderDirection: Scalars["String"]["input"];
};

export type VqlQueryInput = {
  companyConfig?: InputMaybe<PopulateConfigInput>;
  filters?: InputMaybe<VqlFilterInput>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: Scalars["Int"]["input"];
  orderBy?: InputMaybe<Array<VqlOrderByInput>>;
  page?: InputMaybe<Scalars["Int"]["input"]>;
  searchAfter?: InputMaybe<Array<Scalars["String"]["input"]>>;
  selectColumns?: InputMaybe<Array<Scalars["String"]["input"]>>;
  sortBy?: InputMaybe<Scalars["String"]["input"]>;
  sortDirection?: InputMaybe<Scalars["String"]["input"]>;
};

export type VqlStats = {
  message: Scalars["String"]["output"];
  note: Scalars["String"]["output"];
};

export type VerifiedEmailResult = {
  certainty?: Maybe<Scalars["String"]["output"]>;
  email: Scalars["String"]["output"];
  emailState?: Maybe<Scalars["String"]["output"]>;
  emailSubState?: Maybe<Scalars["String"]["output"]>;
  status: Scalars["String"]["output"];
};

export type Verify2FaResponse = {
  backupCodes?: Maybe<Array<Scalars["String"]["output"]>>;
  verified: Scalars["Boolean"]["output"];
};

export type WebSearchInput = {
  companyDomain: Scalars["String"]["input"];
  fullName: Scalars["String"]["input"];
};
