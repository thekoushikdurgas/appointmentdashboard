/// <reference types="vitest/globals" />
import { getPaginationBounds } from "./paginationBounds";

describe("getPaginationBounds", () => {
  it("clamps page into range and normalizes page size", () => {
    expect(getPaginationBounds(100, 1, 25)).toEqual({
      pageSize: 25,
      totalPages: 4,
      safePage: 1,
    });
    expect(getPaginationBounds(100, 99, 25)).toEqual({
      pageSize: 25,
      totalPages: 4,
      safePage: 4,
    });
    expect(getPaginationBounds(100, 0, 25)).toEqual({
      pageSize: 25,
      totalPages: 4,
      safePage: 1,
    });
  });

  it("uses at least one page when total is zero", () => {
    expect(getPaginationBounds(0, 5, 10)).toEqual({
      pageSize: 10,
      totalPages: 1,
      safePage: 1,
    });
  });

  it("floors fractional page size to minimum 1", () => {
    expect(getPaginationBounds(50, 1, 0)).toEqual({
      pageSize: 1,
      totalPages: 50,
      safePage: 1,
    });
  });
});
