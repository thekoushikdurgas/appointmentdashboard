/**
 * Infer coarse globe markers from hiring-signal job `location` strings (city/region/country).
 * Uses segment parsing + alias maps — not full geocoding.
 */

import type { LinkedInJobRow } from "@/hooks/useHiringSignals";

export interface JobGlobeMarker {
  id: string;
  location: [number, number];
  count: number;
  label: string;
}

export interface HiringJobGlobeAggregate {
  markers: JobGlobeMarker[];
  rows: { label: string; count: number }[];
  mappedCount: number;
  skippedCount: number;
}

interface RegionDef {
  label: string;
  lat: number;
  lng: number;
}

const US_CENTER: RegionDef = {
  label: "United States",
  lat: 39.8283,
  lng: -98.5795,
};

/** Canonical region label → centroid (duplicate labels merge on globe). */
const CANONICAL: Record<string, RegionDef> = {
  "United States": US_CENTER,
  "United Kingdom": { label: "United Kingdom", lat: 54.7024, lng: -3.2766 },
  Canada: { label: "Canada", lat: 56.1304, lng: -106.3468 },
  Germany: { label: "Germany", lat: 51.1657, lng: 10.4515 },
  France: { label: "France", lat: 46.6034, lng: 1.8883 },
  Netherlands: { label: "Netherlands", lat: 52.1326, lng: 5.2913 },
  India: { label: "India", lat: 22.3511, lng: 78.6677 },
  China: { label: "China", lat: 35.8617, lng: 104.1954 },
  Japan: { label: "Japan", lat: 36.2048, lng: 138.2529 },
  Australia: { label: "Australia", lat: -25.2744, lng: 133.7751 },
  Brazil: { label: "Brazil", lat: -14.235, lng: -51.9253 },
  Mexico: { label: "Mexico", lat: 23.6345, lng: -102.5528 },
  Singapore: { label: "Singapore", lat: 1.3521, lng: 103.8198 },
  Ireland: { label: "Ireland", lat: 53.4129, lng: -8.2439 },
  Spain: { label: "Spain", lat: 40.4637, lng: -3.7492 },
  Italy: { label: "Italy", lat: 41.8719, lng: 12.5674 },
  Poland: { label: "Poland", lat: 51.9194, lng: 19.1451 },
  Sweden: { label: "Sweden", lat: 60.1282, lng: 18.6435 },
  Switzerland: { label: "Switzerland", lat: 46.8182, lng: 8.2275 },
  "United Arab Emirates": {
    label: "United Arab Emirates",
    lat: 23.4241,
    lng: 53.8478,
  },
  Israel: { label: "Israel", lat: 31.0461, lng: 34.8516 },
  "South Korea": { label: "South Korea", lat: 35.9078, lng: 127.7669 },
  "South Africa": { label: "South Africa", lat: -30.5595, lng: 22.9375 },
  Russia: { label: "Russia", lat: 61.524, lng: 105.3188 },
  Turkey: { label: "Turkey", lat: 38.9637, lng: 35.2433 },
  Indonesia: { label: "Indonesia", lat: -0.7893, lng: 113.9213 },
  Philippines: { label: "Philippines", lat: 12.8797, lng: 121.774 },
  Vietnam: { label: "Vietnam", lat: 14.0583, lng: 108.2772 },
  Thailand: { label: "Thailand", lat: 15.87, lng: 100.9925 },
  Malaysia: { label: "Malaysia", lat: 4.2105, lng: 101.9758 },
  Pakistan: { label: "Pakistan", lat: 30.3753, lng: 69.3451 },
  Bangladesh: { label: "Bangladesh", lat: 23.685, lng: 90.3563 },
  Nigeria: { label: "Nigeria", lat: 9.082, lng: 8.6753 },
  Egypt: { label: "Egypt", lat: 26.8206, lng: 30.8025 },
  Argentina: { label: "Argentina", lat: -38.4161, lng: -63.6167 },
  Colombia: { label: "Colombia", lat: 4.5709, lng: -74.2973 },
  Chile: { label: "Chile", lat: -35.6751, lng: -71.543 },
  "New Zealand": { label: "New Zealand", lat: -40.9006, lng: 174.886 },
  Portugal: { label: "Portugal", lat: 39.3999, lng: -8.2245 },
  Belgium: { label: "Belgium", lat: 50.5039, lng: 4.4699 },
  Austria: { label: "Austria", lat: 47.5162, lng: 14.5501 },
  Norway: { label: "Norway", lat: 60.472, lng: 8.4689 },
  Denmark: { label: "Denmark", lat: 56.2639, lng: 9.5018 },
  Finland: { label: "Finland", lat: 61.9241, lng: 25.7482 },
  "Czech Republic": { label: "Czech Republic", lat: 49.8175, lng: 15.473 },
  Romania: { label: "Romania", lat: 45.9432, lng: 24.9668 },
  Greece: { label: "Greece", lat: 39.0742, lng: 21.8243 },
  Ukraine: { label: "Ukraine", lat: 48.3794, lng: 31.1656 },
  "Saudi Arabia": { label: "Saudi Arabia", lat: 23.8859, lng: 45.0792 },
  Kenya: { label: "Kenya", lat: -0.0236, lng: 37.9062 },
};

/** US states / DC → US (avoid matching city names as countries). */
const US_STATE_CODES = new Set([
  "al",
  "ak",
  "az",
  "ar",
  "ca",
  "co",
  "ct",
  "de",
  "dc",
  "fl",
  "ga",
  "hi",
  "id",
  "il",
  "in",
  "ia",
  "ks",
  "ky",
  "la",
  "me",
  "md",
  "ma",
  "mi",
  "mn",
  "ms",
  "mo",
  "mt",
  "ne",
  "nv",
  "nh",
  "nj",
  "nm",
  "ny",
  "nc",
  "nd",
  "oh",
  "ok",
  "or",
  "pa",
  "ri",
  "sc",
  "sd",
  "tn",
  "tx",
  "ut",
  "vt",
  "va",
  "wa",
  "wv",
  "wi",
  "wy",
]);

const US_STATE_NAMES = new Set([
  "alabama",
  "alaska",
  "arizona",
  "arkansas",
  "california",
  "colorado",
  "connecticut",
  "delaware",
  "florida",
  "georgia",
  "hawaii",
  "idaho",
  "illinois",
  "indiana",
  "iowa",
  "kansas",
  "kentucky",
  "louisiana",
  "maine",
  "maryland",
  "massachusetts",
  "michigan",
  "minnesota",
  "mississippi",
  "missouri",
  "montana",
  "nebraska",
  "nevada",
  "new hampshire",
  "new jersey",
  "new mexico",
  "new york",
  "north carolina",
  "north dakota",
  "ohio",
  "oklahoma",
  "oregon",
  "pennsylvania",
  "rhode island",
  "south carolina",
  "south dakota",
  "tennessee",
  "texas",
  "utah",
  "vermont",
  "virginia",
  "washington",
  "west virginia",
  "wisconsin",
  "wyoming",
  "district of columbia",
]);

/** Map normalized segment text → canonical region label key in CANONICAL */
const SEGMENT_TO_LABEL: Record<string, keyof typeof CANONICAL> = {
  us: "United States",
  usa: "United States",
  "united states": "United States",
  america: "United States",
  uk: "United Kingdom",
  gb: "United Kingdom",
  "united kingdom": "United Kingdom",
  england: "United Kingdom",
  scotland: "United Kingdom",
  wales: "United Kingdom",
  canada: "Canada",
  germany: "Germany",
  deutschland: "Germany",
  france: "France",
  netherlands: "Netherlands",
  holland: "Netherlands",
  india: "India",
  china: "China",
  japan: "Japan",
  australia: "Australia",
  brazil: "Brazil",
  mexico: "Mexico",
  singapore: "Singapore",
  ireland: "Ireland",
  spain: "Spain",
  italy: "Italy",
  poland: "Poland",
  sweden: "Sweden",
  switzerland: "Switzerland",
  uae: "United Arab Emirates",
  israel: "Israel",
  korea: "South Korea",
  "south korea": "South Korea",
  "south africa": "South Africa",
  russia: "Russia",
  turkey: "Turkey",
  indonesia: "Indonesia",
  philippines: "Philippines",
  vietnam: "Vietnam",
  thailand: "Thailand",
  malaysia: "Malaysia",
  pakistan: "Pakistan",
  bangladesh: "Bangladesh",
  nigeria: "Nigeria",
  egypt: "Egypt",
  argentina: "Argentina",
  colombia: "Colombia",
  chile: "Chile",
  "new zealand": "New Zealand",
  portugal: "Portugal",
  belgium: "Belgium",
  austria: "Austria",
  norway: "Norway",
  denmark: "Denmark",
  finland: "Finland",
  "czech republic": "Czech Republic",
  czechia: "Czech Republic",
  romania: "Romania",
  greece: "Greece",
  ukraine: "Ukraine",
  "saudi arabia": "Saudi Arabia",
  kenya: "Kenya",
};

function normalizeSegment(s: string): string {
  return s.trim().toLowerCase().replace(/\.$/, "").replace(/\s+/g, " ");
}

/** Substring rules (longer phrases first in array order). */
const PHRASE_HINTS: Array<{ needle: string; label: keyof typeof CANONICAL }> = [
  { needle: "united kingdom", label: "United Kingdom" },
  { needle: "united states", label: "United States" },
  { needle: "united arab emirates", label: "United Arab Emirates" },
  { needle: "south korea", label: "South Korea" },
  { needle: "new zealand", label: "New Zealand" },
  { needle: "south africa", label: "South Africa" },
  { needle: "czech republic", label: "Czech Republic" },
  { needle: "saudi arabia", label: "Saudi Arabia" },
  { needle: "hong kong", label: "China" },
  { needle: "taiwan", label: "China" },
];

function inferRegionFromLocation(locationRaw: string): RegionDef | null {
  const raw = locationRaw?.trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (
    lower === "remote" ||
    lower.includes("worldwide") ||
    lower.includes("global")
  ) {
    return null;
  }

  for (const { needle, label } of PHRASE_HINTS) {
    if (lower.includes(needle)) return CANONICAL[label];
  }

  const parts = raw
    .split(",")
    .map((p) => normalizeSegment(p))
    .filter(Boolean);

  for (let i = parts.length - 1; i >= 0; i--) {
    const seg = parts[i];
    if (!seg) continue;

    const alias = SEGMENT_TO_LABEL[seg];
    if (alias) return CANONICAL[alias];

    if (US_STATE_NAMES.has(seg)) return US_CENTER;
    if (seg.length === 2 && US_STATE_CODES.has(seg)) return US_CENTER;

    const compact = seg.replace(/\s+/g, "");
    if (compact.length === 2 && US_STATE_CODES.has(compact.toLowerCase()))
      return US_CENTER;
  }

  return null;
}

export function aggregateHiringJobMarkers(
  jobs: Pick<LinkedInJobRow, "location" | "country">[],
): HiringJobGlobeAggregate {
  const counts = new Map<string, { def: RegionDef; n: number }>();

  let skippedCount = 0;
  for (const job of jobs) {
    const loc = (job.location ?? "").trim();
    const ctry = (job.country ?? "").trim();
    let region = inferRegionFromLocation(loc);
    if (!region && ctry) {
      region = inferRegionFromLocation(ctry);
    }
    if (!region) {
      skippedCount += 1;
      continue;
    }
    const cur = counts.get(region.label);
    if (cur) cur.n += 1;
    else counts.set(region.label, { def: region, n: 1 });
  }

  const rows = [...counts.entries()]
    .map(([label, v]) => ({ label, count: v.n }))
    .sort((a, b) => b.count - a.count);

  const markers: JobGlobeMarker[] = rows.map((r, i) => {
    const def = counts.get(r.label)?.def;
    const lat = def?.lat ?? 0;
    const lng = def?.lng ?? 0;
    return {
      id: `globe-${i}-${r.label.replace(/\s+/g, "-").slice(0, 24)}`,
      location: [lat, lng] as [number, number],
      count: r.count,
      label: r.label,
    };
  });

  const mappedCount = jobs.length - skippedCount;

  return {
    markers,
    rows,
    mappedCount,
    skippedCount,
  };
}
