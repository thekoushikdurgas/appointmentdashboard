> **Source:** split from [`extended-module-notes.md`](../extended-module-notes.md) (index). Module order follows the original monolith.
> **27_TWO_FACTOR_MODULE.md** vs **`contact360.io/api`** and **`contact360.io/app`**, plus Dashboard UI kit mapping.

---

## Module tracking

**Checkboxes** in **Phase** subsections below: `[x]` done · `[ ]` not done. Tag open items when useful: _(planned)_ roadmap · _(gap)_ known mismatch vs gateway · _(pending)_ blocked or unscheduled.

Full legend: [`README.md`](README.md#task-tracking-graphql--ui).

| Track       | What to update                                                                       |
| ----------- | ------------------------------------------------------------------------------------ |
| **GraphQL** | Operations, variables, and `Gql*` / codegen alignment vs `contact360.io/api` schema. |
| **UI**      | Routes under `app/`, feature components, Dashboard UI kit patterns, copy/UX.         |

## Roll-up (this module)

|             | GraphQL | UI  |
| ----------- | ------- | --- |
| **Primary** | [x]     | [x] |

**Codegen:** `TwoFactorQuery`, `TwoFactorMutation` — root `query.twoFactor`, `mutation.twoFactor`.

## What 27 defines

- **Namespace:** `twoFactor` on **Query** and **Mutation** (nested under your root types).
- **Query:** `get2FAStatus` → `TwoFactorStatus { enabled, verified }`.
- **Mutations:** `setup2FA` → `TwoFactorSetupResponse` (QR URL, TOTP URI, secret, backup codes); `verify2FA(code: String!)` → `Verify2FAResponse { verified, backup_codes }`; `disable2FA(password, backupCode)` → `Boolean`; `regenerateBackupCodes` → `RegenerateBackupCodesResponse { backup_codes }`.
- **Auth:** Required for all operations.
- **Storage:** `two_factor` table; secrets and backup codes hashed; one-time display of secret/codes.
- **Production gaps (doc + code):** real **pyotp** / **qrcode**, proper TOTP verify, password/backup verification on disable, rate limiting, etc.

---

## API implementation (`contact360.io/api`)

**Files:** `app/graphql/modules/two_factor/` (`queries.py`, `mutations.py`, `types.py`).

| Area                        | Match to 27                                                                                                                                                                                                 |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`get2FAStatus`**          | Returns `enabled` / `verified`; default `false` if no row.                                                                                                                                                  |
| **`setup2FA`**              | Generates secret (currently `secrets.token_hex` — doc/TODO note: not valid Base32 TOTP), backup codes, hashes, builds `otpauth://…` and external QR URL.                                                    |
| **`verify2FA`**             | Requires **exactly 6 characters** (`len(code) != 6` → `BadRequestError`); **placeholder** always sets `verified=True` when length is 6. **Backup codes** (non-6-digit) are **not** supported as documented. |
| **`disable2FA`**            | `password` + **`backupCode`** (GraphQL arg name); **no** real password/backup check yet.                                                                                                                    |
| **`regenerateBackupCodes`** | Returns **`RegenerateBackupCodesResponse(backup_codes=...)` only** — **no `success` field**.                                                                                                                |

Python types use **snake_case** attributes (`qr_code_url`, `backup_codes`). Strawberry’s default GraphQL exposure is typically **camelCase** (`qrCodeUrl`, `backupCodes`, `qrCodeData`), which matters for the client’s query strings.

---

## App implementation (`contact360.io/app`)

### What lines up

- **`twoFactorService.getStatus`** and **`useTwoFactor`** use **`get2FAStatus { enabled verified }`** — matches the API.
- **`setup2FA`** selection uses **`qrCodeUrl`, `qrCodeData`, `backupCodes`, `secret`** — aligns with camelCase naming if the schema converts snake_case fields.
- **`verify2FA`** requests **`verified`** and **`backupCodes`** — matches **`Verify2FAResponse`** shape.
- **`disable2FA`** uses **`password`** / **`backupCode`** — matches the server’s `backupCode` argument name.

### Resolved / current behavior

1. **`regenerateBackupCodes`** selection is **`backupCodes` only** (no **`success`**). **`twoFactorService`** uses **`RegenerateBackupCodesResponse`** from **`generated/types.ts`**.

2. **`twoFactorService`** imports **`TwoFactorStatus`**, **`TwoFactorSetupResponse`**, **`Verify2FaResponse`** from codegen — aligned with live schema field names (**`qrCodeUrl`**, **`backupCodes`**, etc.).

3. **Verify UX:** **`normalizeTotpCode`** + **`TOTP_CODE_LENGTH`**; **`TwoFactorPanel`** copy states **6-digit authenticator code** (not backup code) until the API accepts backup codes in **`verify2FA`**.

4. **`useTwoFactor.verify` / `disable` / `regenerateBackupCodes`** call **`refresh`** (**`get2FAStatus`**) after success where useful.

### Where it’s used

- **`TwoFactorPanel`** (`src/components/feature/two-factor/TwoFactorPanel.tsx`) wraps **`useTwoFactor`** and is embedded in **Settings** (`variant="full"`) and **Profile → Security** (`variant="compact"` via **`ProfileSecurityTab`**).

---

## Dashboard UI kit mapping

| 27 / security UX | Kit-style pattern                                                                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**       | Card + **toggle** or badge (“Off” / “On”); short explanatory **text**.                                                                                |
| **Setup flow**   | **Wizard** (`form-wizard`): (1) Start → (2) Show QR + secret + copy buttons → (3) **6-digit code input** → (4) Done. **Progress** indicator on steps. |
| **QR**           | `<img src={qrCodeUrl}>` or embed; link “Can’t scan?” → show **`qrCodeData`**.                                                                         |
| **Backup codes** | **Checkbox** “I saved my codes”; downloadable `.txt`; **Alert** “shown once”.                                                                         |
| **Verify**       | Single **input** (6 digits) or split OTP boxes; **primary button**.                                                                                   |
| **Disable**      | **Modal** with **password** field and/or **backup code**; confirm **radio** or checkbox.                                                              |
| **Regenerate**   | Confirm modal + list new codes; **danger** styling.                                                                                                   |
| **Errors**       | Inline under field + toast for `BadRequestError` / GraphQL errors.                                                                                    |

---

## Smaller tasks (phased)

### Phase A — Client–schema correctness

- [x] Field names **`qrCodeUrl`**, **`qrCodeData`**, **`backupCodes`**, **`verify2FA`**, **`regenerateBackupCodes { backupCodes }`** — confirmed in **`graphql/generated/types.ts`** and **`twoFactorService.ts`**.
- [x] No **`success`** on **`regenerateBackupCodes`**.
- [ ] **Regenerate codegen** when schema changes; avoid stale **`GqlTwoFactor*`** aliases if any remain outside **`twoFactorService`**.

### Phase B — Align verify UX with API (until backup codes work)

- [x] UI copy + **`twoFactorUtils`** (**6** digits, strip non-digits).
- [x] **`useTwoFactor.verify`** validates length before mutation.

### Phase C — Backend hardening (27 checklist)

- [ ] Replace placeholder secret with **`pyotp.generate_secret()`** and **Base32**; build **`otpauth://`** with that secret.
- [ ] Implement **`pyotp.TOTP(...).verify(code)`** with clock skew; **backup code** verification path for **`verify2FA`** and **`disable2FA`**.
- [ ] **Relax or branch** validation: 6-digit TOTP vs longer backup code.
- [ ] **Password verification** on **`disable2FA`** when `password` supplied; rate limiting and audit logs per 27.

### Phase D — Product polish

- [x] **Download** backup codes as **`.txt`** from **`TwoFactorPanel`**.
- [ ] **Login flow:** ensure auth module challenges 2FA when **`enabled`** (outside 27 doc but listed as related).
- [ ] **E2E tests:** setup → verify → status; regenerate; disable.

### Phase E — Hooks / shared UI

- [x] **`TwoFactorPanel`** shared from **Settings** and **Profile** (replaces duplicated markup).
- [ ] Optional **`TwoFactorContext`** only if multiple distant components need setup state.

---

## Summary

- **27** matches the **gateway shape**: **`get2FAStatus`**, **`setup2FA`**, **`verify2FA`**, **`disable2FA`**, **`regenerateBackupCodes`** with the documented return types (GraphQL uses **camelCase** fields aligned with **`graphql/generated/types.ts`**).
- **App:** **`twoFactorService`** re-exports **`TwoFactorStatus`** / **`TwoFactorSetupResponse`** from codegen; **`regenerateBackupCodes`** selects **`backupCodes` only**; **`TwoFactorPanel`** + **`useTwoFactor`** deliver the kit flow (QR, manual URI, backup **.txt** download, **6-digit** verification, disable with optional password/backup code).
- **Server `verify2FA`** may remain **6-digit-only** / placeholder until backend hardening; the UI states that **backup codes are not** entered on the verify step until the API supports it.
