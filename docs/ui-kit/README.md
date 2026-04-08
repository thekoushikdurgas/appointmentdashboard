# UI kit documentation (app)

| File                                                   | Role                                                                                                     |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| [`../UI_KIT_MAPPING.md`](../UI_KIT_MAPPING.md)         | **Spine:** kit index, conventions, §3 parity, §4 phased tasks, §4a P0–P4 queue, related docs, decisions. |
| [`extended-module-notes.md`](extended-module-notes.md) | **Index** to deep dives + **roll-up status** (GraphQL vs UI).                                            |
| [`modules/`](modules/)                                 | **Per-module narratives** (`00-overview.md` first, then auth, users, contacts, …).                       |

HTML reference kit (patterns only, not copy-paste): repo root `docs/frontend/ideas/Dashboard ui kit`.

---

## Task tracking (GraphQL + UI)

Use the same checkbox convention in **`modules/*.md`**, [`extended-module-notes.md`](extended-module-notes.md), and parity notes in [`../GRAPHQL_PARITY.md`](../GRAPHQL_PARITY.md).

### Checkbox meaning

| Mark    | Meaning                                                                               |
| ------- | ------------------------------------------------------------------------------------- |
| `- [x]` | **Completed** — implemented or verified against live schema / UI.                     |
| `- [ ]` | **Incomplete** — not done or not verified. Add a tag from the next table when useful. |

| Tag (after checkbox text) | Meaning                                                |
| ------------------------- | ------------------------------------------------------ |
| _(planned)_               | **Planned** — agreed roadmap; not started.             |
| _(gap)_                   | Known mismatch vs gateway schema, service, or UI spec. |
| _(pending)_               | **Pending** — blocked (dependency, env, or decision).  |
| _(partial)_               | Primary flows OK; edge cases or polish remain.         |

### Two tracks

| Track       | What it covers                                                                                                                                     |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **GraphQL** | Query/mutation documents, variables, field names, `src/graphql/generated/types.ts` (`Gql*`), alignment with `contact360.io/api` Strawberry schema. |
| **UI**      | `app/` routes, `src/components/feature/**`, Dashboard UI kit patterns (`docs/frontend/ideas/Dashboard ui kit`), loading/error/empty states.        |

### Dual-track tasks (nested checkboxes)

When a single bullet spans both layers, indent **GraphQL** and **UI** so parity is visible:

```markdown
- [ ] **Short label for the slice**
  - [x] **GraphQL** — service + operations match `types.ts` / gateway.
  - [ ] **UI** — route/components wired; _(partial)_ if polish remains.
```

**Roll-up tables** at the top of many `modules/*.md` files use two columns (**GraphQL** / **UI**) with the same `[x]` / `[ ]` marks.

### Codegen map

Root `Query` / `Mutation` fields correspond to `*Query` / `*Mutation` types in [`src/graphql/generated/types.ts`](../../src/graphql/generated/types.ts). See [`modules/00-overview.md`](modules/00-overview.md#codegen-module-map-srcgraphqlgeneratedtypests) for the full table.

**Tip:** Prefer ticking **`[x]`** only after `npm run codegen` (API up) + a quick manual run of the affected route.
