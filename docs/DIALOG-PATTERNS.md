# Dialog and notification patterns

## Sonner (primary)

- **GraphQL errors:** `graphqlRequest` in `src/lib/graphqlClient.ts` shows Sonner toasts for failures unless `showToastOnError: false`.
- **Success / info:** Use `toast.success`, `toast.error`, `toast.message` from `sonner` for inline feedback after mutations.

## SweetAlert2 (secondary)

- **UIKit demos:** `src/components/ui/SweetAlert.tsx` and the UI kit page use SweetAlert for modal-style confirmations in isolation.
- **Product flows:** Prefer Sonner + the shared `Modal` component for destructive confirmations so behavior stays consistent with the rest of the app. Use SweetAlert only where an existing flow already depends on it.

## Modals

- Use `Modal` from `src/components/ui/Modal.tsx` with `useModal` for focus-friendly overlays.
