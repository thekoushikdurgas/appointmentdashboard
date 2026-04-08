> **Source:** split from [`extended-module-notes.md`](../extended-module-notes.md) (index). Module order follows the original monolith.
> **14_BILLING_MODULE.md** ↔ **`contact360.io/api`** ↔ **`contact360.io/app`**, plus Dashboard UI kit mapping.

---

## Module tracking

**Checkboxes** in **Phase** subsections below: `[x]` done · `[ ]` not done.

Full legend: [`README.md`](README.md#task-tracking-graphql--ui).

| Track       | What to update                                                                       |
| ----------- | ------------------------------------------------------------------------------------ |
| **GraphQL** | Operations, variables, and `Gql*` / codegen alignment vs `contact360.io/api` schema. |
| **UI**      | Routes under `app/`, feature components, Dashboard UI kit patterns, copy/UX.         |

## Roll-up (this module)

|             | GraphQL         | UI              |
| ----------- | --------------- | --------------- |
| **Primary** | [x] _(partial)_ | [x] _(partial)_ |

**Codegen:** `BillingQuery`, `BillingMutation` — root `query.billing`, `mutation.billing`.

## 1. Canonical contract (summary)

| Area                    | App alignment                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Plans**               | `BILLING_PLANS` requests **`periods { monthly, quarterly, yearly }`** with **`price`, `credits`, `savings`, `ratePerCredit`**. |
| **purchaseAddon**       | Input **`packageId`**; result **`package`, `creditsAdded`, `totalCredits`**.                                                   |
| **cancelSubscription**  | **`message`, `subscriptionStatus`**.                                                                                           |
| **paymentInstructions** | **UPI / QR** — `upiId`, `phoneNumber`, `email`, `qrCodeS3Key`, `qrCodeBucketId`, `qrCodeDownloadUrl`.                          |
| **paymentSubmissions**  | **`paymentSubmissions(status, limit, offset)`** with full connection.                                                          |
| **Admin mutations**     | **`CreatePlanResult`**, **`UpdateAddonResult`** / **`packageId`**, etc., per gateway SDL.                                      |
| **approve / decline**   | **`approvePayment(submissionId)`**, **`declinePayment(input: DeclinePaymentInput!)`** → **`PaymentSubmission`**.               |

## 2. App implementation

### `billingService.ts`

- Aligns with **`graphql/generated/types.ts`** for billing operations listed above.
- **`createPlan` / `updatePlan`** accept **`unknown`** inputs — callers should pass shapes matching **`CreatePlanInput`** / **`UpdatePlanInput`** from codegen.

### `useBilling.ts`

- **`purchaseAddon(packageId)`** uses **`packageId`** in the mutation.

### `/billing` page

- Plan cards use **API monthly price** and **`pricesByPeriod`** for checkout.
- **Credit usage** progress from **`usagePercentage`**.
- **Invoices** tab: real table + printable card mapped from API rows; sample invoice only when the list is empty.

### `BillingCheckoutWizard`

- **Radio** billing period: monthly / quarterly / yearly; confirms with **`subscribe(tier, period)`**.

### `BillingInvoiceList`

- Paginated table of **`invoices`**; printable **`InvoiceCard`** from first row or demo sample.

---

## 3. Dashboard UI kit mapping

| Need            | Implementation                                                                 |
| --------------- | ------------------------------------------------------------------------------ |
| Plan comparison | Cards + **Checkout** wizard with **period radios**; prices from **`periods`**. |
| Usage           | **`Progress`** for **`usagePercentage`** on the billing header.                |
| Invoices        | Table + **InvoiceCard**; **Previous/Next** pagination.                         |
| Manual payment  | Copy updated to **UPI / transfer**; full proof upload still placeholder.       |

---

## 4. Smaller tasks (phased)

### Phase A — User-facing GraphQL accuracy

- [x] **`purchaseAddon`**: `packageId`, `package`, `creditsAdded`, `totalCredits`.
- [x] **`cancelSubscription`**: `subscriptionStatus`.
- [x] **`BILLING_PLANS`**: nested **`periods`**.
- [x] **Payment instructions** and **submissions** queries; **approve/decline** signatures.
- [x] **Admin mutations** in service (result types + `packageId` for addons).

### Phase B — Hooks

- [x] **`useBilling.purchaseAddon`** uses **`packageId`**.

### Phase C — Page / UX

- [x] Real plan **pricing** on cards; **period** in checkout; **invoice** table; **usage** progress.
- [ ] **Payment proof** upload wired to **Upload/S3** + **`submitPaymentProof`**.
- [ ] **Admin** payment queue UI (SuperAdmin) using **`getPaymentSubmissions`** + approve/decline.

### Phase D — Docs / tests

- [x] **`graphql.contracts.test.ts`** billing assertions.
- [ ] Regenerate codegen after any gateway change.

---

## 5. Summary

- **`billingService.ts`** was aligned with the **live gateway** (UPI instructions, **`packageId`**, compact mutation results, **`paymentSubmissions`**, **approve/decline**).
- **UI** uses **real plan periods**, **real invoices**, **usage progress**, and **period-aware checkout**; manual proof and admin queue remain **partial** follow-ups.
