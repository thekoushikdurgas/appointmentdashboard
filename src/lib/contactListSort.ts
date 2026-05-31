import type { VqlOrderByInput } from "@/graphql/generated/types";

/** Sort keys for contact lists (main contacts page + company detail contacts tab). */
export type ContactListSortBy = "newest" | "oldest" | "name_asc" | "name_desc";

const CONTACT_LIST_SORT_KEYS = new Set<string>([
  "newest",
  "oldest",
  "name_asc",
  "name_desc",
]);

export function isContactListSortBy(value: string): value is ContactListSortBy {
  return CONTACT_LIST_SORT_KEYS.has(value);
}

export function contactListOrderByFromSortBy(
  sortBy: string,
): VqlOrderByInput[] {
  switch (sortBy) {
    case "oldest":
      return [{ orderBy: "createdAt", orderDirection: "asc" }];
    case "name_asc":
      return [{ orderBy: "firstName", orderDirection: "asc" }];
    case "name_desc":
      return [{ orderBy: "firstName", orderDirection: "desc" }];
    case "newest":
    default:
      return [{ orderBy: "createdAt", orderDirection: "desc" }];
  }
}
