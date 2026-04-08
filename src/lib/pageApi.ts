import { graphqlQuery, gql } from "./graphqlClient";
import { DynamicPage } from "@/types";

export const pageApi = {
  async getPage(slug: string): Promise<DynamicPage | null> {
    const query = gql`
      query GetDynamicPage($slug: String!) {
        dynamicPage(slug: $slug) {
          id
          slug
          title
          description
          featureKey
          isPublished
          content {
            id
            type
            data
          }
          meta
        }
      }
    `;
    try {
      const data = await graphqlQuery<{ dynamicPage: DynamicPage | null }>(
        query,
        { slug },
      );
      return data.dynamicPage;
    } catch {
      return null;
    }
  },

  async listPages(): Promise<
    Pick<DynamicPage, "id" | "slug" | "title" | "featureKey" | "isPublished">[]
  > {
    const query = gql`
      query ListDynamicPages {
        dynamicPages {
          id
          slug
          title
          featureKey
          isPublished
        }
      }
    `;
    try {
      const data = await graphqlQuery<{ dynamicPages: DynamicPage[] }>(query);
      return data.dynamicPages;
    } catch {
      return [];
    }
  },
};
