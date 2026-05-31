/** VQL filter row; explicit `field` key avoids shorthand collision when field is `"id"`. */
export function contactUuidFilterCondition(
  filterField: "uuid" | "id" | "email",
  value: string,
) {
  return { field: filterField, operator: "eq" as const, value };
}
