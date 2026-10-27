import { LatLon, Weather } from "./types";
import { address } from "./dom";

// ---------- URL-Parameter ----------
export type Opts = {
  adresse: string; lat?: number; lon?: number;
  wetter: boolean; temperatur: boolean; wind: boolean; zeit: boolean; textpos: string;
  objekte: string[]; kiosk: boolean; zoom: boolean; kompass: boolean; mondphase: boolean; mondalter?: number; bg: string; radius: number; animation: boolean; refresh: number;
  vorhersage: "aus" | "stunden" | "tage"; einheit: "celsius" | "fahrenheit"; sprache: "de" | "en"; testwetter: string; tageszeit: "auto" | "tag" | "nacht";
};

/** Auswählbare Kartenobjekte (URL: objekte=gleise,gewaesser,… | alle | keine). */
export const OBJEKTE = ["gleise", "gewaesser", "freizeit", "landnutzung", "strom", "hecken", "haltestellen"];
export const DEFAULT_ADDRESS = "Marienplatz, 80331 München, Deutschland";

export const ALIASES: Record<string, string> = { wetterdaten: "wetter", kios: "kiosk", address: "adresse", ort: "adresse", language: "sprache", lang: "sprache", unit: "einheit" };

export const TESTWETTER: Record<string, Partial<Weather>> = {
  klar: { code: 0, clouds: 5, rain: 0, wind: 8 }, heiter: { code: 1, clouds: 30, rain: 0 }, wolkig: { code: 2, clouds: 60, rain: 0 }, bedeckt: { code: 3, clouds: 95, rain: 0 },
  nebel: { code: 45, clouds: 90, rain: 0, wind: 3 }, nieselregen: { code: 51, clouds: 85, rain: .3 }, regen: { code: 63, clouds: 95, rain: 3 },
  gewitter: { code: 95, clouds: 98, rain: 6, wind: 28 }, schnee: { code: 73, clouds: 90, rain: 1, temperature: -2, feels: -5, wind: 12 }, wind: { code: 2, clouds: 45, rain: 0, wind: 42 },
};

export function bool(v: string | null, d: boolean) { if (v == null) return d; const s = v.trim().toLowerCase(); if (["true", "1", "ja", "yes", "an", "on", ""].includes(s)) return true; if (["false", "0", "nein", "no", "aus", "off"].includes(s)) return false; return d; }

function parseObjekte(v: string | null): string[] {
  if (v == null) return [...OBJEKTE]; const s = v.trim().toLowerCase();
  if (s === "" || s === "alle") return [...OBJEKTE]; if (["keine", "aus", "none", "0", "false"].includes(s)) return [];
  return OBJEKTE.filter(o => s.split(/[,;\s]+/).includes(o));
}

export function parseOpts(search: string): Opts {
  const raw = new URLSearchParams(search), q = new URLSearchParams();
  raw.forEach((v, k) => { k = k.toLowerCase(); q.set(ALIASES[k] ?? k, v); });
  const num = (k: string, d: number, lo: number, hi: number) => { const n = parseFloat((q.get(k) ?? "").replace(",", ".")); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d; };
  const kiosk = bool(q.get("kiosk"), false), la = parseFloat(q.get("lat") ?? ""), lo = parseFloat(q.get("lon") ?? "");
  const pick = <T extends string>(k: string, ok: T[], d: T): T => { const v = (q.get(k) ?? "").toLowerCase() as T; return ok.includes(v) ? v : d; };
  return {
    adresse: (q.get("adresse") ?? "").trim() || DEFAULT_ADDRESS,
    lat: Number.isFinite(la) && Number.isFinite(lo) ? la : undefined, lon: Number.isFinite(la) && Number.isFinite(lo) ? lo : undefined,
    wetter: bool(q.get("wetter"), false), temperatur: bool(q.get("temperatur"), true), wind: bool(q.get("wind"), true), zeit: bool(q.get("zeit"), false),
    textpos: pick("textpos", ["unten-links", "unten-rechts", "oben-links", "oben-rechts"], "unten-links"),
    objekte: parseObjekte(q.get("objekte")),
    kiosk, zoom: bool(q.get("zoom"), !kiosk), kompass: bool(q.get("kompass"), false), mondphase: bool(q.get("mondphase"), false), mondalter: Number.isFinite(parseFloat(q.get("mondalter") ?? "")) ? Math.max(0, Math.min(29.5, parseFloat(q.get("mondalter")!))) : undefined, bg: (q.get("bg") ?? "").trim().replace(/^#/, "").toLowerCase(),
    radius: Math.round(num("radius", 200, 100, 1500) / 10) * 10, animation: bool(q.get("animation"), !matchMedia("(prefers-reduced-motion: reduce)").matches), refresh: Math.round(num("refresh", 10, 0, 240)),
    vorhersage: pick("vorhersage", ["aus", "stunden", "tage"], "aus"), einheit: pick("einheit", ["celsius", "fahrenheit"], "celsius"), sprache: pick("sprache", ["de", "en"], "de"),
    testwetter: pick("testwetter", [...Object.keys(TESTWETTER), ""], ""), tageszeit: pick("tageszeit", ["auto", "tag", "nacht"], "auto"),
  };
}

export const opts: Opts = parseOpts(location.search);

export const KIOSK = opts.kiosk;

/** Baut die Link-Query aus den Optionen; Standardwerte werden weggelassen. */
export function buildQuery(o: Opts, useCoords: boolean, c: LatLon | null): string {
  const d = parseOpts(""), q = new URLSearchParams();
  if (useCoords && c) { q.set("lat", c.lat.toFixed(5)); q.set("lon", c.lon.toFixed(5)); } else if (o.adresse && o.adresse !== DEFAULT_ADDRESS || !c) q.set("adresse", o.adresse);
  const flags: (keyof Opts)[] = ["wetter", "temperatur", "wind", "zeit", "kiosk", "zoom", "kompass", "mondphase", "animation"];
  for (const k of flags) if (o[k] !== d[k]) q.set(k, String(o[k]));
  if (o.objekte.length !== OBJEKTE.length) q.set("objekte", o.objekte.length ? o.objekte.join(",") : "keine");
  for (const k of ["textpos", "bg", "radius", "refresh", "vorhersage", "einheit", "sprache", "testwetter", "tageszeit"] as (keyof Opts)[]) if (String(o[k]) !== String(d[k]) && String(o[k]) !== "") q.set(k, String(o[k]));
  return q.toString();
}

export const queryRadius = () => Math.round(opts.radius * 1.2);
