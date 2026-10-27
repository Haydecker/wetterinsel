import { Weather } from "../types";
import { TESTWETTER, opts } from "../options";

// ---------- Wetter: Texte, Einheiten, Testwetter ----------
export const LABELS: Record<string, Record<"de" | "en", string>> = {
  klar: { de: "Klar", en: "Clear" }, heiter: { de: "Heiter bis wolkig", en: "Partly cloudy" }, bedeckt: { de: "Bedeckt", en: "Overcast" }, nebel: { de: "Nebel", en: "Fog" },
  niesel: { de: "Nieselregen", en: "Drizzle" }, regen: { de: "Regen", en: "Rain" }, schnee: { de: "Schnee", en: "Snow" }, gewitter: { de: "Gewitter", en: "Thunderstorm" }, wechselhaft: { de: "Wechselhaft", en: "Changeable" },
  wind: { de: "Wind", en: "Wind" }, gefuehlt: { de: "Gefühlt", en: "Feels like" }, stand: { de: "Stand", en: "Updated" }, bewoelkung: { de: "Bewölkung", en: "Cloud cover" },
};

export const L = (k: string) => LABELS[k][opts.sprache];

export function labelWeather(code:number):string {
  if(code===0)return L("klar"); if([1,2].includes(code))return L("heiter"); if(code===3)return L("bedeckt");
  if([45,48].includes(code))return L("nebel"); if([51,53,55,56,57].includes(code))return L("niesel");
  if([61,63,65,66,67,80,81,82].includes(code))return L("regen"); if([71,73,75,77,85,86].includes(code))return L("schnee");
  if([95,96,99].includes(code))return L("gewitter"); return L("wechselhaft");
}

export function iconWeather(code:number,day:number):string {
  if([95,96,99].includes(code))return "⛈"; if([71,73,75,77,85,86].includes(code))return "❄";
  if([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code))return "🌧";
  if([45,48].includes(code))return "🌫"; if([1,2,3].includes(code))return "☁"; return day?"☀":"☾";
}

export const fahr = () => opts.einheit === "fahrenheit";

export const fmtTemp = (c: number) => fahr() ? `${Math.round(c * 9 / 5 + 32)}°F` : `${Math.round(c)}°C`;

export const fmtWind = (k: number) => fahr() ? `${Math.round(k * .621)} mph` : `${Math.round(k)} km/h`;

export function compass(deg: number) { const d = opts.sprache === "de" ? ["N", "NO", "O", "SO", "S", "SW", "W", "NW"] : ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]; return d[Math.round(deg / 45) % 8]; }

export const fmtTime = (t: string) => { const m = t.split("T")[1] ?? ""; return opts.sprache === "de" ? `${m} Uhr` : m; };

/** Testwetter und Tageszeit aus den Optionen über die echten Wetterdaten legen. */
export function effective(w: Weather | null): Weather | null {
  if (!w) return null;
  const o: Weather = { ...w, ...(TESTWETTER[opts.testwetter] ?? {}) };
  if (opts.tageszeit !== "auto") o.day = opts.tageszeit === "tag" ? 1 : 0;
  return o;
}
