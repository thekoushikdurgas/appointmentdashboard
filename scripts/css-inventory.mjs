#!/usr/bin/env node
/**
 * CSS inventory report for Contact360 dashboard (custom c360-* CSS, no Tailwind).
 * Scans: package tooling, config files, @import graph, .css files, inline styles in TSX/JSX.
 * Output: reports/css-inventory.txt + stdout
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const REPORT_DIR = path.join(ROOT, "reports");
const REPORT_FILE = path.join(REPORT_DIR, "css-inventory.txt");

const lines = [];

function out(s = "") {
  lines.push(s);
  console.log(s);
}

function walkDir(dir, filterExt, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name === "node_modules" || name.name === ".next") continue;
      walkDir(p, filterExt, acc);
    } else if (filterExt.some((e) => name.name.endsWith(e))) {
      acc.push(p);
    }
  }
  return acc;
}

function read(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

function pkgTailwindHints(pkg) {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const keys = Object.keys(deps || {});
  const tailwindish = keys.filter(
    (k) =>
      k.includes("tailwind") ||
      k === "postcss" ||
      k === "autoprefixer" ||
      k.startsWith("@tailwindcss/"),
  );
  return tailwindish.sort();
}

function findConfigFiles() {
  const names = [
    "tailwind.config.js",
    "tailwind.config.ts",
    "tailwind.config.mjs",
    "postcss.config.js",
    "postcss.config.mjs",
    "postcss.config.cjs",
  ];
  return names.map((n) => path.join(ROOT, n)).filter((p) => fs.existsSync(p));
}

function collectImportsFromFile(filePath) {
  const text = read(filePath);
  const imports = [];
  const re = /@import\s+["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const raw = m[1];
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      imports.push({ type: "external-url", spec: raw, from: filePath });
      continue;
    }
    const resolved = path.normalize(
      path.join(path.dirname(filePath), raw.split("?")[0]),
    );
    imports.push({ type: "relative", spec: raw, resolved, from: filePath });
  }
  return imports;
}

/** Flatten import tree from an entry CSS file (breadth-first, no duplicates). */
function flattenImportTree(entryCss) {
  const out = [];
  const seen = new Set();
  const queue = [path.resolve(entryCss)];
  while (queue.length) {
    const filePath = queue.shift();
    if (!filePath || seen.has(filePath)) continue;
    seen.add(filePath);
    for (const im of collectImportsFromFile(filePath)) {
      out.push(im);
      if (im.type === "relative" && im.resolved?.endsWith(".css")) {
        const r = im.resolved;
        if (fs.existsSync(r) && !seen.has(r)) queue.push(r);
      }
    }
  }
  return out;
}

function scanInlineStyles(files) {
  const styleReact = /\bstyle\s*=\s*\{/;
  const styleHtml = /\bstyle\s*=\s*["']/;
  const perFile = [];
  let totalReact = 0;
  let totalHtml = 0;
  for (const file of files) {
    const text = read(file);
    const rel = path.relative(ROOT, file);
    let nReact = 0;
    let nHtml = 0;
    const hitLines = [];
    text.split("\n").forEach((line, i) => {
      if (styleReact.test(line)) {
        nReact++;
        hitLines.push(i + 1);
      } else if (styleHtml.test(line)) {
        nHtml++;
        hitLines.push(i + 1);
      }
    });
    if (nReact > 0 || nHtml > 0) {
      totalReact += nReact;
      totalHtml += nHtml;
      perFile.push({
        file: rel,
        reactInlineBlocks: nReact,
        htmlInlineAttrs: nHtml,
        lines: [...new Set(hitLines)].slice(0, 40),
      });
    }
  }
  perFile.sort((a, b) => b.reactInlineBlocks - a.reactInlineBlocks);
  return { perFile, totalReact, totalHtml };
}

/**
 * Heuristic: for each `style={` line, look ahead a few lines for `--c360-*`
 * custom properties (design-system bridge) vs positional / library-only blocks.
 */
function scanStyleBlocksC360Hint(files) {
  let styleOpenLines = 0;
  let withC360InWindow = 0;
  const LOOKAHEAD = 10;
  let totalC360Tokens = 0;

  for (const file of files) {
    const lines = read(file).split("\n");
    const text = lines.join("\n");
    const tokenMatches = text.match(/--c360-[\w-]+/g);
    if (tokenMatches) totalC360Tokens += tokenMatches.length;

    for (let i = 0; i < lines.length; i++) {
      if (!/\bstyle\s*=\s*\{/.test(lines[i])) continue;
      styleOpenLines++;
      const windowText = lines
        .slice(i, Math.min(i + LOOKAHEAD, lines.length))
        .join("\n");
      if (/--c360-/.test(windowText)) withC360InWindow++;
    }
  }

  return {
    styleOpenLines,
    withC360InWindow,
    withoutC360InWindow: Math.max(0, styleOpenLines - withC360InWindow),
    totalC360Tokens,
    lookaheadLines: LOOKAHEAD,
  };
}

function scanExternalStylesheetRefs(files) {
  const hits = [];
  const linkRe = /<link[^>]+rel=["']stylesheet["'][^>]*>/gi;
  const hrefRe = /href=["']([^"']+)["']/;
  for (const file of files) {
    const text = read(file);
    let m;
    while ((m = linkRe.exec(text)) !== null) {
      const href = hrefRe.exec(m[0]);
      hits.push({
        file: path.relative(ROOT, file),
        tag: m[0].trim(),
        href: href ? href[1] : "?",
      });
    }
  }
  return hits;
}

/**
 * Tailwind-specific signals only (avoid false positives on c360-flex, etc.).
 * - twMerge / tailwind-merge usage
 * - @tailwind in CSS
 * - responsive/variant prefixes like sm: md: on non-c360 classes (heuristic)
 */
function scanTailwindLikeSignals(tsxFiles, cssFiles) {
  const hits = [];
  const twMerge = /\btwMerge\s*\(/;
  const atTailwind = /@tailwind\b/;
  /** Breakpoint variants typical of Tailwind, not used by c360 class names */
  const variantUtility =
    /\bclassName\s*=\s*\{?[^;{}]*["'`][^"'`]*\b(?:sm|md|lg|xl|2xl):[a-z]/;

  for (const file of tsxFiles) {
    const text = read(file);
    const rel = path.relative(ROOT, file);
    if (twMerge.test(text)) {
      hits.push({ file: rel, reason: "twMerge(" });
      continue;
    }
    if (variantUtility.test(text)) {
      hits.push({ file: rel, reason: "responsive variant (sm:/md:/…)" });
    }
  }
  for (const file of cssFiles) {
    const text = read(file);
    const rel = path.relative(ROOT, file);
    if (atTailwind.test(text)) {
      hits.push({ file: rel, reason: "@tailwind directive" });
    }
  }
  return hits;
}

function cssFileStats(cssDir) {
  const files = walkDir(cssDir, [".css"], []);
  const stats = files.map((f) => {
    const text = read(f);
    const c360Rules = (text.match(/^\.c360[-\w]*/gm) || []).length;
    return {
      rel: path.relative(ROOT, f).replace(/\\/g, "/"),
      bytes: Buffer.byteLength(text, "utf8"),
      lines: text.split("\n").length,
      approxC360Selectors: c360Rules,
    };
  });
  return stats.sort((a, b) => b.bytes - a.bytes);
}

function main() {
  out("=".repeat(72));
  out("CONTACT360 — CSS INVENTORY (custom design system + hygiene report)");
  out("Generated: " + new Date().toISOString());
  out("=".repeat(72));
  out();

  const pkgPath = path.join(ROOT, "package.json");
  const pkg = JSON.parse(read(pkgPath) || "{}");
  out("## 1) Package.json — Tailwind / PostCSS related");
  const twDeps = pkgTailwindHints(pkg);
  if (twDeps.length === 0) {
    out("  (none) — no tailwindcss / @tailwindcss / postcss packages listed.");
  } else {
    twDeps.forEach((d) => out(`  - ${d}`));
  }
  out();

  out("## 2) Config files (Tailwind / PostCSS)");
  const configs = findConfigFiles();
  if (configs.length === 0) {
    out("  (none) — no tailwind.config.* or postcss.config.* at app root.");
  } else {
    configs.forEach((p) => out(`  - ${path.relative(ROOT, p)}`));
  }
  out();

  out("## 3) App entry CSS graph (globals.css → @import chain)");
  const globalsPath = path.join(ROOT, "app", "globals.css");
  if (fs.existsSync(globalsPath)) {
    out(`  Entry: ${path.relative(ROOT, globalsPath)}`);
    const imports = flattenImportTree(globalsPath);
    const done = new Set();
    for (const im of imports) {
      const key =
        im.type === "external-url"
          ? `url:${im.spec}`
          : `rel:${im.resolved || im.spec}`;
      if (done.has(key)) continue;
      done.add(key);
      if (im.type === "external-url") {
        out(`  @import EXTERNAL: ${im.spec}`);
        out(`    from: ${path.relative(ROOT, im.from)}`);
      } else {
        out(
          `  @import ${im.spec} → ${im.resolved ? path.relative(ROOT, im.resolved) : "?"}`,
        );
      }
    }
  } else {
    out("  (globals.css not found)");
  }
  out();

  out("## 4) All .css files under app/ (size + ~.c360 rule lines)");
  const appCssRoot = path.join(ROOT, "app");
  const cssStats = cssFileStats(appCssRoot);
  for (const s of cssStats) {
    out(
      `  ${String(s.bytes).padStart(7)} B  ${String(s.lines).padStart(5)} lines  ~${String(s.approxC360Selectors).padStart(4)} .c360…  ${s.rel}`,
    );
  }
  out();

  out("## 5) components.css barrel (numbered partials)");
  const barrel = path.join(ROOT, "app", "css", "components.css");
  if (fs.existsSync(barrel)) {
    read(barrel)
      .split("\n")
      .filter((l) => l.includes("@import"))
      .forEach((l) => out(`  ${l.trim()}`));
  }
  out();

  const tsxFiles = [
    ...walkDir(path.join(ROOT, "app"), [".tsx", ".jsx"]),
    ...walkDir(path.join(ROOT, "src"), [".tsx", ".jsx"]),
  ];

  out('## 6) External <link rel="stylesheet"> in TSX/JSX');
  const links = scanExternalStylesheetRefs(tsxFiles);
  if (links.length === 0) {
    out("  (none found in scanned app/ + src/)");
  } else {
    links.forEach((h) => {
      out(`  ${h.file}: ${h.href}`);
    });
  }
  out();

  out("## 7) Tailwind-related signals (twMerge, @tailwind, sm:/md: variants)");
  const cssAll = walkDir(path.join(ROOT, "app"), [".css"], []);
  const twLike = scanTailwindLikeSignals(tsxFiles, cssAll);
  if (twLike.length === 0) {
    out(
      "  (none — project uses custom c360-* CSS; no Tailwind toolchain detected.)",
    );
  } else {
    twLike.forEach((h) => out(`  - ${h.file}  (${h.reason})`));
  }
  out();

  out('## 8) Inline styles (React style={{ … }} and style="…")');
  const inline = scanInlineStyles(tsxFiles);
  out(
    `  Files with inline style: ${inline.perFile.length} (sorted by inline style count, descending).`,
  );
  out(
    `  Total lines matching style={{ or style=": React blocks ~${inline.totalReact}, HTML attr ~${inline.totalHtml}`,
  );
  out();
  out("  Files with inline style (first 80 paths):");
  inline.perFile.slice(0, 80).forEach((p) => {
    out(
      `  - ${p.file}  (react=${p.reactInlineBlocks}, htmlAttr=${p.htmlInlineAttrs})  lines: ${p.lines.join(", ")}${p.lines.length >= 40 ? " …" : ""}`,
    );
  });
  if (inline.perFile.length > 80) {
    out(`  … and ${inline.perFile.length - 80} more files`);
  }
  out();

  const c360Hint = scanStyleBlocksC360Hint(tsxFiles);
  out("## 8b) Inline style blocks — design-system variable hint (--c360-*)");
  out(
    `  Opening lines with style={{ (same count as §8): ${c360Hint.styleOpenLines}.`,
  );
  out(
    `  Blocks where \`--c360-\` appears within the next ${c360Hint.lookaheadLines} lines: ${c360Hint.withC360InWindow} (likely token / variable bridge to CSS).`,
  );
  out(
    `  Blocks with no \`--c360-\` in that window: ${c360Hint.withoutC360InWindow} (often portals, maps, library geometry, or plain left/top/transform).`,
  );
  out(
    `  Total \`--c360-\` substring matches in scanned TSX/JSX (includes style + rare strings): ~${c360Hint.totalC360Tokens}`,
  );
  out();

  out("## 9) Suggested workflow (unique classes + custom CSS)");
  out(
    "  - Prefer c360-<feature>-<element> or existing utilities in utilities.css.",
  );
  out(
    "  - Replace style={{}} with classes; keep dynamic values as minimal inline.",
  );
  out(
    "  - New feature CSS: add to the smallest relevant components/NN-*.css or utilities.",
  );
  out(
    "  - Large partials (e.g. layout.css, utilities.css, or app-page bundles): split by domain into new NN-* files",
  );
  out(
    "    and add @import lines to components.css (see 18-app-dynamic-maps-widgets.css for a recent split).",
  );
  out();

  out("=".repeat(72));
  out(`Full report written to: ${path.relative(ROOT, REPORT_FILE)}`);
  out("=".repeat(72));

  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_FILE, lines.join("\n"), "utf8");
}

main();
