> **Source:** split from [`extended-module-notes.md`](../extended-module-notes.md) (index). Module order follows the original monolith.
> Here is a structured analysis of **Analytics** (`18_ANALYTICS_MODULE.md` ↔ `contact360.io/api` ↔ `contact360.io/app`), **Dashboard UI kit** mapping, and a **task breakdown**.

---

## Module tracking

**Checkboxes** in **Phase** subsections below: `[x]` done · `[ ]` not done. Tag open items when useful: _(planned)_ roadmap · _(gap)_ known mismatch vs gateway · _(pending)_ blocked or unscheduled.

Full legend: [`README.md`](README.md#task-tracking-graphql--ui).

| Track       | What to update                                                                       |
| ----------- | ------------------------------------------------------------------------------------ |
| **GraphQL** | Operations, variables, and `Gql*` / codegen alignment vs `contact360.io/api` schema. |
| **UI**      | Routes under `app/`, feature components, Dashboard UI kit patterns, copy/UX.         |

## Roll-up (this module)

|             | GraphQL         | UI              |
| ----------- | --------------- | --------------- |
| **Primary** | [x] _(partial)_ | [x] _(partial)_ |

> **2026-04-06:** Dashboard area chart uses real `analyticsService` series; removed `setInterval` / `Math.random` mock updates.

**Codegen:** `AnalyticsQuery`, `AnalyticsMutation` — root `query.analytics`, `mutation.analytics`.

## 1. Canonical contract (doc + API)

**Namespace:** `query.analytics { … }`, `mutation.analytics { … }`.

| Operation                 | Input                                                                                                               | Returns                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `performanceMetrics`      | `GetMetricsInput` (optional): `metricName`, `startDate`, `endDate`, `limit` (default 100, max 1000)                 | **`[PerformanceMetric!]!`** (plain list, not a connection)   |
| `aggregateMetrics`        | **`AggregateMetricsInput!`**: `metricName`, `startDate`, `endDate`                                                  | **`MetricAggregation`**: avg, min, max, p50, p75, p95, count |
| `submitPerformanceMetric` | **`SubmitPerformanceMetricInput!`**: `name`, `value`, **`timestamp` (Unix ms, BigInt)**, optional `metadata` (JSON) | **`PerformanceMetricResponse`**: success, message            |

**`PerformanceMetric`:** `id`, `userId`, `metricName`, `metricValue`, `timestamp`, `metadata`, `createdAt`.

**Semantics (doc + API):** This module is **application performance / RUM-style** data stored in **`performance_metrics`** (e.g. LCP, FID, CLS). It is **not** email-finder throughput, credits, or job progress (those live elsewhere — see doc “Cross-service note” and **Email/Jobs** modules).

The Python layer in `app/graphql/modules/analytics/` matches the doc: validation, user scoping, `submitPerformanceMetric` best-effort success on storage failure (non-blocking client).

---

## 2. `analyticsService.ts` vs API

**Aligned**

- **`PERFORMANCE_METRICS`** and **`AGGREGATE`** documents match the gateway field names and selection sets (`metricName`, `metricValue`, …).
- **`aggregateMetrics`** TypeScript arguments match **`AggregateMetricsInput`**.

**Gaps**

1. **`listPerformanceMetrics`** — The public TS type only allows `metricName` and `limit`. The API also supports **`startDate`** and **`endDate`**; the client should accept and pass them (ISO strings in variables).

2. **`submitPerformanceMetric`** — **Not implemented** in `analyticsService` (no `graphqlMutation`). Nothing in the app can **write** metrics via GraphQL despite the mutation being the natural ingestion path for Web Vitals.

3. **`getSummary`** — **Deprecated and misleading.** It fabricates an **`AnalyticsSummary`** (“emails found”, “top domains”, “credits”) from **`listPerformanceMetrics`** rows by treating **`metricName` as a “feature”** and **`metricValue` as something to sum**. That does **not** match the backend meaning of those fields. The **page still uses `getSummary`** as its main data source.

---

## 3. UI (`analytics/page.tsx`) vs module

The page is built as a **usage / email analytics** dashboard (StatCards for emails, donut by “feature”, domains table, line chart placeholders driven by **`getSummary`**).

The **GraphQL Analytics module** only provides **per-user performance metric** rows and **aggregations**. So:

- **Either** the page should be **reframed** as **“Performance / Web Vitals”** (LCP, CLS, etc.) using **`listPerformanceMetrics` + `aggregateMetrics`**,
- **Or** **real usage KPIs** should come from **Usage**, **Billing**, **Activities**, **Jobs**, etc., and this page should not pretend they come from `analytics.performanceMetrics`.

Today the UI **over-interprets** performance metric rows as product analytics — **conceptual mismatch**, not just a small field rename.

---

## 4. Codegen (`graphql/generated/types.ts`)

The **`GqlPerformanceMetric`** / **`GqlMetricAggregation`** / **`GqlTrackMetricInput`** block does **not** match the live schema (`metricName` vs `metric`, missing p50/p75/p95 on aggregation type, wrong response shape). **`analyticsService.ts` interfaces** are more accurate than **`Gql*`** for this module.

---

## 5. Hooks / contexts

- There is **no `useAnalytics`**; the page calls **`getSummary`** directly in `useEffect`.
- **No client** sends **`submitPerformanceMetric`** (e.g. from `web-vitals` or a small reporter).

---

## 6. Dashboard UI kit mapping

| Need          | Kit / app direction                                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Time range    | **Select** / date pickers for **`startDate` / `endDate`** on queries                                                    |
| Metric picker | **Radio** or **select** for `metricName` (LCP, CLS, INP, custom)                                                        |
| Summary KPIs  | **Stat cards** for **`aggregateMetrics`**: avg, p50, p95, count                                                         |
| Trend         | **Line chart** from **`performanceMetrics`** time series (timestamp vs value)                                           |
| Distribution  | Histogram or **bar chart** (kit `chart-chartjs` / Morris-style patterns); you already use **Recharts**-based components |
| Ingestion     | **Non-blocking** submit on route change or idle; **progress** only if batching                                          |
| Tables        | **Datatable** for raw rows with **metadata** JSON expandable                                                            |

---

## 7. Smaller tasks (implementation order)

**Phase A — Product clarity**

1. **Decide** whether **`/analytics`** is **(A) Web Vitals / RUM** only, **(B) product usage** only, or **(C) two tabs** (Performance | Usage) with **Usage** fed by **other modules**, not `performanceMetrics`.

**Phase B — Client parity with `18_ANALYTICS_MODULE.md`**

2. Extend **`listPerformanceMetrics`** inputs with **`startDate` / `endDate`** (and pass through to GraphQL).
3. Add **`submitPerformanceMetric`** mutation helper (`name`, `value`, **`Date.now()` ms**, `metadata`).
4. Add **`useAnalytics`** (or split **`usePerformanceMetrics`** + **`useMetricAggregation`**) with loading/error/refresh.
5. Regenerate or hand-fix **`Gql*`** analytics types to match the schema.

**Phase C — Ingestion**

6. Add a small **`reportWebVitals`** (or similar) utility that maps **`web-vitals`** metrics to **`submitPerformanceMetric`** (auth-aware, fire-and-forget).
7. Call it from **`app` root layout** or **`_app`** equivalent once per session / on CLS/LCP report.

**Phase D — UI (if tab “Performance”)**

8. Replace or supplement **`getSummary`** UI with **`aggregateMetrics`** for selected **metric + range**.
9. Plot **`listPerformanceMetrics`** as a **time series**; show **metadata** (URL, UA) in row detail.
10. Use **Dashboard kit** patterns for **filters**, **cards**, and **charts** (you already have **`StatCard`**, **`DashboardLineChart`**, **`DonutChart`** — repoint data sources).

**Phase E — UI (if tab “Usage”)**

11. Wire KPIs to **`usage`**, **`billing`**, **`activities`**, or **`jobs`** as per those modules’ docs; **remove** fake **`AnalyticsSummary`** or restrict it to a clearly labeled “derived from performance metrics only” experiment.

---

## 8. Summary

- **`contact360.io/api` `analytics` module** and **`18_ANALYTICS_MODULE.md`** describe **user-scoped performance metrics** (list, aggregate, submit with **epoch ms**).
- **`analyticsService` queries** match the API; **submission** and **date filters** are incomplete; **`getSummary`** is a **legacy adapter** that **does not** represent gateway semantics.
- **`/analytics` page** is styled like a **Dashboard kit** analytics view but is **fed by the wrong abstraction** (email/credits narrative vs **RUM metrics**).
- **Modular implementation** starts with a **product split**, then **submit + filter + aggregate + charts** for real performance data, and/or **separate usage** data from **other GraphQL modules**.
