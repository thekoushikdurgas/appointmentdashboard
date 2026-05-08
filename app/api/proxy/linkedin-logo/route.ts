import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set(["media.licdn.com"]);

/**
 * Fetches LinkedIn CDN logos server-side so the browser loads same-origin URLs.
 * Avoids ERR_BLOCKED_BY_CLIENT (ad blockers) on direct media.licdn.com requests.
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  if (!raw?.trim()) {
    return NextResponse.json({ error: "missing url" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw.trim());
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  if (target.protocol !== "https:" || !ALLOWED_HOSTS.has(target.hostname)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  if (target.username || target.password) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 15_000);
  let upstream: Response;
  try {
    upstream = await fetch(target.toString(), {
      signal: ac.signal,
      headers: {
        Accept: "image/*",
        "User-Agent": "Contact360LogoProxy/1.0",
      },
      next: { revalidate: 86_400 },
    });
  } catch {
    clearTimeout(t);
    return NextResponse.json({ error: "fetch failed" }, { status: 502 });
  }
  clearTimeout(t);

  if (!upstream.ok) {
    return NextResponse.json(
      { error: "upstream", status: upstream.status },
      { status: upstream.status >= 500 ? 502 : upstream.status },
    );
  }

  const ct = upstream.headers.get("content-type") ?? "image/jpeg";
  if (!ct.startsWith("image/")) {
    return NextResponse.json({ error: "not an image" }, { status: 502 });
  }

  const buf = await upstream.arrayBuffer();
  return new NextResponse(buf, {
    headers: {
      "Content-Type": ct,
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
