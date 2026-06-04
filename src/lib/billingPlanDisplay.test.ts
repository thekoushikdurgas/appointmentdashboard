/// <reference types="vitest/globals" />
import {
  displayDailyCreditsFromPeriod,
  formatBillingWalletSummary,
} from "./billingPlanDisplay";

describe("billingPlanDisplay", () => {
  it("prefers dailyCreditsLimit over bundle credits", () => {
    const period = {
      period: "monthly",
      credits: 1500,
      dailyCreditsLimit: 50,
      ratePerCredit: 0.01,
      price: 99,
      savings: null,
    };
    expect(displayDailyCreditsFromPeriod(period)).toBe(50);
  });

  it("formats wallet summary with addon pool", () => {
    expect(formatBillingWalletSummary({ credits: 40, addonCredits: 500 })).toBe(
      "40 daily · +500 addon",
    );
  });
});
