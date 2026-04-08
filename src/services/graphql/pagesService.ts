import { graphqlQuery } from "@/lib/graphqlClient";

// API accepts lowercase values; do NOT use UPPERCASE enum strings.
export type PageType = "docs" | "marketing" | "dashboard";
export type PageStatus = "draft" | "published" | "deleted";

export interface PageSummary {
  pageId: string;
  title: string;
  pageType: PageType;
  route: string | null;
  status: PageStatus;
}

export interface PageDetail extends PageSummary {
  createdAt: string;
  updatedAt: string | null;
}

export interface PageContent {
  pageId: string;
  content: string;
}

export interface PageTypeCount {
  type: string;
  count: number;
}

export interface PageTypeSummary {
  types: PageTypeCount[];
  total: number;
}

export interface PageStatistics {
  pageType: string;
  total: number;
  published: number;
  draft: number;
  deleted: number;
}

const PAGE_SUMMARY_FIELDS = `
  pageId
  title
  pageType
  route
  status
`;

const PAGE_DETAIL_FIELDS = `
  pageId
  title
  pageType
  route
  status
  createdAt
  updatedAt
`;

const GET_PAGE = `query GetPage($pageId: String!) {
  pages {
    page(pageId: $pageId) { ${PAGE_DETAIL_FIELDS} }
  }
}`;

const GET_PAGES = `query GetPages($pageType: String, $status: String, $limit: Int, $offset: Int) {
  pages {
    pages(pageType: $pageType, status: $status, limit: $limit, offset: $offset) {
      pages { ${PAGE_DETAIL_FIELDS} }
      total
    }
  }
}`;

const GET_MY_PAGES = `query GetMyPages($pageType: String) {
  pages {
    myPages(pageType: $pageType) {
      pages { ${PAGE_SUMMARY_FIELDS} }
      total
    }
  }
}`;

const GET_DASHBOARD_PAGES = `query GetDashboardPages {
  pages {
    dashboardPages {
      pages { ${PAGE_DETAIL_FIELDS} }
      total
    }
  }
}`;

const GET_PAGE_CONTENT = `query GetPageContent($pageId: String!) {
  pages {
    pageContent(pageId: $pageId) {
      pageId
      content
    }
  }
}`;

const GET_PAGES_BY_TYPE = `query GetPagesByType($pageType: String!, $page: Int, $pageSize: Int) {
  pages {
    pagesByType(pageType: $pageType, page: $page, pageSize: $pageSize) {
      pages { ${PAGE_SUMMARY_FIELDS} }
      total
    }
  }
}`;

const GET_PAGE_TYPES = `query GetPageTypes {
  pages {
    pageTypes {
      types { type count }
      total
    }
  }
}`;

const GET_PAGE_STATISTICS = `query GetPageStatistics($pageType: String) {
  pages {
    pageStatistics(pageType: $pageType) {
      pageType
      total
      published
      draft
      deleted
    }
  }
}`;

const GET_MARKETING_PAGES = `query GetMarketingPages($page: Int, $pageSize: Int, $status: String, $search: String) {
  pages {
    marketingPages(page: $page, pageSize: $pageSize, status: $status, search: $search) {
      pages { ${PAGE_DETAIL_FIELDS} }
      total
    }
  }
}`;

export const pagesService = {
  getPage: (pageId: string) =>
    graphqlQuery<{ pages: { page: PageDetail } }>(GET_PAGE, { pageId }),

  getPages: (opts?: {
    pageType?: PageType | null;
    status?: PageStatus | null;
    limit?: number;
    offset?: number;
  }) =>
    graphqlQuery<{ pages: { pages: { pages: PageDetail[]; total: number } } }>(
      GET_PAGES,
      {
        pageType: opts?.pageType ?? null,
        status: opts?.status ?? null,
        limit: opts?.limit ?? 50,
        offset: opts?.offset ?? 0,
      },
    ),

  getMyPages: (pageType?: PageType | null) =>
    graphqlQuery<{
      pages: { myPages: { pages: PageSummary[]; total: number } };
    }>(GET_MY_PAGES, { pageType: pageType ?? null }),

  getDashboardPages: () =>
    graphqlQuery<{
      pages: { dashboardPages: { pages: PageDetail[]; total: number } };
    }>(GET_DASHBOARD_PAGES),

  getPageContent: (pageId: string) =>
    graphqlQuery<{ pages: { pageContent: PageContent } }>(GET_PAGE_CONTENT, {
      pageId,
    }),

  listPagesByType: (
    pageType: PageType,
    opts?: { page?: number; pageSize?: number },
  ) =>
    graphqlQuery<{
      pages: { pagesByType: { pages: PageSummary[]; total: number } };
    }>(GET_PAGES_BY_TYPE, {
      pageType,
      page: opts?.page ?? 1,
      pageSize: opts?.pageSize ?? 20,
    }),

  getPageTypes: () =>
    graphqlQuery<{ pages: { pageTypes: PageTypeSummary } }>(GET_PAGE_TYPES),

  getPageStatistics: (pageType?: PageType | null) =>
    graphqlQuery<{ pages: { pageStatistics: PageStatistics } }>(
      GET_PAGE_STATISTICS,
      { pageType: pageType ?? null },
    ),

  getMarketingPages: (opts?: {
    page?: number;
    pageSize?: number;
    status?: PageStatus | null;
    search?: string | null;
  }) =>
    graphqlQuery<{
      pages: { marketingPages: { pages: PageDetail[]; total: number } };
    }>(GET_MARKETING_PAGES, {
      page: opts?.page ?? 1,
      pageSize: opts?.pageSize ?? 20,
      status: opts?.status ?? null,
      search: opts?.search ?? null,
    }),
};
