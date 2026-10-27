import { opts } from "../options";

const SYNODIC = 29.530588853;
/** Mondalter in Tagen (0 = Neumond) – Referenz: Neumond am 6.1.2000 18:14 UTC. */
export function moonAge(d = new Date()): number {
  if (opts.mondalter != null) return opts.mondalter;
  const days = (d.getTime() - Date.UTC(2000, 0, 6, 18, 14)) / 86400000;
  return ((days % SYNODIC) + SYNODIC) % SYNODIC;
}
export function moonInfo(d = new Date()) {
  const age = moonAge(d), a = 2 * Math.PI * age / SYNODIC, illum = (1 - Math.cos(a)) / 2, waxing = age < SYNODIC / 2;
  const names = opts.sprache === "de"
    ? ["Neumond", "Zunehmende Sichel", "Erstes Viertel", "Zunehmender Mond", "Vollmond", "Abnehmender Mond", "Letztes Viertel", "Abnehmende Sichel"]
    : ["New moon", "Waxing crescent", "First quarter", "Waxing gibbous", "Full moon", "Waning gibbous", "Last quarter", "Waning crescent"];
  return { age, illum, waxing, k: Math.cos(a), name: names[Math.round(age / SYNODIC * 8) % 8] };
}
