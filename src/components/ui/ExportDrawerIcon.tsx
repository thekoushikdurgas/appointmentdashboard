"use client";

import { MaterialSymbol, type MaterialSymbolProps } from "./MaterialSymbol";

/** Material Symbol `download` — docs/frontend/ideas/icon/export_icon.md */
export function ExportDrawerIcon(
  props: Omit<MaterialSymbolProps, "name">,
) {
  return <MaterialSymbol name="download" {...props} />;
}
