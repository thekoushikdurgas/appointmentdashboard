import type { VqlConditionInput } from "@/graphql/generated/types";

/** VQL filter row; explicit `field` key avoids shorthand collision when field is `"id"`. */
export function contactUuidFilterCondition(
  filterField: "uuid" | "id" | "email",
  value: string,
): VqlConditionInput {
  return {
    field: filterField,
    operator: "eq",
    value: value as unknown as VqlConditionInput["value"],
  };
}
