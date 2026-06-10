/// <reference types="vitest/globals" />
import {
  formatDisplayLabel,
  formatEmploymentTypeLabel,
  formatRoleLabel,
  formatStatusLabel,
  formatTokenLabel,
  isProtectedDisplayText,
} from "./displayText";

describe("isProtectedDisplayText", () => {
  it("detects emails, URLs, UUIDs, domains, and path prefixes", () => {
    expect(isProtectedDisplayText("jane@acme.com")).toBe(true);
    expect(isProtectedDisplayText("https://example.com")).toBe(true);
    expect(isProtectedDisplayText("00000000-0000-0000-0000-000000000001")).toBe(
      true,
    );
    expect(isProtectedDisplayText("acme.com")).toBe(true);
    expect(isProtectedDisplayText("upload/foo.csv")).toBe(true);
    expect(isProtectedDisplayText("exports/bar.xlsx")).toBe(true);
  });

  it("allows normal labels", () => {
    expect(isProtectedDisplayText("software engineer")).toBe(false);
    expect(isProtectedDisplayText("United States")).toBe(false);
  });
});

describe("formatDisplayLabel", () => {
  it("title-cases words", () => {
    expect(formatDisplayLabel("software engineer")).toBe("Software Engineer");
    expect(formatDisplayLabel("united states")).toBe("United States");
  });

  it("preserves ISO codes", () => {
    expect(formatDisplayLabel("US")).toBe("US");
    expect(formatDisplayLabel("GB")).toBe("GB");
  });

  it("preserves intentional mixed case", () => {
    expect(formatDisplayLabel("McDonald")).toBe("McDonald");
    expect(formatDisplayLabel("iPhone")).toBe("iPhone");
  });

  it("passes through protected strings", () => {
    expect(formatDisplayLabel("jane@acme.com")).toBe("jane@acme.com");
    expect(formatDisplayLabel("acme.com")).toBe("acme.com");
  });

  it("maps employment enums", () => {
    expect(formatEmploymentTypeLabel("FULL_TIME")).toBe("Full-time");
    expect(formatEmploymentTypeLabel("part-time")).toBe("Part-time");
  });

  it("handles empty input", () => {
    expect(formatDisplayLabel("")).toBe("—");
    expect(formatDisplayLabel(null)).toBe("—");
  });
});

describe("formatTokenLabel", () => {
  it("maps known service and action tokens", () => {
    expect(formatTokenLabel("ai_chats")).toBe("AI chats");
    expect(formatTokenLabel("hire_signal")).toBe("Hiring signals");
    expect(formatTokenLabel("sales_navigator")).toBe("Sales Navigator");
    expect(formatTokenLabel("reset_password")).toBe("Reset password");
    expect(formatTokenLabel("enable_2fa")).toBe("Enable 2FA");
    expect(formatTokenLabel("jobs")).toBe("Export");
    expect(formatTokenLabel("files")).toBe("Storage");
  });

  it("falls back for unknown tokens", () => {
    expect(formatTokenLabel("custom_action")).toBe("Custom Action");
  });
});

describe("formatStatusLabel", () => {
  it("sentence-cases statuses", () => {
    expect(formatStatusLabel("failed")).toBe("Failed");
    expect(formatStatusLabel("RUNNING")).toBe("Running");
  });
});

describe("formatRoleLabel", () => {
  it("formats underscore roles", () => {
    expect(formatRoleLabel("super_admin")).toBe("Super Admin");
    expect(formatRoleLabel("")).toBe("Member");
  });
});
