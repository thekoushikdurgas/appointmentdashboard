"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import createGlobe from "cobe";
import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/context/ThemeContext";
import type { LinkedInJobRow } from "@/hooks/useHiringSignals";
import { aggregateHiringJobMarkers } from "@/lib/geo/hiringJobLocationMarkers";
import { ROUTES } from "@/lib/constants";

/** COBE RGB tuples (0–1) — primary accent */
const PRIMARY_MARK: [number, number, number] = [47 / 255, 76 / 255, 221 / 255];
const GLOW_LIGHT: [number, number, number] = [0.94, 0.93, 0.91];
const GLOW_DARK: [number, number, number] = [0.12, 0.14, 0.22];
const BASE_LIGHT: [number, number, number] = [1, 1, 1];
const BASE_DARK: [number, number, number] = [0.08, 0.1, 0.16];

const GLOBE_SPEED = 0.0028;

export interface HiringSignalJobsGlobeProps {
  jobs: LinkedInJobRow[];
  loading?: boolean;
  /**
   * When set, the map is built from this many rows max (client hard cap) while the
   * filtered index may have more matches — avoids silent truncation in the UI.
   */
  fetchCappedAt?: number | null;
}

export function HiringSignalJobsGlobe({
  jobs,
  loading = false,
  fetchCappedAt = null,
}: HiringSignalJobsGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null);
  const dragOffset = useRef({ phi: 0, theta: 0 });
  const phiOffsetRef = useRef(0);
  const thetaOffsetRef = useRef(0);
  const isPausedRef = useRef(false);
  const { theme } = useTheme();

  const aggregate = useMemo(() => aggregateHiringJobMarkers(jobs), [jobs]);

  const maxCount = useMemo(() => {
    if (aggregate.markers.length === 0) return 1;
    return Math.max(...aggregate.markers.map((m) => m.count));
  }, [aggregate.markers]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerInteracting.current = { x: e.clientX, y: e.clientY };
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
    isPausedRef.current = true;
  }, []);

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current !== null) {
      phiOffsetRef.current += dragOffset.current.phi;
      thetaOffsetRef.current += dragOffset.current.theta;
      dragOffset.current = { phi: 0, theta: 0 };
    }
    pointerInteracting.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = "grab";
    isPausedRef.current = false;
  }, []);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (pointerInteracting.current !== null) {
        dragOffset.current = {
          phi: (e.clientX - pointerInteracting.current.x) / 300,
          theta: (e.clientY - pointerInteracting.current.y) / 1000,
        };
      }
    };
    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [handlePointerUp]);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    let globe: ReturnType<typeof createGlobe> | null = null;
    let animationId = 0;
    let cancelled = false;
    let phi = 0;
    let resizeObs: ResizeObserver | null = null;

    const dark = theme === "dark" ? 1 : 0;

    const cobeMarkers = aggregate.markers.map((m) => ({
      location: m.location,
      id: m.id,
      size: 0.03 + (m.count / maxCount) * 0.072,
      color: PRIMARY_MARK,
    }));

    function animateFrame() {
      if (cancelled) return;
      if (!isPausedRef.current) phi += GLOBE_SPEED;
      globe?.update({
        phi: phi + phiOffsetRef.current + dragOffset.current.phi,
        theta: 0.22 + thetaOffsetRef.current + dragOffset.current.theta,
      });
      animationId = requestAnimationFrame(animateFrame);
    }

    function mountGlobe(target: HTMLCanvasElement) {
      const width = target.offsetWidth;
      if (width === 0 || globe) return;

      globe = createGlobe(target, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        width,
        height: width,
        phi: 0,
        theta: 0.22,
        dark,
        diffuse: 1.55,
        mapSamples: 16000,
        mapBrightness: dark ? 7 : 10,
        baseColor: dark ? BASE_DARK : BASE_LIGHT,
        markerColor: PRIMARY_MARK,
        glowColor: dark ? GLOW_DARK : GLOW_LIGHT,
        markerElevation: 0.02,
        markers: cobeMarkers,
        arcs: [],
        arcColor: [0.18, 0.55, 0.95],
        arcWidth: 0.45,
        arcHeight: 0.22,
        opacity: dark ? 0.88 : 0.72,
      });

      animateFrame();
      requestAnimationFrame(() => {
        target.style.opacity = "1";
      });
    }

    if (canvasEl.offsetWidth > 0) {
      mountGlobe(canvasEl);
    } else {
      resizeObs = new ResizeObserver((entries) => {
        if (entries[0]?.contentRect.width > 0) {
          resizeObs?.disconnect();
          resizeObs = null;
          mountGlobe(canvasEl);
        }
      });
      resizeObs.observe(canvasEl);
    }

    return () => {
      cancelled = true;
      resizeObs?.disconnect();
      cancelAnimationFrame(animationId);
      globe?.destroy();
      canvasEl.style.opacity = "0";
    };
  }, [aggregate, maxCount, theme]);

  const subtitle = loading
    ? "Loading locations…"
    : aggregate.mappedCount === 0
      ? "No parseable locations in the current hiring-signal sample."
      : `${aggregate.mappedCount.toLocaleString()} jobs mapped to regions · drag to rotate`;

  const capNote =
    !loading && fetchCappedAt != null && fetchCappedAt > 0 ? (
      <p className="c360-dashboard-globe__cap-note" role="status">
        Map uses the first {fetchCappedAt.toLocaleString()} matching jobs
        (client limit); open Hiring signals for the full list or narrower
        filters.
      </p>
    ) : null;

  return (
    <Card
      className="c360-dashboard-hiring-globe-card"
      title={
        <span className="c360-dashboard-globe__title">
          <MapPin
            size={18}
            aria-hidden
            className="c360-dashboard-globe__title-icon"
          />
          Job locations
        </span>
      }
      subtitle="Hiring signals worldwide — same globe interaction as the dashboard map reference (drag to explore)."
      footer={
        <div className="c360-dashboard-globe__footer">
          <Button variant="secondary" size="sm" asChild>
            <Link href={ROUTES.HIRING_SIGNALS}>Open hiring signals</Link>
          </Button>
        </div>
      }
    >
      <div className="c360-dashboard-globe">
        <div className="c360-dashboard-globe__canvas-wrap">
          <canvas
            ref={canvasRef}
            className="c360-dashboard-globe__canvas"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            aria-label="Interactive globe of job locations"
          />
          <p className="c360-dashboard-globe__hint">{subtitle}</p>
          {capNote}
        </div>

        <aside
          className="c360-dashboard-globe__legend"
          aria-label="Region counts"
        >
          {loading ? (
            <div className="c360-dashboard-globe__legend-skeleton" aria-busy />
          ) : aggregate.rows.length === 0 ? (
            <p className="c360-dashboard-globe__empty">
              Ingest jobs with a location string (city, region, or country) to
              see pins on the globe.
            </p>
          ) : (
            <ol className="c360-dashboard-globe__list">
              {aggregate.rows.slice(0, 10).map((row, idx) => (
                <li key={row.label} className="c360-dashboard-globe__list-item">
                  <span className="c360-dashboard-globe__rank">{idx + 1}</span>
                  <span className="c360-dashboard-globe__region">
                    {row.label}
                  </span>
                  <span className="c360-dashboard-globe__count">
                    {row.count.toLocaleString()}
                  </span>
                </li>
              ))}
            </ol>
          )}
          {!loading && aggregate.skippedCount > 0 ? (
            <p className="c360-dashboard-globe__meta">
              {aggregate.skippedCount.toLocaleString()} rows without a matched
              region (remote / ambiguous).
            </p>
          ) : null}
        </aside>
      </div>
    </Card>
  );
}
