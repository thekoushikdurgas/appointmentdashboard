import { graphqlQuery, graphqlMutation } from "@/lib/graphqlClient";

export interface SavedSearch {
  id: string;
  name: string;
  description: string | null;
  type: string;
  searchTerm: string | null;
  filters: Record<string, unknown> | null;
  sortField: string | null;
  sortDirection: string | null;
  pageSize: number | null;
  createdAt: string;
  updatedAt: string | null;
  lastUsedAt: string | null;
  useCount: number;
}

const LIST = `query SavedSearchesGateway($type: String, $limit: Int, $offset: Int) {
  savedSearches {
    listSavedSearches(type: $type, limit: $limit, offset: $offset) {
      searches {
        id
        name
        description
        type
        searchTerm
        filters
        sortField
        sortDirection
        pageSize
        createdAt
        updatedAt
        lastUsedAt
        useCount
      }
      total
    }
  }
}`;

const CREATE = `mutation CreateSavedSearchGateway($input: CreateSavedSearchInput!) {
  savedSearches {
    createSavedSearch(input: $input) {
      id
      name
      type
    }
  }
}`;

const DELETE = `mutation DeleteSavedSearchGateway($id: ID!) {
  savedSearches {
    deleteSavedSearch(id: $id)
  }
}`;

const GET_ONE = `query GetSavedSearch($id: ID!) {
  savedSearches {
    getSavedSearch(id: $id) {
      id
      name
      description
      type
      searchTerm
      filters
      sortField
      sortDirection
      pageSize
      createdAt
      updatedAt
      lastUsedAt
      useCount
    }
  }
}`;

const UPDATE = `mutation UpdateSavedSearch($id: ID!, $input: UpdateSavedSearchInput!) {
  savedSearches {
    updateSavedSearch(id: $id, input: $input) {
      id
      name
      description
      type
      searchTerm
      filters
      sortField
      sortDirection
      pageSize
      updatedAt
      useCount
    }
  }
}`;

const UPDATE_USAGE = `mutation UpdateSavedSearchUsage($id: ID!) {
  savedSearches {
    updateSavedSearchUsage(id: $id)
  }
}`;

export const savedSearchesService = {
  list: (params?: { type?: string; limit?: number; offset?: number }) =>
    graphqlQuery<{
      savedSearches: {
        listSavedSearches: { searches: SavedSearch[]; total: number };
      };
    }>(LIST, {
      type: params?.type ?? null,
      limit: params?.limit ?? 100,
      offset: params?.offset ?? 0,
    }),

  get: (id: string) =>
    graphqlQuery<{ savedSearches: { getSavedSearch: SavedSearch } }>(GET_ONE, {
      id,
    }),

  create: (input: {
    name: string;
    type: string;
    description?: string | null;
    searchTerm?: string | null;
    filters?: Record<string, unknown> | null;
    sortField?: string | null;
    sortDirection?: string | null;
    pageSize?: number | null;
  }) =>
    graphqlMutation<{
      savedSearches: { createSavedSearch: SavedSearch };
    }>(CREATE, { input }),

  update: (
    id: string,
    input: {
      name?: string | null;
      description?: string | null;
      searchTerm?: string | null;
      filters?: Record<string, unknown> | null;
      sortField?: string | null;
      sortDirection?: string | null;
      pageSize?: number | null;
    },
  ) =>
    graphqlMutation<{
      savedSearches: { updateSavedSearch: SavedSearch };
    }>(UPDATE, { id, input }),

  updateUsage: (id: string) =>
    graphqlMutation<{
      savedSearches: { updateSavedSearchUsage: boolean };
    }>(UPDATE_USAGE, { id }),

  delete: (id: string) =>
    graphqlMutation<{ savedSearches: { deleteSavedSearch: boolean } }>(DELETE, {
      id,
    }),
};
