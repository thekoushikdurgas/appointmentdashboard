/// <reference types="vitest/globals" />
import {
  countryBucketToNumericIso,
  normalizeCountryKey,
  toNumericIso,
} from "./isoCountryCodes";

describe("isoCountryCodes", () => {
  it("maps alpha-2 and numeric codes", () => {
    expect(toNumericIso("US")).toBe("840");
    expect(toNumericIso("840")).toBe("840");
  });

  it("maps Connectra-style country slugs to numeric ISO", () => {
    expect(countryBucketToNumericIso("united states")).toBe("840");
    expect(countryBucketToNumericIso("united kingdom")).toBe("826");
    expect(countryBucketToNumericIso("united states", "United States")).toBe(
      "840",
    );
  });

  it("normalizes display names from Intl", () => {
    const key = normalizeCountryKey("United States");
    expect(countryBucketToNumericIso(key)).toBe("840");
  });
});
