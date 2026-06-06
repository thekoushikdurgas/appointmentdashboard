/// <reference types="vitest/globals" />

describe("resolveGraphqlUrl", () => {
  const origEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...origEnv };
  });

  afterEach(() => {
    process.env = origEnv;
    vi.unstubAllGlobals();
  });

  async function load() {
    const mod = await import("./config");
    return mod.resolveGraphqlUrl;
  }

  it("uses explicit NEXT_PUBLIC_GRAPHQL_URL when set", async () => {
    process.env.NEXT_PUBLIC_GRAPHQL_URL = "https://custom.example/graphql/";
    const resolveGraphqlUrl = await load();
    expect(resolveGraphqlUrl()).toBe("https://custom.example/graphql");
  });

  it("uses same-origin /graphql in the browser during development", async () => {
    process.env.NODE_ENV = "development";
    delete process.env.NEXT_PUBLIC_GRAPHQL_URL;
    vi.stubGlobal("window", { location: { origin: "http://localhost:3000" } });
    const resolveGraphqlUrl = await load();
    expect(resolveGraphqlUrl()).toBe("http://localhost:3000/graphql");
  });

  it("uses GRAPHQL_UPSTREAM_URL on the server during development", async () => {
    process.env.NODE_ENV = "development";
    delete process.env.NEXT_PUBLIC_GRAPHQL_URL;
    process.env.GRAPHQL_UPSTREAM_URL = "https://api.contact360.io";
    const resolveGraphqlUrl = await load();
    expect(resolveGraphqlUrl()).toBe("https://api.contact360.io/graphql");
  });

  it("uses API_URL/graphql in production", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.NEXT_PUBLIC_GRAPHQL_URL;
    process.env.NEXT_PUBLIC_API_URL = "https://api.contact360.io";
    const resolveGraphqlUrl = await load();
    expect(resolveGraphqlUrl()).toBe("https://api.contact360.io/graphql");
  });
});
