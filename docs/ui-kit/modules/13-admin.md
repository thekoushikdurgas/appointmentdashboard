# Admin module (gateway) — app status

The **Next.js app no longer ships an admin console** (`/admin`, `adminService`, `useAdmin`, or `feature/admin/*`). Operator workflows run in **Django `contact360.io/admin`** (`admin_ops`), which calls the GraphQL `admin` namespace with the operator’s gateway token.

- **Parity matrix:** [`docs/GRAPHQL_PARITY.md`](../../GRAPHQL_PARITY.md) row **15** (`admin`).
- **Deployments / observability:** [`contact360.io/admin/docs/deployments-and-observability.md`](../../../../admin/docs/deployments-and-observability.md).
- **Super-admins in the app:** Settings shows **Open admin console** when `NEXT_PUBLIC_ADMIN_URL` is set.

Historical implementation notes before removal lived in prior revisions of this file (admin page tabs, `adminOperations.ts`, etc.).
