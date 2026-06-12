/// <reference types="vitest/globals" />
import { nextFilterOpenSectionId } from "@/components/layouts/filters/FilterAccordionContext";

describe("nextFilterOpenSectionId", () => {
  it("opens the requested section when expanding", () => {
    expect(nextFilterOpenSectionId("company-name", "job-title", true)).toBe(
      "job-title",
    );
  });

  it("collapses the current section when closing", () => {
    expect(nextFilterOpenSectionId("job-title", "job-title", false)).toBeNull();
  });

  it("leaves open id unchanged when closing a different section", () => {
    expect(nextFilterOpenSectionId("job-title", "date-posted", false)).toBe(
      "job-title",
    );
  });
});
