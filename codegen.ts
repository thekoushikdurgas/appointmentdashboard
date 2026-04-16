import type { CodegenConfig } from "@graphql-codegen/cli";

/**
 * Introspects the Strawberry gateway and emits TypeScript schema types.
 * Run with API up: `CODEGEN_SCHEMA_URL=https://api.contact360.io/graphql npm run codegen`
 */
const schema =
  process.env.CODEGEN_SCHEMA_URL ||
  process.env.NEXT_PUBLIC_GRAPHQL_URL ||
  "https://api.contact360.io/graphql";

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
};

export default config;
