import { Weather } from "../types";
import { opts } from "../options";
import { mixHex } from "../util";

// ---------- Tageszeit: Sonnenstand, Dämmerung, Himmelsfarben ----------
export const mins = (t?: string) => { const m = /T(\d+):(\d+)/.exec(t ?? ""); return m ? +m[1] * 60 + +m[2] : NaN; };

export function dayInfo(w: Weather | null) {
  const r = { night: false, frac: .5, nfrac: .5, twilight: 0 };
  if (!w) return r;
  r.night = !w.day;
  const now = mins(w.time), sr = mins(w.sunrise), ss = mins(w.sunset);
  if (Number.isFinite(now + sr + ss) && ss > sr) {
    if (now >= sr && now <= ss) r.frac = (now - sr) / (ss - sr);
    else r.nfrac = Math.min(1, Math.max(0, ((now - ss + 1440) % 1440) / (((sr - ss) + 1440) % 1440 || 1)));
    if (opts.tageszeit === "auto") r.twilight = Math.max(0, 1 - Math.min(Math.abs(now - sr), Math.abs(now - ss)) / 60);
  }
  return r;
}

export const skyPos = (f: number) => ({ x: 150 + f * 700, y: 125 - Math.sin(Math.PI * f) * 80 });

export function skyColors(night: boolean, tw: number): [string, string] {
  const base = night ? ["#16224d", "#34457f"] : ["#8fd3f4", "#e6f6fb"], warm = night ? ["#3b3a7a", "#f08a5d"] : ["#86b9e8", "#ffcf94"];
  return [mixHex(base[0], warm[0], tw), mixHex(base[1], warm[1], tw)];
}
