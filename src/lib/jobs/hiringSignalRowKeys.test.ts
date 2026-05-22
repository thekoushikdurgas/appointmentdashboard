/// <reference types="vitest/globals" />
import {
  hiringSignalRowKey,
  isPlaceholderDocumentId,
  type HiringSignalRowKeyFields,
} from "./hiringSignalRowKeys";

function stubRow(
  overrides: Partial<HiringSignalRowKeyFields>,
): HiringSignalRowKeyFields {
  return {
    id: "",
    linkedinJobId: "",
    runId: "",
    apifyItemId: "",
    title: "",
    companyName: "",
    companyUuid: "",
    location: "",
    postedAt: "",
    jobUrl: "",
    ...overrides,
  };
}

describe("isPlaceholderDocumentId", () => {
  it("treats zero ObjectId and empty as placeholder", () => {
    expect(isPlaceholderDocumentId("")).toBe(true);
    expect(isPlaceholderDocumentId("000000000000000000000000")).toBe(true);
    expect(isPlaceholderDocumentId("507f1f77bcf86cd799439011")).toBe(false);
  });
});

describe("hiringSignalRowKey", () => {
  it("does not use zero Mongo id when linkedinJobId is present", () => {
    const row = stubRow({
      id: "000000000000000000000000",
      linkedinJobId: "12345",
      apifyItemId: "item-1",
    });
    expect(hiringSignalRowKey(row)).toBe("12345::item-1");
  });

  it("produces distinct keys for two placeholder-id rows with different linkedin ids", () => {
    const a = stubRow({
      id: "000000000000000000000000",
      linkedinJobId: "111",
    });
    const b = stubRow({
      id: "000000000000000000000000",
      linkedinJobId: "222",
    });
    expect(hiringSignalRowKey(a)).not.toBe(hiringSignalRowKey(b));
    expect(hiringSignalRowKey(a)).not.toBe("000000000000000000000000");
  });
});
