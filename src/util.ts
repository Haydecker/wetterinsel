import { P } from "./types";
import { NS } from "./dom";

export function node(parent: Element, name: string, attrs: Record<string, string | number> = {}) {
  const el = document.createElementNS(NS, name);
  for (const [k,v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  parent.appendChild(el); return el;
}

export function pointsText(points: P[]) { return points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" "); }

export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export function mixHex(a: string, b: string, t: number) {
  const p = (h: string) => parseInt(h.slice(1), 16), A = p(a), B = p(b), c = (s: number) => Math.round(((A >> s) & 255) * (1 - t) + ((B >> s) & 255) * t);
  return `rgb(${c(16)},${c(8)},${c(0)})`;
}

// ---------- Comic-Stil ----------
export const INK = "#2a2438";

export function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16); const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

export function inPoly(p: P, poly: P[]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

export function distSeg(p: P, a: P, b: P) {
  const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy;
  const t = l ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l)) : 0;
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

export const lerp = (a: P, b: P, t: number): P => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

export const mid = (a: P, b: P) => lerp(a, b, .5);

export const up = (p: P, h: number): P => ({ x: p.x, y: p.y - h });

export const f1 = (n: number) => n.toFixed(1);

/** Weiche, geschwungene Linie bzw. Fläche durch die Punkte (Comic statt Lineal). */
export function smooth(pts: P[], closed: boolean): string {
  if (pts.length < 3) return `M${pts.map(p => `${f1(p.x)} ${f1(p.y)}`).join(" L")}`;
  if (closed) {
    let d = `M${f1(mid(pts[pts.length - 1], pts[0]).x)} ${f1(mid(pts[pts.length - 1], pts[0]).y)}`;
    for (let i = 0; i < pts.length; i++) { const m = mid(pts[i], pts[(i + 1) % pts.length]); d += ` Q${f1(pts[i].x)} ${f1(pts[i].y)} ${f1(m.x)} ${f1(m.y)}`; }
    return d + "Z";
  }
  let d = `M${f1(pts[0].x)} ${f1(pts[0].y)}`;
  for (let i = 1; i < pts.length - 1; i++) { const m = mid(pts[i], pts[i + 1]); d += ` Q${f1(pts[i].x)} ${f1(pts[i].y)} ${f1(m.x)} ${f1(m.y)}`; }
  const l = pts[pts.length - 1]; return d + ` L${f1(l.x)} ${f1(l.y)}`;
}
