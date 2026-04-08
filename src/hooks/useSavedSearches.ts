"use client";

import { useState, useEffect } from "react";
import {
  savedSearchesService,
  type SavedSearch,
} from "@/services/graphql/savedSearchesService";

export function useSavedSearches() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSearches = async () => {
    setLoading(true);
    try {
      const data = await savedSearchesService.list();
      setSearches(data.savedSearches.listSavedSearches.searches);
    } catch {
      setSearches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSearches();
  }, []);

  const save = async (
    name: string,
    type: string,
    filters: Record<string, unknown>,
  ) => {
    const data = await savedSearchesService.create({ name, type, filters });
    setSearches((prev) => [...prev, data.savedSearches.createSavedSearch]);
  };

  const remove = async (id: string) => {
    await savedSearchesService.delete(id);
    setSearches((prev) => prev.filter((s) => s.id !== id));
  };

  return { searches, loading, save, remove, refresh: fetchSearches };
}
