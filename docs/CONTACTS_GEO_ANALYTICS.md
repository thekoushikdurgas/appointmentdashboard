# Contacts geo analytics (VQL-scoped map)

The contacts **World Map** uses `contactsService.geoAnalytics()` → GraphQL `contactGeoAnalytics` → Connectra `POST /contacts/analytics/geo` on the sync server. The request body is the same VQL as the list (export VQL from `useContacts`); pagination and company population are stripped server-side for aggregation.

- **App:** `useCountryAggregates(exportVql)` in [`src/hooks/useCountryAggregates.ts`](../src/hooks/useCountryAggregates.ts)
- **API:** `ContactQuery.contact_geo_analytics` in [`../api/app/graphql/modules/contacts/queries.py`](../../api/app/graphql/modules/contacts/queries.py)
- **Connectra:** `POST /contacts/analytics/geo` — OpenSearch `terms` on `country.keyword` (optional nested `city.keyword` when `include_cities` is true)

**Schema note:** The OpenSearch index should expose a keyword subfield for `country` (e.g. `country.keyword`); the sync server query targets that for stable buckets.

**Codegen:** After API schema changes, run `npm run codegen` in `contact360.io/app` so `contactGeoAnalytics` appears in generated types (optional; the app uses explicit operation strings and service types today).
