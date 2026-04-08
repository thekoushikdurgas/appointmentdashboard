#!/usr/bin/env node
/**
 * Next.js / Contact360 app best-practices checker (scored checklist, aligned with
 * contact360.io/2 `manage.py check_best_practices` workflow).
 *
 * Usage:
 *   node scripts/check-best-practices.mjs
 *   node scripts/check-best-practices.mjs --category "Security"
 *   node scripts/check-best-practices.mjs --output reports/check.json
 *   node scripts/check-best-practices.mjs --format text
 *   node scripts/check-best-practices.mjs --threshold 80
 *   node scripts/check-best-practices.mjs --no-fail
 *
 * Config (optional): .next-checker-config.json at app root
 *   ignore_points: number[]     — exclude these point IDs from scoring
 *   skip_categories: string[]   — skip categories (substring match, case-insensitive)
 *   require_playwright_config: boolean — default false; if true, require playwright.config.*
 *   require_middleware: boolean — default false; if true, require middleware.ts/js or proxy.ts (Next 16)
 *   max_inline_style_files: number — Styling (point 45); max src/* files with style={{ (default 30)
 *   max_any_count: number — TypeScript (point 51); max : any / as any / any[] in src/ excl. graphql/generated (default 20)
 *   max_console_logs: number — Architecture (point 58); max console.log( in src/ (default 10)
 *   require_coverage_script: boolean — if true, require package.json scripts.test:coverage (point 74)
 *   require_ci_script: boolean — if true, require scripts.ci to include check:best-practices (point 86)
 *   localstorage_allow_files: string[] — optional; paths (relative to app root) allowed localStorage besides tokenManager (point 59)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CONFIG_PATH = path.join(ROOT, ".next-checker-config.json");

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(`
Usage: node scripts/check-best-practices.mjs [options]

  --category <name>   Filter checks by category (substring, case-insensitive)
  --output <path>     Write JSON report (default: reports/check_report_<timestamp>.json if format includes json)
  --format text|json|both   Default: both (stdout summary + JSON file)
  --threshold <n>     Exit 1 if score < n (default: 80)
  --no-fail           Always exit 0 (CI advisory mode)

Config: .next-checker-config.json — see script header for full list (max_any_count, max_console_logs, require_coverage_script, require_ci_script, …)
`);
    process.exit(0);
  }
  const out = {
    category: null,
    output: null,
    format: "both",
    threshold: 80,
    noFail: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--category" && argv[i + 1]) {
      out.category = argv[++i];
      continue;
    }
    if (a === "--output" && argv[i + 1]) {
      out.output = argv[++i];
      continue;
    }
    if (a === "--format" && argv[i + 1]) {
      const f = argv[++i];
      if (["text", "json", "both"].includes(f)) out.format = f;
      continue;
    }
    if (a === "--threshold" && argv[i + 1]) {
      const n = Number(argv[++i]);
      if (!Number.isNaN(n)) out.threshold = n;
      continue;
    }
    if (a === "--no-fail") {
      out.noFail = true;
      continue;
    }
  }
  return out;
}

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  } catch {
    return {};
  }
}

function exists(p) {
  return fs.existsSync(p);
}

function readText(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function walkDir(dir, acc = []) {
  if (!exists(dir)) return acc;
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) {
      if (
        name.name === "node_modules" ||
        name.name === ".next" ||
        name.name === "coverage" ||
        name.name === "dist" ||
        name.name === "out"
      ) {
        continue;
      }
      walkDir(p, acc);
    } else {
      acc.push(p);
    }
  }
  return acc;
}

function walkCodeFiles(rootSubdirs) {
  const exts = new Set([".ts", ".tsx"]);
  const acc = [];
  for (const sub of rootSubdirs) {
    const base = path.join(ROOT, sub);
    walkDir(base, acc);
  }
  return acc.filter((p) => {
    const ext = path.extname(p);
    if (!exts.has(ext)) return false;
    const b = path.basename(p);
    if (b.endsWith(".test.ts") || b.endsWith(".test.tsx")) return false;
    if (b.endsWith(".spec.ts") || b.endsWith(".spec.tsx")) return false;
    return true;
  });
}

/** Files under src/ (non-test) whose source contains inline React `style={{ ... }}`. */
function countSrcFilesWithInlineStyle() {
  const re = /\bstyle\s*=\s*\{\s*\{/;
  let n = 0;
  for (const p of walkCodeFiles(["src"])) {
    if (re.test(readText(p))) n++;
  }
  return n;
}

/** Count TypeScript `any` usages in src/ excluding graphql/generated (matches : any, as any, any[], Array<any>, <any>). */
function countAnyAnnotationsInSrc() {
  const re = /:\s*any\b|as\s+any\b|Array<\s*any\s*>|<\s*any\s*>|\bany\s*\[\s*\]/g;
  let count = 0;
  for (const p of walkCodeFiles(["src"])) {
    if (p.includes(`${path.sep}graphql${path.sep}generated${path.sep}`)) continue;
    const matches = readText(p).match(re);
    if (matches) count += matches.length;
  }
  return count;
}

/** Total console.log( occurrences in src/. */
function countConsoleLogsInSrc() {
  let count = 0;
  for (const p of walkCodeFiles(["src"])) {
    const m = readText(p).match(/\bconsole\.log\s*\(/g);
    if (m) count += m.length;
  }
  return count;
}

/**
 * Files under src/ that call localStorage outside tokenManager and outside config.localstorage_allow_files.
 * @param {string[]} allowedRelative — paths relative to app root (e.g. src/context/ThemeContext.tsx)
 */
function findLocalStorageOutsideTokenManager(allowedRelative = []) {
  const tokenPath = path.resolve(path.join(ROOT, "src", "lib", "tokenManager.ts"));
  const allowedResolved = new Set(
    [tokenPath].concat(
      (allowedRelative || []).map((r) => path.resolve(ROOT, String(r).replace(/\//g, path.sep))),
    ),
  );
  const re = /localStorage\.(getItem|setItem|removeItem|clear)\s*\(/;
  const hits = [];
  for (const p of walkCodeFiles(["src"])) {
    const resolved = path.resolve(p);
    if (allowedResolved.has(resolved)) continue;
    if (re.test(readText(p))) hits.push(path.relative(ROOT, p));
  }
  return hits;
}

/** Files under src/ (besides config.ts) that reference process.env. */
function findProcessEnvOutsideConfig() {
  const configPath = path.resolve(path.join(ROOT, "src", "lib", "config.ts"));
  const re = /\bprocess\.env\b/;
  const hits = [];
  for (const p of walkCodeFiles(["src"])) {
    if (path.resolve(p) === configPath) continue;
    if (re.test(readText(p))) hits.push(path.relative(ROOT, p));
  }
  return hits;
}

/** *.spec.ts / *.test.ts under e2e/ (non-recursive walk is insufficient — use walkDir). */
function listE2eSpecFiles() {
  const dir = path.join(ROOT, "e2e");
  if (!exists(dir)) return [];
  const all = [];
  walkDir(dir, all);
  return all.filter(
    (p) =>
      p.endsWith(".spec.ts") ||
      p.endsWith(".spec.tsx") ||
      p.endsWith(".test.ts") ||
      p.endsWith(".test.tsx"),
  );
}

/** Non-generated *Operations.ts files under src/graphql/. */
function listGraphqlOperationFiles() {
  const dir = path.join(ROOT, "src", "graphql");
  if (!exists(dir)) return [];
  const all = [];
  walkDir(dir, all);
  return all.filter(
    (p) =>
      /Operations\.tsx?$/.test(p) && !p.includes(`${path.sep}generated${path.sep}`),
  );
}

const SECRET_PATTERNS = [
  { name: "Stripe live key", re: /sk_live_[0-9a-zA-Z]{20,}/ },
  { name: "AWS access key id", re: /AKIA[0-9A-Z]{16}/ },
  { name: "PEM private key", re: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: "GitHub PAT (classic)", re: /ghp_[0-9a-zA-Z]{36}/ },
];

/**
 * @param {object} ctx
 * @returns {{ point_number: number, category: string, description: string, passed: boolean, message: string, severity: string }[]}
 */
function runAllChecks(ctx) {
  const { config } = ctx;
  const pkgPath = path.join(ROOT, "package.json");
  const pkg = readJson(pkgPath) || {};
  const scripts = pkg.scripts || {};
  const devDeps = pkg.devDependencies || {};
  const deps = pkg.dependencies || {};

  const results = [];

  function add(point_number, category, description, passed, message, severity = "info") {
    results.push({
      point_number,
      category,
      description,
      passed: !!passed,
      message: String(message),
      severity,
    });
  }

  // —— Project Structure ——
  add(
    1,
    "Project Structure",
    "app/ directory exists (App Router)",
    exists(path.join(ROOT, "app")) && fs.statSync(path.join(ROOT, "app")).isDirectory(),
    exists(path.join(ROOT, "app")) ? "app/ present" : "app/ missing",
  );

  add(
    2,
    "Project Structure",
    "package.json defines lint, typecheck, and build scripts",
    !!(scripts.lint && scripts.typecheck && scripts.build),
    `lint: ${!!scripts.lint}, typecheck: ${!!scripts.typecheck}, build: ${!!scripts.build}`,
  );

  const nextConfig =
    ["next.config.ts", "next.config.mjs", "next.config.js"].find((n) =>
      exists(path.join(ROOT, n)),
    ) || null;
  add(
    3,
    "Project Structure",
    "next.config file present",
    !!nextConfig,
    nextConfig ? `Found ${nextConfig}` : "No next.config.{ts,mjs,js}",
  );

  const tsconfig = readJson(path.join(ROOT, "tsconfig.json"));
  const strict = !!(tsconfig && tsconfig.compilerOptions && tsconfig.compilerOptions.strict === true);
  add(
    4,
    "Project Structure",
    "tsconfig.json enables strict mode",
    strict,
    strict ? "strict: true" : "strict mode not enabled or tsconfig missing",
  );

  const readme = path.join(ROOT, "README.md");
  const readmeOk =
    exists(readme) && readText(readme).trim().length >= 200;
  add(
    5,
    "Project Structure",
    "README.md exists with substantive content (>= 200 chars)",
    readmeOk,
    readmeOk ? `README length ${readText(readme).trim().length}` : "README missing or too short",
  );

  const gi = path.join(ROOT, ".gitignore");
  const giText = gi ? readText(gi) : "";
  const giOk =
    exists(gi) &&
    giText.includes("node_modules") &&
    (giText.includes(".env") || giText.includes(".env.local"));
  add(
    6,
    "Project Structure",
    ".gitignore excludes node_modules and env files",
    giOk,
    giOk ? ".gitignore looks good" : "Add node_modules and .env patterns",
  );

  add(
    7,
    "Project Structure",
    "scripts/ directory for maintenance tooling",
    exists(path.join(ROOT, "scripts")) && fs.statSync(path.join(ROOT, "scripts")).isDirectory(),
    exists(path.join(ROOT, "scripts")) ? "scripts/ present" : "scripts/ missing",
  );

  add(
    8,
    "Project Structure",
    "package.json is private (npm publish safety)",
    pkg.private === true,
    pkg.private === true ? "private: true" : "Set private: true in package.json",
  );

  // —— Security & Environment ——
  const envExample =
    exists(path.join(ROOT, ".env.example")) ||
    exists(path.join(ROOT, ".env.production.example"));
  add(
    9,
    "Security",
    ".env.example or .env.production.example documents required variables",
    envExample,
    envExample ? "Env template file present" : "Add .env.example (or .env.production.example)",
  );

  const envDoc = readText(path.join(ROOT, ".env.example")) + readText(path.join(ROOT, ".env.production.example"));
  add(
    10,
    "Security",
    "Env template mentions NEXT_PUBLIC_ variables where applicable",
    envExample && /NEXT_PUBLIC_/i.test(envDoc),
    envExample
      ? /NEXT_PUBLIC_/i.test(envDoc)
        ? "NEXT_PUBLIC_ documented"
        : "Consider documenting NEXT_PUBLIC_* keys"
      : "Skipped (no env template)",
    envExample && !/NEXT_PUBLIC_/i.test(envDoc) ? "warning" : "info",
  );

  let secretHits = [];
  const codeFiles = walkCodeFiles(["app", "src"]);
  outer: for (const file of codeFiles) {
    const text = readText(file);
    for (const { name, re } of SECRET_PATTERNS) {
      if (re.test(text)) {
        secretHits.push(`${name} pattern in ${path.relative(ROOT, file)}`);
        if (secretHits.length >= 5) break outer;
      }
    }
  }
  add(
    11,
    "Security",
    "No obvious hardcoded secrets in app/ and src/ (heuristic scan)",
    secretHits.length === 0,
    secretHits.length === 0 ? "No high-risk patterns matched" : secretHits.join("; "),
    secretHits.length ? "error" : "info",
  );

  const ncPath = nextConfig ? path.join(ROOT, nextConfig) : path.join(ROOT, "next.config.ts");
  add(
    12,
    "Security",
    "next.config disables X-Powered-By header",
    exists(ncPath) && /poweredByHeader:\s*false/.test(readText(ncPath)),
    "poweredByHeader: false recommended",
  );

  // —— Code Organization ——
  add(
    13,
    "Code Organization",
    "src/ directory for shared application code",
    exists(path.join(ROOT, "src")),
    exists(path.join(ROOT, "src")) ? "src/ present" : "src/ missing",
  );

  add(
    14,
    "Code Organization",
    "src/components/ for UI composition",
    exists(path.join(ROOT, "src", "components")),
    exists(path.join(ROOT, "src", "components")) ? "src/components present" : "src/components missing",
  );

  const appLayout =
    exists(path.join(ROOT, "app", "layout.tsx")) ||
    exists(path.join(ROOT, "app", "layout.js"));
  add(
    15,
    "Code Organization",
    "Root app/layout exists",
    appLayout,
    appLayout ? "app/layout found" : "Add app/layout.tsx",
  );

  add(
    16,
    "Code Organization",
    "GraphQL codegen config (codegen.ts or similar)",
    exists(path.join(ROOT, "codegen.ts")) || exists(path.join(ROOT, "codegen.yml")),
    exists(path.join(ROOT, "codegen.ts"))
      ? "codegen.ts present"
      : exists(path.join(ROOT, "codegen.yml"))
        ? "codegen.yml present"
        : "No codegen.ts / codegen.yml",
  );

  const hasLib =
    exists(path.join(ROOT, "src", "lib")) || exists(path.join(ROOT, "src", "utils"));
  add(
    17,
    "Code Organization",
    "src/lib or src/utils for shared helpers",
    hasLib,
    hasLib ? "Found lib/ or utils/" : "Consider src/lib or src/utils",
  );

  const testFiles = walkDir(path.join(ROOT, "src"), []).filter(
    (p) =>
      p.endsWith(".test.ts") ||
      p.endsWith(".test.tsx") ||
      p.endsWith(".spec.ts") ||
      p.endsWith(".spec.tsx"),
  );
  add(
    18,
    "Code Organization",
    "Colocated tests under src/ (*.test.* or *.spec.*)",
    testFiles.length > 0,
    testFiles.length > 0 ? `${testFiles.length} test files under src/` : "No unit tests under src/",
    testFiles.length ? "info" : "warning",
  );

  // —— Quality Tooling ——
  add(
    19,
    "Quality Tooling",
    "ESLint config present (.eslintrc.json or eslint.config.*)",
    exists(path.join(ROOT, ".eslintrc.json")) ||
      exists(path.join(ROOT, "eslint.config.mjs")) ||
      exists(path.join(ROOT, "eslint.config.js")),
    "ESLint config file",
  );

  add(20, "Quality Tooling", "Prettier in devDependencies", !!devDeps.prettier, devDeps.prettier ? `prettier ${devDeps.prettier}` : "Add prettier");

  add(21, "Quality Tooling", "ESLint in devDependencies", !!devDeps.eslint, devDeps.eslint ? `eslint ${devDeps.eslint}` : "Add eslint");

  add(
    22,
    "Quality Tooling",
    "Husky + prepare script for git hooks",
    !!devDeps.husky && /husky/.test(String(scripts.prepare || "")),
    devDeps.husky && scripts.prepare ? "prepare runs husky" : "Add husky and \"prepare\": \"husky\"",
  );

  add(
    23,
    "Quality Tooling",
    "TypeScript in devDependencies",
    !!devDeps.typescript,
    devDeps.typescript ? `typescript ${devDeps.typescript}` : "Add typescript",
  );

  add(
    24,
    "Quality Tooling",
    "lint-staged configured in package.json",
    !!pkg["lint-staged"],
    pkg["lint-staged"] ? "lint-staged present" : "Optional: lint-staged for pre-commit",
    pkg["lint-staged"] ? "info" : "warning",
  );

  // —— Testing ——
  add(
    25,
    "Testing",
    "Vitest test script in package.json",
    /vitest/.test(String(scripts.test || "")),
    scripts.test || "no test script",
  );

  add(
    26,
    "Testing",
    "vitest.config.ts (or .mts) present",
    exists(path.join(ROOT, "vitest.config.ts")) ||
      exists(path.join(ROOT, "vitest.config.mts")) ||
      exists(path.join(ROOT, "vitest.config.js")),
    "Vitest config file",
  );

  add(
    27,
    "Testing",
    "@playwright/test in devDependencies",
    !!devDeps["@playwright/test"],
    devDeps["@playwright/test"] ? "Playwright devDependency present" : "Add @playwright/test for e2e",
  );

  add(
    28,
    "Testing",
    "e2e/ directory for Playwright specs",
    exists(path.join(ROOT, "e2e")),
    exists(path.join(ROOT, "e2e")) ? "e2e/ present" : "e2e/ missing",
  );

  const requirePwc = config.require_playwright_config === true;
  const pwc = ["playwright.config.ts", "playwright.config.mjs", "playwright.config.js"].some((n) =>
    exists(path.join(ROOT, n)),
  );
  add(
    29,
    "Testing",
    "Playwright config file (playwright.config.*)",
    requirePwc ? pwc : pwc || true,
    pwc
      ? "playwright.config found"
      : requirePwc
        ? "Add playwright.config.ts"
        : "Optional playwright.config (set require_playwright_config in .next-checker-config.json)",
    pwc ? "info" : requirePwc ? "error" : "warning",
  );

  // —— Performance & Next.js ——
  const usesNextImage = codeFiles.some((f) => readText(f).includes("next/image"));
  add(
    30,
    "Performance",
    "Uses next/image in app or src (optimized images)",
    usesNextImage,
    usesNextImage ? "next/image in use" : "Prefer next/image for raster images",
    usesNextImage ? "info" : "warning",
  );

  const ncText = readText(ncPath);
  add(
    31,
    "Performance",
    "next.config defines images.* (remotePatterns or domains)",
    /\bimages\s*:\s*\{/.test(ncText) && (/remotePatterns/.test(ncText) || /domains/.test(ncText)),
    "images.remotePatterns or domains configured",
  );

  add(
    32,
    "Performance",
    "Standalone output for container deploy (output: 'standalone')",
    /output\s*:\s*["']standalone["']/.test(ncText) || /output:\s*["']standalone["']/.test(ncText),
    "next.config output standalone",
  );

  const dynamicImports = codeFiles.filter((f) => readText(f).includes("import(")).length;
  add(
    33,
    "Performance",
    "Some dynamic import() usage for code-splitting",
    dynamicImports > 0,
    dynamicImports > 0 ? `${dynamicImports} files use import()` : "Consider import() for heavy client modules",
    dynamicImports > 0 ? "info" : "warning",
  );

  const requireMw = config.require_middleware === true;
  // Next.js 16+: middleware.ts and proxy.ts cannot both exist; Contact360 uses proxy.ts for edge routing.
  const mw =
    exists(path.join(ROOT, "middleware.ts")) ||
    exists(path.join(ROOT, "middleware.js")) ||
    exists(path.join(ROOT, "proxy.ts"));
  add(
    34,
    "Performance",
    "Edge routing: middleware.ts or proxy.ts (Next 16 — proxy-only when both would conflict)",
    requireMw ? mw : mw || true,
    mw
      ? exists(path.join(ROOT, "proxy.ts")) && !exists(path.join(ROOT, "middleware.ts"))
        ? "proxy.ts present (Next 16 edge routing)"
        : "middleware present"
      : requireMw
        ? "Add middleware.ts or proxy.ts if needed"
        : "No middleware/proxy (optional; set require_middleware in config to enforce)",
    mw ? "info" : requireMw ? "error" : "warning",
  );

  // —— Deployment & Ops ——
  add(
    35,
    "Deployment",
    "Dockerfile present",
    exists(path.join(ROOT, "Dockerfile")),
    exists(path.join(ROOT, "Dockerfile")) ? "Dockerfile found" : "Add Dockerfile for reproducible deploys",
  );

  const compose = fs
    .readdirSync(ROOT, { withFileTypes: true })
    .filter((d) => d.isFile() && /^docker-compose.*\.ya?ml$/i.test(d.name))
    .map((d) => d.name);
  add(
    36,
    "Deployment",
    "docker-compose*.yml at repo root (optional if Dockerfile only)",
    compose.length > 0 || exists(path.join(ROOT, "Dockerfile")),
    compose.length ? `Found ${compose.join(", ")}` : "No compose file (OK if Dockerfile-only)",
    compose.length ? "info" : "warning",
  );

  add(
    37,
    "Deployment",
    ".github/workflows present",
    exists(path.join(ROOT, ".github", "workflows")),
    exists(path.join(ROOT, ".github", "workflows")) ? "CI/CD workflows dir exists" : ".github/workflows missing",
  );

  add(
    38,
    "Deployment",
    "public/ for static assets",
    exists(path.join(ROOT, "public")),
    exists(path.join(ROOT, "public")) ? "public/ present" : "public/ missing",
  );

  // —— Dependencies hygiene ——
  add(
    39,
    "Quality Tooling",
    "next and react declared in dependencies",
    !!(deps.next && deps.react && deps["react-dom"]),
    deps.next && deps.react ? "next + react present" : "Check next/react/react-dom in dependencies",
  );

  add(
    40,
    "Project Structure",
    "proxy.ts for dev routing (Next 16 / Contact360 pattern)",
    exists(path.join(ROOT, "proxy.ts")),
    exists(path.join(ROOT, "proxy.ts"))
      ? "proxy.ts present"
      : "proxy.ts missing (optional for this template)",
    exists(path.join(ROOT, "proxy.ts")) ? "info" : "warning",
  );

  // —— Styling / CSS (custom c360-* layers, no Tailwind) ——
  const globalsPath = path.join(ROOT, "app", "globals.css");
  const globalsText = readText(globalsPath);
  const globalsOk =
    exists(globalsPath) &&
    globalsText.includes("@import") &&
    globalsText.includes("core.css") &&
    globalsText.includes("components.css");
  add(
    41,
    "Styling / CSS",
    "app/globals.css exists and imports core + components layers",
    globalsOk,
    globalsOk ? "globals.css chains design-system layers" : "Fix app/globals.css @import chain",
  );

  const compBarrel = path.join(ROOT, "app", "css", "components.css");
  const compBarrelText = readText(compBarrel);
  const compImports = (compBarrelText.match(/@import\s+["']\.\/components\//g) || []).length;
  add(
    42,
    "Styling / CSS",
    "app/css/components.css barrels numbered partials (>=10 @import ./components/)",
    exists(compBarrel) && compImports >= 10,
    exists(compBarrel) ? `${compImports} partial @imports` : "components.css missing",
  );

  const tailwindConfigs = [
    "tailwind.config.js",
    "tailwind.config.ts",
    "tailwind.config.mjs",
  ].filter((n) => exists(path.join(ROOT, n)));
  add(
    43,
    "Styling / CSS",
    "No Tailwind config at app root (custom CSS policy)",
    tailwindConfigs.length === 0,
    tailwindConfigs.length === 0
      ? "No tailwind.config.* (expected)"
      : `Unexpected Tailwind config: ${tailwindConfigs.join(", ")} — remove or document exception`,
    tailwindConfigs.length === 0 ? "info" : "warning",
  );

  const coreCss = path.join(ROOT, "app", "css", "core.css");
  add(
    44,
    "Styling / CSS",
    "app/css/core.css design tokens present",
    exists(coreCss) && readText(coreCss).includes("--c360-"),
    exists(coreCss) ? "core.css with --c360-* variables" : "core.css missing",
  );

  const inlineStyleFiles = countSrcFilesWithInlineStyle();
  const maxInline =
    typeof config.max_inline_style_files === "number" && config.max_inline_style_files >= 0
      ? config.max_inline_style_files
      : 30;
  const inlineOk = inlineStyleFiles <= maxInline;
  add(
    45,
    "Styling / CSS",
    `src/ files with inline style={{ }} at or below threshold (${maxInline}; config max_inline_style_files)`,
    inlineOk,
    inlineOk
      ? `${inlineStyleFiles} file(s) with style={{ (limit ${maxInline})`
      : `${inlineStyleFiles} file(s) exceed limit ${maxInline} — prefer classes / --c360-* (see README Styling / CSS)`,
    inlineOk ? "info" : "warning",
  );

  const co = (tsconfig && tsconfig.compilerOptions) || {};
  const pathsObj = co.paths && typeof co.paths === "object" ? co.paths : {};
  const hasAtAlias = Object.keys(pathsObj).some((k) => k === "@/*" || k.startsWith("@/"));

  // —— TypeScript Discipline ——
  add(
    46,
    "TypeScript Discipline",
    "tsconfig.json enables noUnusedLocals",
    co.noUnusedLocals === true,
    co.noUnusedLocals === true ? "noUnusedLocals: true" : "Set noUnusedLocals: true",
    co.noUnusedLocals === true ? "info" : "warning",
  );
  add(
    47,
    "TypeScript Discipline",
    "tsconfig.json enables noUnusedParameters",
    co.noUnusedParameters === true,
    co.noUnusedParameters === true ? "noUnusedParameters: true" : "Set noUnusedParameters: true",
    co.noUnusedParameters === true ? "info" : "warning",
  );
  add(
    48,
    "TypeScript Discipline",
    "tsconfig.json enables noImplicitReturns",
    co.noImplicitReturns === true,
    co.noImplicitReturns === true ? "noImplicitReturns: true" : "Set noImplicitReturns: true",
    co.noImplicitReturns === true ? "info" : "warning",
  );
  add(
    49,
    "TypeScript Discipline",
    "tsconfig.json enables noFallthroughCasesInSwitch",
    co.noFallthroughCasesInSwitch === true,
    co.noFallthroughCasesInSwitch === true
      ? "noFallthroughCasesInSwitch: true"
      : "Set noFallthroughCasesInSwitch: true",
    co.noFallthroughCasesInSwitch === true ? "info" : "warning",
  );
  add(
    50,
    "TypeScript Discipline",
    'tsconfig path alias "@/*" (or "@/…") defined',
    hasAtAlias,
    hasAtAlias ? "paths include @/*" : 'Add paths: { "@/*": ["./src/*"] }',
    hasAtAlias ? "info" : "warning",
  );

  const maxAny =
    typeof config.max_any_count === "number" && config.max_any_count >= 0
      ? config.max_any_count
      : 20;
  const anyCount = countAnyAnnotationsInSrc();
  const anyOk = anyCount <= maxAny;
  add(
    51,
    "TypeScript Discipline",
    `: any / as any / any[] count in src/ (excl. graphql/generated) ≤ ${maxAny} (config max_any_count)`,
    anyOk,
    anyOk
      ? `${anyCount} match(es) (limit ${maxAny})`
      : `${anyCount} match(es) exceed ${maxAny} — narrow types`,
    anyOk ? "info" : "warning",
  );

  const typesDir = path.join(ROOT, "src", "types");
  add(
    52,
    "TypeScript Discipline",
    "src/types/ shared type definitions directory exists",
    exists(typesDir) && fs.statSync(typesDir).isDirectory(),
    exists(typesDir) ? "src/types/ present" : "Add src/types/ for shared types",
  );

  // —— Code Architecture ——
  const graphqlServicesDir = path.join(ROOT, "src", "services", "graphql");
  const serviceFiles = exists(graphqlServicesDir)
    ? fs.readdirSync(graphqlServicesDir).filter((f) => f.endsWith("Service.ts"))
    : [];
  add(
    53,
    "Code Architecture",
    "src/services/graphql/ contains domain *Service.ts files",
    serviceFiles.length >= 3,
    serviceFiles.length >= 3
      ? `${serviceFiles.length} *Service.ts files`
      : `Only ${serviceFiles.length} *Service.ts — add feature services`,
    serviceFiles.length >= 3 ? "info" : "warning",
  );

  add(
    54,
    "Code Architecture",
    "src/hooks/ directory for custom hooks",
    exists(path.join(ROOT, "src", "hooks")) && fs.statSync(path.join(ROOT, "src", "hooks")).isDirectory(),
    exists(path.join(ROOT, "src", "hooks")) ? "src/hooks/ present" : "Add src/hooks/",
  );

  add(
    55,
    "Code Architecture",
    "src/context/ for global cross-cutting React state",
    exists(path.join(ROOT, "src", "context")) && fs.statSync(path.join(ROOT, "src", "context")).isDirectory(),
    exists(path.join(ROOT, "src", "context")) ? "src/context/ present" : "Add src/context/",
  );

  const featureDir = path.join(ROOT, "src", "components", "feature");
  let featureSubdirs = 0;
  if (exists(featureDir) && fs.statSync(featureDir).isDirectory()) {
    featureSubdirs = fs.readdirSync(featureDir, { withFileTypes: true }).filter((d) => d.isDirectory()).length;
  }
  add(
    56,
    "Code Architecture",
    "src/components/feature/ groups UI by domain (multiple subfolders)",
    featureSubdirs >= 5,
    featureSubdirs >= 5
      ? `${featureSubdirs} feature subfolders`
      : `Only ${featureSubdirs} feature subfolders — prefer domain-based structure`,
    featureSubdirs >= 5 ? "info" : "warning",
  );

  const svcBarrel = path.join(ROOT, "src", "services", "graphql", "index.ts");
  add(
    57,
    "Code Architecture",
    "src/services/graphql/index.ts barrel re-exports services",
    exists(svcBarrel),
    exists(svcBarrel) ? "Barrel present" : "Add index.ts barrel in services/graphql/",
  );

  const maxLogs =
    typeof config.max_console_logs === "number" && config.max_console_logs >= 0
      ? config.max_console_logs
      : 10;
  const logCount = countConsoleLogsInSrc();
  const logsOk = logCount <= maxLogs;
  add(
    58,
    "Code Architecture",
    `console.log( occurrences in src/ ≤ ${maxLogs} (config max_console_logs)`,
    logsOk,
    logsOk
      ? `${logCount} console.log (limit ${maxLogs})`
      : `${logCount} console.log exceed ${maxLogs} — remove or use a logger`,
    logsOk ? "info" : "warning",
  );

  const lsAllow = Array.isArray(config.localstorage_allow_files) ? config.localstorage_allow_files : [];
  const lsHits = findLocalStorageOutsideTokenManager(lsAllow);
  add(
    59,
    "Code Architecture",
    "localStorage only in tokenManager.ts (+ optional localstorage_allow_files in config)",
    lsHits.length === 0,
    lsHits.length === 0
      ? lsAllow.length
        ? `OK (tokenManager + ${lsAllow.length} allowlisted file(s))`
        : "No localStorage outside tokenManager"
      : `localStorage also in: ${lsHits.join(", ")} — allowlist in .next-checker-config.json or consolidate storage`,
    lsHits.length === 0 ? "info" : "warning",
  );

  // —— GraphQL & API Contract ——
  const genTypes = path.join(ROOT, "src", "graphql", "generated", "types.ts");
  add(
    60,
    "GraphQL & API Contract",
    "src/graphql/generated/types.ts (codegen output) exists",
    exists(genTypes),
    exists(genTypes) ? "Generated types present" : "Run npm run codegen",
  );

  add(
    61,
    "GraphQL & API Contract",
    'package.json defines "codegen" script',
    /codegen/.test(String(scripts.codegen || "")),
    scripts.codegen ? "codegen script present" : 'Add "codegen": "graphql-codegen --config codegen.ts"',
  );

  const opFiles = listGraphqlOperationFiles();
  add(
    62,
    "GraphQL & API Contract",
    "src/graphql/*Operations.ts files colocate GraphQL operations",
    opFiles.length >= 1,
    opFiles.length >= 1 ? `${opFiles.length} *Operations.ts files` : "Add *Operations.ts next to generated types",
  );

  const gqlClientPath = path.join(ROOT, "src", "lib", "graphqlClient.ts");
  const gqlClientText = readText(gqlClientPath);
  const exportsParseError =
    exists(gqlClientPath) &&
    /\bexport\s+function\s+parseGraphQLError\b/.test(gqlClientText);
  add(
    63,
    "GraphQL & API Contract",
    "graphqlClient.ts exports parseGraphQLError (centralized API errors)",
    exportsParseError,
    exportsParseError ? "parseGraphQLError exported" : "Export parseGraphQLError from graphqlClient.ts",
  );

  const tokenMgrPath = path.join(ROOT, "src", "lib", "tokenManager.ts");
  add(
    64,
    "GraphQL & API Contract",
    "src/lib/tokenManager.ts isolates JWT storage",
    exists(tokenMgrPath),
    exists(tokenMgrPath) ? "tokenManager.ts present" : "Add tokenManager for tokens",
  );

  // —— Auth & Security (client) ——
  add(
    65,
    "Security",
    "src/context/AuthContext.tsx exists",
    exists(path.join(ROOT, "src", "context", "AuthContext.tsx")),
    exists(path.join(ROOT, "src", "context", "AuthContext.tsx")) ? "AuthContext present" : "Add AuthContext",
  );

  add(
    66,
    "Security",
    "src/context/RoleContext.tsx exists (RBAC / plan features)",
    exists(path.join(ROOT, "src", "context", "RoleContext.tsx")),
    exists(path.join(ROOT, "src", "context", "RoleContext.tsx")) ? "RoleContext present" : "Add RoleContext",
  );

  const envOutside = findProcessEnvOutsideConfig();
  add(
    67,
    "Security",
    "process.env used only in src/lib/config.ts (centralized public config)",
    envOutside.length === 0,
    envOutside.length === 0
      ? "No process.env outside config.ts in src/"
      : `process.env in: ${envOutside.join(", ")} — read via config.ts`,
    envOutside.length === 0 ? "info" : "warning",
  );

  add(
    68,
    "Security",
    "src/lib/featureAccess.ts for plan / feature gating",
    exists(path.join(ROOT, "src", "lib", "featureAccess.ts")),
    exists(path.join(ROOT, "src", "lib", "featureAccess.ts")) ? "featureAccess.ts present" : "Add featureAccess helpers",
  );

  const envEx = exists(path.join(ROOT, ".env.example")) ? readText(path.join(ROOT, ".env.example")) : "";
  const envExOk =
    exists(path.join(ROOT, ".env.example")) &&
    /NEXT_PUBLIC_/i.test(envEx) &&
    (/API_URL|GRAPHQL/i.test(envEx) || /api\.contact360/i.test(envEx));
  add(
    69,
    "Security",
    ".env.example documents NEXT_PUBLIC_* and API/GraphQL URLs",
    envExOk,
    envExOk ? ".env.example covers API/GraphQL + NEXT_PUBLIC_" : "Expand .env.example",
    envExOk ? "info" : "warning",
  );

  // —— Error Handling & UX ——
  add(
    70,
    "Error Handling & UX",
    "parseGraphQLError defined for consistent GraphQL error shape",
    exportsParseError,
    exportsParseError ? "parseGraphQLError present" : "Add parseGraphQLError in graphqlClient.ts",
  );

  add(
    71,
    "Error Handling & UX",
    "sonner toast library in dependencies (user feedback)",
    !!deps.sonner,
    deps.sonner ? `sonner ${deps.sonner}` : "Add sonner for toasts",
  );

  add(
    72,
    "Error Handling & UX",
    "src/components/shared/DataState.tsx for loading/empty/error states",
    exists(path.join(ROOT, "src", "components", "shared", "DataState.tsx")),
    exists(path.join(ROOT, "src", "components", "shared", "DataState.tsx")) ? "DataState present" : "Add DataState",
  );

  add(
    73,
    "Error Handling & UX",
    "src/components/shared/Skeleton.tsx for loading placeholders",
    exists(path.join(ROOT, "src", "components", "shared", "Skeleton.tsx")),
    exists(path.join(ROOT, "src", "components", "shared", "Skeleton.tsx")) ? "Skeleton present" : "Add Skeleton",
  );

  // —— Testing Depth ——
  const requireCov = config.require_coverage_script === true;
  const hasCovScript = /vitest/.test(String(scripts["test:coverage"] || ""));
  add(
    74,
    "Testing",
    'package.json defines test:coverage (Vitest coverage)',
    requireCov ? hasCovScript : hasCovScript || true,
    hasCovScript
      ? "test:coverage present"
      : requireCov
        ? 'Add "test:coverage": "vitest run --coverage"'
        : "Optional test:coverage (set require_coverage_script in config)",
    hasCovScript ? "info" : requireCov ? "warning" : "warning",
  );

  const prePush = String(scripts["pre-push"] || "");
  const prePushOk =
    /typecheck/.test(prePush) && /lint/.test(prePush) && /test/.test(prePush);
  add(
    75,
    "Testing",
    "pre-push script runs typecheck, lint, and test",
    prePushOk,
    prePushOk ? "pre-push chains typecheck + lint + test" : "Align pre-push with quality gates",
    prePushOk ? "info" : "warning",
  );

  const ciScript = String(scripts.ci || "");
  const ciOk =
    /lint/.test(ciScript) &&
    /typecheck/.test(ciScript) &&
    /test/.test(ciScript) &&
    /build/.test(ciScript);
  add(
    76,
    "Testing",
    "ci script runs lint, typecheck, test, and build",
    ciOk,
    ciOk ? "ci script covers core gates" : "Extend npm run ci",
    ciOk ? "info" : "warning",
  );

  const graphqlTests = walkDir(path.join(ROOT, "src", "graphql"), []).filter(
    (p) =>
      p.endsWith(".test.ts") ||
      p.endsWith(".test.tsx") ||
      p.endsWith(".spec.ts") ||
      p.endsWith(".spec.tsx"),
  );
  add(
    77,
    "Testing",
    "Colocated tests under src/graphql/ (contract / operation tests)",
    graphqlTests.length >= 1,
    graphqlTests.length >= 1
      ? `${graphqlTests.length} test file(s) in src/graphql/`
      : "Add e.g. graphql.contracts.test.ts",
    graphqlTests.length >= 1 ? "info" : "warning",
  );

  const e2eSpecs = listE2eSpecFiles();
  add(
    78,
    "Testing",
    "e2e/ contains at least one Playwright spec",
    e2eSpecs.length >= 1,
    e2eSpecs.length >= 1 ? `${e2eSpecs.length} spec(s)` : "Add e2e/*.spec.ts",
    e2eSpecs.length >= 1 ? "info" : "warning",
  );

  // —— Performance & DX ——
  add(
    79,
    "Performance",
    "build:analyze script for bundle analysis",
    /analyze|ANALYZE/.test(String(scripts["build:analyze"] || "")),
    scripts["build:analyze"] ? "build:analyze present" : "Add ANALYZE=true next build",
    /analyze|ANALYZE/.test(String(scripts["build:analyze"] || "")) ? "info" : "warning",
  );

  add(
    80,
    "Performance",
    "@tanstack/react-virtual for large lists",
    !!deps["@tanstack/react-virtual"],
    deps["@tanstack/react-virtual"]
      ? `react-virtual ${deps["@tanstack/react-virtual"]}`
      : "Add @tanstack/react-virtual for long lists",
    deps["@tanstack/react-virtual"] ? "info" : "warning",
  );

  add(
    81,
    "Performance",
    "web-vitals dependency for client metrics",
    !!deps["web-vitals"],
    deps["web-vitals"] ? `web-vitals ${deps["web-vitals"]}` : "Add web-vitals",
    deps["web-vitals"] ? "info" : "warning",
  );

  add(
    82,
    "Performance",
    "clean script removes .next / build artifacts",
    /rimraf|rm\s|clean/.test(String(scripts.clean || "")),
    scripts.clean ? "clean script present" : "Add clean script",
    scripts.clean ? "info" : "warning",
  );

  // —— CI / DevOps ——
  const huskyPrePush = path.join(ROOT, ".husky", "pre-push");
  add(
    83,
    "Deployment",
    ".husky/pre-push hook file exists",
    exists(huskyPrePush),
    exists(huskyPrePush) ? ".husky/pre-push present" : "Add .husky/pre-push running npm run pre-push",
    exists(huskyPrePush) ? "info" : "warning",
  );

  add(
    84,
    "Deployment",
    "lint-staged configured in package.json",
    !!pkg["lint-staged"],
    pkg["lint-staged"] ? "lint-staged present" : "Optional lint-staged",
    pkg["lint-staged"] ? "info" : "warning",
  );

  const gitignoreText = readText(path.join(ROOT, ".gitignore"));
  add(
    85,
    "Deployment",
    ".gitignore excludes reports/ (generated checker reports)",
    gitignoreText.includes("reports/"),
    gitignoreText.includes("reports/") ? "reports/ ignored" : "Add reports/ to .gitignore",
  );

  const requireCiBp = config.require_ci_script === true;
  const ciHasBp = /check:best-practices/.test(ciScript);
  add(
    86,
    "Deployment",
    "ci script includes check:best-practices",
    requireCiBp ? ciHasBp : ciHasBp || true,
    ciHasBp
      ? "ci runs check:best-practices"
      : requireCiBp
        ? "Add npm run check:best-practices to ci"
        : "Optional (set require_ci_script in config)",
    ciHasBp ? "info" : requireCiBp ? "warning" : "warning",
  );

  return results;
}

function applyConfigFilters(results, config) {
  const ignore = new Set(config.ignore_points || []);
  const skipCats = (config.skip_categories || []).map((s) => String(s).toLowerCase());
  return results.filter((r) => {
    if (ignore.has(r.point_number)) return false;
    if (skipCats.length) {
      const cat = r.category.toLowerCase();
      if (skipCats.some((sc) => cat.includes(sc))) return false;
    }
    return true;
  });
}

function filterByCategory(results, categoryArg) {
  if (!categoryArg) return results;
  const q = categoryArg.toLowerCase();
  return results.filter((r) => r.category.toLowerCase().includes(q));
}

function summarize(results) {
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  const score = total > 0 ? Math.round((passed / total) * 1000) / 10 : 0;

  const categories = {};
  for (const r of results) {
    if (!categories[r.category]) {
      categories[r.category] = { passed: 0, total: 0 };
    }
    categories[r.category].total++;
    if (r.passed) categories[r.category].passed++;
  }

  const catOut = {};
  for (const [k, v] of Object.entries(categories)) {
    const pct = v.total > 0 ? Math.round((v.passed / v.total) * 1000) / 10 : 0;
    catOut[k] = { passed: v.passed, total: v.total, percentage: pct };
  }

  return {
    summary: { total_points: total, passed, failed, score },
    categories: catOut,
    results,
  };
}

function main() {
  const args = parseArgs(process.argv);
  const config = loadConfig();
  let results = runAllChecks({ config });
  results = applyConfigFilters(results, config);
  results = filterByCategory(results, args.category);
  const report = summarize(results);

  const lines = [];
  const log = (s = "") => {
    lines.push(s);
    console.log(s);
  };

  if (args.format === "text" || args.format === "both") {
    log("");
    log("=".repeat(70));
    log("Next.js Best Practices Check Summary");
    log("=".repeat(70));
    log(`Project root: ${ROOT}`);
    if (args.category) log(`Category filter: ${args.category}`);
    log(`Total points: ${report.summary.total_points}`);
    log(`Passed: ${report.summary.passed}`);
    log(`Failed: ${report.summary.failed}`);
    log(`Score: ${report.summary.score}%`);
    log("");
    for (const [category, data] of Object.entries(report.categories)) {
      const pct = data.percentage;
      log(`${category}: ${data.passed}/${data.total} passed (${pct}%)`);
    }
    log("");
    if (report.summary.score >= args.threshold) {
      log(`Codebase meets best practices threshold (${args.threshold}%+)`);
    } else {
      log(`Codebase below threshold (${args.threshold}%); review failed checks above`);
    }
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    ...report,
  };

  const writeJson = args.format === "json" || args.format === "both";
  if (writeJson) {
    let outPath = args.output;
    if (!outPath) {
      const dir = path.join(ROOT, "reports");
      if (!exists(dir)) fs.mkdirSync(dir, { recursive: true });
      const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      outPath = path.join(dir, `check_report_${stamp}.json`);
    } else {
      const parent = path.dirname(path.resolve(ROOT, outPath));
      if (!exists(parent)) fs.mkdirSync(parent, { recursive: true });
      outPath = path.resolve(ROOT, outPath);
    }
    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");
    if (args.format === "json") {
      console.log(JSON.stringify(payload, null, 2));
    } else {
      console.log(`\nReport saved to: ${outPath}`);
    }
  }

  const ok = report.summary.score >= args.threshold || report.summary.total_points === 0;
  if (!args.noFail && !ok) {
    process.exit(1);
  }
}

main();
