import type { CodegenConfig } from "@graphql-codegen/cli";

/**
 * Introspects the Strawberry gateway and emits TypeScript schema types.
 * Production URL requires Cloudflare **proxied** DNS (orange cloud); grey cloud + Origin CA
 * breaks TLS (`unable to verify the first certificate`).
 *
 * Local API: `CODEGEN_SCHEMA_URL=http://127.0.0.1:8000/graphql npm run codegen`
 * Or: `npm run codegen:local`
 */
/** Prefer explicit env; local default avoids TLS failures during dev introspection. */
const schema =
  process.env.CODEGEN_SCHEMA_URL ||
  process.env.NEXT_PUBLIC_GRAPHQL_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://api.contact360.io/graphql"
    : "http://127.0.0.1:8000/graphql");

const config: CodegenConfig = {
  schema,
  generates: {
    "src/graphql/generated/types.ts": {
      plugins: ["typescript"],
      config: {
        scalars: {
          BigInt: "string",
          JSON: "Record<string, unknown>",
          namingConvention: "keep",
        },
        enumsAsTypes: true,
        skipTypename: true,
      },
    },
  },
  hooks: {
    afterOneFileWrite: ["prettier --write"],
  },
};

export default config;
