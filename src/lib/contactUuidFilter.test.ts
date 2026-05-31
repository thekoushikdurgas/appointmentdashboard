import { describe, expect, it } from "vitest";
import { contactUuidFilterCondition } from "./contactUuidFilter";

describe("contactUuidFilterCondition", () => {
  it("includes field key when filter is id (no shorthand collision with contact uuid)", () => {
    const contactUuid = "7dc0153a-726c-5ee5-938b-d7a7316808fa";
    const cond = contactUuidFilterCondition("id", contactUuid);
    expect(cond).toEqual({
      field: "id",
      operator: "eq",
      value: contactUuid,
    });
    expect(Object.keys(cond).sort()).toEqual(["field", "operator", "value"]);
  });

  it("builds uuid filter", () => {
    const contactUuid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    expect(contactUuidFilterCondition("uuid", contactUuid)).toEqual({
      field: "uuid",
      operator: "eq",
      value: contactUuid,
    });
  });
});
