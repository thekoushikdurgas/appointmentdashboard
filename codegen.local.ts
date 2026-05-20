import config from "./codegen";

/** Local API introspection (no public TLS). Start API on :8000 first. */
export default {
  ...config,
  schema: "http://127.0.0.1:8000/graphql",
};
