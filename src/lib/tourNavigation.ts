export function routeMatches(
  pathname: string,
  route: string,
  mode: "exact" | "prefix" = "prefix",
): boolean {
  if (mode === "exact") return pathname === route;
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function waitForPath(
  route: string,
  mode: "exact" | "prefix" = "prefix",
  timeoutMs = 8000,
  intervalMs = 80,
): Promise<boolean> {
  return new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      if (routeMatches(window.location.pathname, route, mode)) {
        resolve(true);
        return;
      }
      if (Date.now() - start >= timeoutMs) {
        resolve(false);
        return;
      }
      window.setTimeout(tick, intervalMs);
    };
    tick();
  });
}

export function waitForSelector(
  selector: string,
  timeoutMs = 5000,
  intervalMs = 80,
): Promise<Element | null> {
  return new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      const el = document.querySelector(selector);
      if (el) {
        resolve(el);
        return;
      }
      if (Date.now() - start >= timeoutMs) {
        resolve(null);
        return;
      }
      window.setTimeout(tick, intervalMs);
    };
    tick();
  });
}

function rectsMatch(a: DOMRect, b: DOMRect, epsilon = 1): boolean {
  return (
    Math.abs(a.left - b.left) < epsilon &&
    Math.abs(a.top - b.top) < epsilon &&
    Math.abs(a.width - b.width) < epsilon &&
    Math.abs(a.height - b.height) < epsilon
  );
}

/** Wait until a target's layout rect stops changing (e.g. drawer slide-in). */
export function waitForRectStable(
  selector: string,
  timeoutMs = 1500,
  stableSamples = 4,
  intervalMs = 50,
): Promise<Element | null> {
  return new Promise((resolve) => {
    const start = Date.now();
    let lastRect: DOMRect | null = null;
    let stable = 0;

    const tick = () => {
      const el = document.querySelector(selector);
      if (!el) {
        if (Date.now() - start >= timeoutMs) {
          resolve(null);
          return;
        }
        window.setTimeout(tick, intervalMs);
        return;
      }

      const rect = el.getBoundingClientRect();
      if (lastRect && rectsMatch(rect, lastRect)) {
        stable += 1;
      } else {
        stable = 0;
      }
      lastRect = rect;

      if (stable >= stableSamples) {
        resolve(el);
        return;
      }
      if (Date.now() - start >= timeoutMs) {
        resolve(el);
        return;
      }
      window.setTimeout(tick, intervalMs);
    };

    tick();
  });
}
