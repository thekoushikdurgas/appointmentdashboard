"use client";

import { MaterialSymbol, type MaterialSymbolProps } from "./MaterialSymbol";

/** Material Symbol `paid` — docs/frontend/ideas/icon/billing_icon.md */
export function BillingIcon(props: Omit<MaterialSymbolProps, "name">) {
  return <MaterialSymbol name="paid" {...props} />;
}
