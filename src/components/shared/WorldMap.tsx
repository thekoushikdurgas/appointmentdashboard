"use client";

import React, { useState, useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { CHART_COLORS, rgbaFromHex } from "@/lib/chartTheme";
import {
  countryBucketToNumericIso,
  normalizeCountryKey,
} from "@/lib/isoCountryCodes";
import { applyVars, useCSSVars } from "@/hooks/useCSSVars";

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

/** SVG geography paint for react-simple-maps Geography `style` prop (object passed by reference). */
function geographyInteractionStyle(count: number, intensity: number) {
  return {
    default: {
      fill:
        count > 0
          ? rgbaFromHex(CHART_COLORS.primary, intensity)
          : "var(--c360-bg)",
      stroke: "var(--c360-border)",
      strokeWidth: 0.5,
      outline: "none" as const,
    },
    hover: {
      fill:
        count > 0
          ? rgbaFromHex(CHART_COLORS.primary, Math.min(1, intensity + 0.2))
          : "var(--c360-bg-secondary)",
      stroke: "var(--c360-primary)",
      strokeWidth: 1,
      outline: "none" as const,
      cursor: "pointer" as const,
    },
    pressed: { outline: "none" as const },
  };
}

export interface CountryCount {
  /** ISO 3166-1 numeric code as string, e.g. "840" for US */
  id: string;
  /** Country name for tooltip */
  name: string;
  count: number;
  /** Connectra facet token for the `country` filter (e.g. `united states`). */
  filterValue: string;
}

interface WorldMapProps {
  data?: CountryCount[];
  height?: number;
  /** When set, clicking a country with contacts applies that cohort as a filter. */
  onCountrySelect?: (country: CountryCount) => void;
}

function resolveCountryForGeo(
  geo: { id: string | number; properties: { name?: string } },
  data: CountryCount[],
): CountryCount | null {
  const geoId = String(geo.id);
  const geoName =
    typeof geo.properties?.name === "string" ? geo.properties.name : "";
  const byId = data.find((d) => d.id === geoId);
  if (byId) return byId;
  const numericFromName = countryBucketToNumericIso(geoName);
  if (numericFromName) {
    const byNumeric = data.find((d) => d.id === numericFromName);
    if (byNumeric) return byNumeric;
  }
  const nameKey = normalizeCountryKey(geoName);
  return data.find((d) => normalizeCountryKey(d.name) === nameKey) ?? null;
}

export function WorldMap({
  data = [],
  height = 340,
  onCountrySelect,
}: WorldMapProps) {
  const [tooltip, setTooltip] = useState<{
    name: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  const countById = useMemo(() => {
    const m: Record<string, number> = {};
    for (const d of data) m[d.id] = d.count;
    return m;
  }, [data]);

  /** Fallback when topojson `geo.id` and stored numeric id differ slightly. */
  const countByNameKey = useMemo(() => {
    const m: Record<string, number> = {};
    for (const d of data) {
      m[normalizeCountryKey(d.name)] = d.count;
    }
    return m;
  }, [data]);

  const maxCount = useMemo(
    () => Math.max(1, ...data.map((d) => d.count)),
    [data],
  );

  const rootRef = useCSSVars<HTMLDivElement>({
    "--c360-world-map-h": `${height}px`,
  });

  return (
    <div ref={rootRef} className="c360-world-map">
      <div className="c360-world-map__map-wrap">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 130, center: [0, 20] }}
        >
          <ZoomableGroup zoom={1} center={[0, 20]}>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const geoName =
                    typeof geo.properties?.name === "string"
                      ? geo.properties.name
                      : "";
                  const numericFromName = countryBucketToNumericIso(geoName);
                  const count =
                    countById[String(geo.id)] ??
                    (numericFromName ? (countById[numericFromName] ?? 0) : 0) ??
                    countByNameKey[normalizeCountryKey(geoName)] ??
                    0;
                  const intensity =
                    count > 0 ? 0.15 + (count / maxCount) * 0.85 : 0;
                  const row =
                    count > 0 && onCountrySelect
                      ? resolveCountryForGeo(geo, data)
                      : null;
                  const clickable = !!row?.filterValue?.trim();
                  const geoStyle = geographyInteractionStyle(count, intensity);
                  const cursor = clickable ? "pointer" : "default";
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={(e: React.MouseEvent<SVGPathElement>) => {
                        setTooltip({
                          name: geo.properties.name,
                          count,
                          x: e.clientX,
                          y: e.clientY,
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      onClick={() => {
                        if (!onCountrySelect || !row?.filterValue?.trim())
                          return;
                        onCountrySelect(row);
                      }}
                      style={{
                        ...geoStyle,
                        default: { ...geoStyle.default, cursor },
                        hover: { ...geoStyle.hover, cursor },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="c360-world-map__tooltip"
          ref={(el) =>
            applyVars(el, {
              "--c360-map-tip-x": `${tooltip.x + 12}px`,
              "--c360-map-tip-y": `${tooltip.y - 10}px`,
            })
          }
        >
          <strong>{tooltip.name}</strong>
          {" — "}
          {tooltip.count > 0
            ? `${tooltip.count.toLocaleString()} contacts${
                onCountrySelect ? " · click to filter" : ""
              }`
            : "No contacts"}
        </div>
      )}

      {/* Legend */}
      <div className="c360-world-map__legend">
        <span>Low</span>
        {[0.15, 0.35, 0.55, 0.75, 1].map((o) => (
          <div
            key={o}
            className="c360-world-map__legend-swatch"
            ref={(el) => applyVars(el, { "--c360-map-legend-a": String(o) })}
          />
        ))}
        <span>High</span>
      </div>
    </div>
  );
}
