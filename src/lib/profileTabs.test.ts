/// <reference types="vitest/globals" />
import { isProfileTab, profileTabRoute } from "./profileTabs";

describe("profileTabRoute", () => {
  it("returns bare profile path for general", () => {
    expect(profileTabRoute("general")).toBe("/profile");
  });

  it("returns tab query for settings", () => {
    expect(profileTabRoute("settings")).toBe("/profile?tab=settings");
  });
});

describe("isProfileTab", () => {
  it("accepts known tabs", () => {
    expect(isProfileTab("settings")).toBe(true);
    expect(isProfileTab("security")).toBe(true);
  });

  it("rejects unknown values", () => {
    expect(isProfileTab("billing")).toBe(false);
    expect(isProfileTab(null)).toBe(false);
  });
});
