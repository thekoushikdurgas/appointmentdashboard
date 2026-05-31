"use client";

import type { SavedSearchContactCountEntry } from "@/hooks/useSavedSearchContactCounts";
import { SavedSearchCohortCount } from "@/components/feature/saved-searches/SavedSearchCohortCount";

/** @deprecated Use {@link SavedSearchCohortCount} with `kind="contact"`. */
export function SavedSearchContactCount({
  entry,
}: {
  entry?: SavedSearchContactCountEntry;
}) {
  return <SavedSearchCohortCount entry={entry} kind="contact" />;
}
