import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { AUTH_PAYLOAD_USER_FIELDS } from "./authSelections";
import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("GraphQL operation contracts (static)", () => {
  it("AuthContext uses auth.me, not legacy user.me", () => {
    const s = read("context/AuthContext.tsx");
    expect(s).toContain("AUTH_ME_QUERY");
    expect(s).toContain("auth?.me");
    expect(s).not.toMatch(/user\s*\{\s*me\b/);
  });

  it("AuthPayload user selection is UserInfo only (no profile fields)", () => {
    const block = AUTH_PAYLOAD_USER_FIELDS.replace(/\s+/g, " ").trim();
    expect(block).toContain("uuid");
    expect(block).toContain("userType");
    for (const bad of [
      "isVerified",
      "subscriptionPlan",
      "creditsRemaining",
      "credits",
      "profile",
    ]) {
      expect(block.toLowerCase()).not.toContain(bad.toLowerCase());
    }
  });

  it("billing service matches gateway billing namespace", () => {
    const s = read("services/graphql/billingService.ts");
    expect(s).toContain("subscribe(input: $input)");
    expect(s).toContain("subscriptionPlan");
    expect(s).toContain("purchaseAddon(input: $input)");
    expect(s).toContain("package");
    expect(s).toContain("creditsAdded");
    expect(s).toContain("cancelSubscription");
    expect(s).toContain("subscriptionStatus");
    expect(s).toContain("upiId");
    expect(s).toContain("paymentSubmissions(status:");
    expect(s).toContain("myPaymentSubmissions(status:");
    expect(s).toContain("approvePayment(submissionId:");
    expect(s).toContain("declinePayment(input:");
    expect(s).toContain("UpdatePaymentInstructionsInput");
    expect(s).toContain("updateAddon(packageId:");
    expect(s).not.toContain("addonId");
  });

  it("email service targets finder, verifier, bulk, pattern predict, and riskyCount", () => {
    const s = read("services/graphql/emailService.ts");
    expect(s).toContain("findEmails(input: $input)");
    expect(s).toContain("verifySingleEmail(input: $input)");
    expect(s).toContain("findEmailsBulk(input: $input)");
    expect(s).toContain("verifyEmailsBulk(input: $input)");
    expect(s).toContain("riskyCount");
    expect(s).toContain("predictEmailPattern(input: $input)");
    expect(s).toContain("predictEmailPatternBulk(input: $input)");
    expect(s).toContain("emailJobStatus(jobId: $jobId)");
  });

  it("s3 operations use s3Files and s3FileDownloadUrl", () => {
    const s = read("graphql/s3Operations.ts");
    expect(s).toContain("s3Files(");
    expect(s).toContain("s3FileDownloadUrl");
  });

  it("health operations include performanceStats and tokenBlacklistCleanup", () => {
    const s = read("graphql/healthOperations.ts");
    expect(s).toContain("apiMetadata");
    expect(s).toContain("vqlHealth");
    expect(s).toContain("performanceStats");
    expect(s).toContain("tokenBlacklistCleanup");
  });

  it("health service wires public, VQL, and performance stats from healthOperations", () => {
    const s = read("services/graphql/healthService.ts");
    expect(s).toContain("HEALTH_GATEWAY_PUBLIC");
    expect(s).toContain("HEALTH_VQL");
    expect(s).toContain("HEALTH_PERFORMANCE_STATS");
    expect(s).toContain("getPublicHealth");
    expect(s).toContain("getVqlHealth");
    expect(s).toContain("getPerformanceStats");
  });

  it("usage operations include usage query, featureOverview, track and reset", () => {
    const s = read("graphql/usageOperations.ts");
    expect(s).toContain("usage(feature:");
    expect(s).toContain("featureOverview(feature:");
    expect(s).toContain("trackUsage");
    expect(s).toContain("resetUsage");
  });

  it("upload operations match UploadQuery and UploadMutation", () => {
    const s = read("graphql/uploadOperations.ts");
    expect(s).toContain("initiateUpload(input:");
    expect(s).toContain("presignedUrl(uploadId:");
    expect(s).toContain("registerPart(input:");
    expect(s).toContain("completeUpload(input:");
    expect(s).toContain("abortUpload(input:");
    expect(s).toContain("uploadStatus(uploadId:");
  });

  it("activities operations use activities(filters:) and activityStats(filters:)", () => {
    const s = read("graphql/activitiesOperations.ts");
    expect(s).toContain("activities(filters: $filters)");
    expect(s).toContain("activityStats(filters: $filters)");
  });

  it("ai chats service nests under aiChats namespace", () => {
    const s = read("services/graphql/aiChatService.ts");
    expect(s).toContain("aiChats {\n          aiChats(");
    expect(s).toContain("sendMessage(chatId:");
  });

  it("jobs service lists SchedulerJob payloads and typed Contact360 inputs", () => {
    const s = read("services/graphql/jobsService.ts");
    expect(s).toContain("statusPayload");
    expect(s).toContain("relatedFileKey");
    expect(s).toContain("CreateContact360ExportInput");
    expect(s).toContain("CreateContact360ImportInput");
    expect(s).toContain("createContact360Export(input: $input)");
    expect(s).toContain("createEmailPatternExport(input: $input)");
  });

  it("twoFactor service matches TwoFactorStatus and regenerateBackupCodes shape", () => {
    const s = read("services/graphql/twoFactorService.ts");
    expect(s).toContain("get2FAStatus");
    expect(s).toContain("regenerateBackupCodes");
    expect(s).toContain("backupCodes");
    expect(s).not.toContain("success");
  });

  it("profile service uses id for team mutations and boolean revokeAllOtherSessions", () => {
    const s = read("services/graphql/profileService.ts");
    expect(s).toContain("updateTeamMemberRole(id: $id");
    expect(s).toContain("removeTeamMember(id: $id)");
    expect(s).toContain("revokeAllOtherSessions: boolean");
    expect(s).toContain("CreateApiKeyInput");
  });

  it("aiChat service uses input-wrapped utility mutations", () => {
    const s = read("services/graphql/aiChatService.ts");
    expect(s).toContain("analyzeEmailRisk(input: $input)");
    expect(s).toContain("generateCompanySummary(input: $input)");
    expect(s).toContain("parseContactFilters(input: $input)");
    expect(s).not.toMatch(/analyzeEmailRisk\(email:/);
    expect(s).not.toMatch(/generateCompanySummary\(companyUuid:/);
  });

  it("analytics service uses GetMetricsInput, AggregateMetricsInput, and submitPerformanceMetric", () => {
    const s = read("services/graphql/analyticsService.ts");
    expect(s).toContain("GetMetricsInput");
    expect(s).toContain("AggregateMetricsInput");
    expect(s).toContain("SubmitPerformanceMetricInput");
    expect(s).toContain("performanceMetrics(input: $input)");
    expect(s).toContain("aggregateMetrics(input: $input)");
    expect(s).toContain("submitPerformanceMetric(input: $input)");
  });

  it("linkedin service uses LinkedInSearchInput and nested upsert response fields", () => {
    const s = read("services/graphql/linkedinService.ts");
    expect(s).toContain("LinkedInSearchInput");
    expect(s).toContain("LinkedInUpsertInput");
    expect(s).toContain("search(input: $input)");
    expect(s).toContain("upsertByLinkedInUrl(input: $input)");
    expect(s).toContain("LinkedInSearchResponse");
    expect(s).toContain("LinkedInUpsertResponse");
  });

  it("campaign satellite service queries campaignSatellite JSON fields", () => {
    const s = read("services/graphql/campaignSatelliteService.ts");
    expect(s).toContain("campaignSatellite");
    expect(s).toContain("campaigns");
    expect(s).toContain("sequences");
    expect(s).toContain("campaignTemplates");
    expect(s).toContain("CampaignSatelliteBundle");
    expect(s).toContain("parseSequencesJson");
    expect(s).toContain("parseCampaignTemplatesJson");
  });

  it("resume service uses resume namespace CRUD fields", () => {
    const s = read("services/graphql/resumeService.ts");
    expect(s).toContain("resumes {");
    expect(s).toContain("resume(id: $id)");
    expect(s).toContain("saveResume(input: $input)");
    expect(s).toContain("deleteResume(id: $id)");
    expect(s).toContain("resumeData");
    expect(s).toContain("SaveResumeInput");
  });

  it("sales navigator service uses salesNavigatorRecords JSON fields and saveSalesNavigatorProfiles response", () => {
    const s = read("services/graphql/salesNavigatorService.ts");
    expect(s).toContain("salesNavigatorRecords(filters: $filters)");
    expect(s).toContain("searchContext");
    expect(s).toContain("pagination");
    expect(s).toContain("userInfo");
    expect(s).toContain("applicationInfo");
    expect(s).toContain("saveSalesNavigatorProfiles(input: $input)");
    expect(s).toContain("totalProfiles");
    expect(s).toContain("savedCount");
    expect(s).toContain("errors");
    expect(s).not.toMatch(/saveProfiles\s*\(/);
    expect(s).not.toContain("summary {");
    expect(s).toContain("toSatelliteProfileJson");
  });
});
