import type { Lake, LatLon, Shape, Weather } from "./types";

/** Gemeinsamer, veränderlicher Zustand der App. */
export const state = {
  center: null as LatLon | null,
  weatherRaw: null as Weather | null,
  weatherNow: null as Weather | null,
  lastShapes: [] as Shape[],
  lastLakes: [] as Lake[],
  drawn: false,
  runId: 0,
};
