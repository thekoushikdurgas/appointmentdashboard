import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  compress: true,
  poweredByHeader: false,
  devIndicators: false,

  async redirects() {
    return [
      { source: "/favicon.ico", destination: "/favicon.svg", permanent: false },
      { source: "/finder", destination: "/email", permanent: false },
      { source: "/verifier", destination: "/email", permanent: false },
    ];
  },

  /** Dev-only: proxy GraphQL through Next so Origin is localhost (no browser CORS). */
  async rewrites() {
    if (process.env.NODE_ENV !== "development") {
      return [];
    }
    let upstream = (
      process.env.GRAPHQL_UPSTREAM_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "https://api.contact360.io"
    ).replace(/\/$/, "");
    // Never rewrite /graphql to the Next dev server itself (causes proxy loop + ENOBUFS / 500).
    try {
      const u = new URL(upstream);
      const port = u.port || (u.protocol === "https:" ? "443" : "80");
      const loopback =
        u.hostname === "localhost" ||
        u.hostname === "127.0.0.1" ||
        u.hostname === "::1";
      if (loopback && port === "3000") {
        // eslint-disable-next-line no-console -- dev-only misconfiguration guard
        console.warn(
          "[next.config] GRAPHQL_UPSTREAM_URL / NEXT_PUBLIC_API_URL must not target :3000 (Next). Using http://127.0.0.1:8000 for GraphQL upstream.",
        );
        upstream = "http://127.0.0.1:8000";
      }
    } catch {
      /* keep upstream string */
    }
    return [{ source: "/graphql", destination: `${upstream}/graphql` }];
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ui-avatars.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
    /**
     * Dev rewrites proxy `/graphql` → upstream. Default proxy timeout is ~30s; slower
     * GraphQL responses caused ECONNRESET / "socket hang up". Match graphql client (5m).
     * @see https://github.com/vercel/next.js/issues/36251
     */
    proxyTimeout: 300_000,
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  modularizeImports: {
    "lucide-react": {
      transform: "lucide-react/dist/esm/icons/{{kebabCase member}}",
    },
  },
};

export default nextConfig;
