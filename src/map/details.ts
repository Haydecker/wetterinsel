// Kleine Comic-Details: Autos, Laternen, Zäune, Schornsteinrauch, Enten und Boote.
import { P, Shape, Weather } from "../types";
import { opts } from "../options";
import { INK, f1, node, rng, smooth } from "../util";
import { windVec } from "../weather/wind";

const CAR_COLORS = ["#e5322b", "#ffd23d", "#3b82f6", "#34c759", "#ff8a3d", "#f4f4f4", "#b45fd6"];
const VEHICLE = ["motorway", "trunk", "primary", "secondary", "tertiary", "residential", "unclassified", "living_street", "service"];

export const polyLen = (pts: P[]) => pts.reduce((n, p, i) => i ? n + Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) : 0, 0);
/** Punkt und Richtung bei Anteil f (0..1) entlang einer Linie. */
export function pointAt(pts: P[], f: number): { p: P; dx: number; dy: number } {
  let left = polyLen(pts) * f;
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (left <= l || i === pts.length - 1) { const t = l ? Math.min(1, left / l) : 0; return { p: { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t }, dx: (pts[i].x - pts[i - 1].x) / (l || 1), dy: (pts[i].y - pts[i - 1].y) / (l || 1) } }
    left -= l;
  }
  return { p: pts[0], dx: 1, dy: 0 };
}

function car(g: Element, color: string, s = 1) {
  const c = node(g, "g", { transform: `translate(0 -3) scale(${s})` });
  node(c, "rect", { x: -6, y: -3, width: 12, height: 5, rx: 1.8, fill: color, stroke: INK, "stroke-width": 1.1 });
  node(c, "rect", { x: -3, y: -6.2, width: 7, height: 4, rx: 1.6, fill: "#bfe3f5", stroke: INK, "stroke-width": 1 });
  for (const x of [-3.6, 3.6]) node(c, "circle", { cx: x, cy: 2, r: 1.7, fill: INK });
}

/** Fahrende und parkende Autos auf den Straßen. */
export function drawCars(map: Element, roads: Shape[], roadW: (h?: string) => number, night: boolean) {
  const r = rng(31), ok = roads.filter(s => VEHICLE.includes(s.tags.highway ?? "") && polyLen(s.points) > 50).sort((a, b) => polyLen(b.points) - polyLen(a.points));
  const orient = (pts: P[]) => pts[pts.length - 1].x < pts[0].x ? pts.slice().reverse() : pts;
  const moving = ok.slice(0, night ? 6 : 14);
  moving.forEach((s, i) => {
    const pts = orient(s.points), len = polyLen(pts), speed = 8 + r() * 5, dur = len / speed, col = CAR_COLORS[Math.floor(r() * CAR_COLORS.length)];
    const g = node(map, "g", {}), inner = node(g, "g", {}); car(inner, col);
    if (opts.animation) {
      const a = node(inner, "animateMotion", { dur: `${dur.toFixed(1)}s`, repeatCount: "indefinite", path: smooth(pts, false), begin: `-${(r() * dur).toFixed(1)}s` }); void a;
    } else { const { p } = pointAt(pts, .2 + r() * .6); g.setAttribute("transform", `translate(${f1(p.x)} ${f1(p.y)})`); }
    void i;
  });
  for (let n = 0, placed = 0; n < 80 && placed < (night ? 22 : 16) && ok.length; n++) {
    const s = ok[Math.floor(r() * ok.length)], { p, dx, dy } = pointAt(s.points, .1 + r() * .8), off = roadW(s.tags.highway) / 2 + 2.2, side = r() < .5 ? 1 : -1;
    const g = node(map, "g", { transform: `translate(${f1(p.x - dy * off * side)} ${f1(p.y + dx * off * side)})` }); car(g, CAR_COLORS[Math.floor(r() * CAR_COLORS.length)], .9); placed++;
  }
}

/** Warme Laternen-Lichtpunkte entlang der Straßen (Nacht/Dämmerung). */
export function drawLamps(map: Element, roads: Shape[], roadW: (h?: string) => number) {
  const r = rng(47); let n = 0;
  for (const s of roads) { if (!VEHICLE.includes(s.tags.highway ?? "")) continue; const len = polyLen(s.points);
    for (let d = 20; d < len && n < 90; d += 42 + r() * 12) { const { p, dx, dy } = pointAt(s.points, d / len), off = roadW(s.tags.highway) / 2 + 2.5;
      const x = p.x - dy * off, y = p.y + dx * off; n++;
      node(map, "circle", { cx: f1(x), cy: f1(y - 4), r: 8, fill: "#ffd45a", opacity: ".28" }); node(map, "line", { x1: f1(x), y1: f1(y), x2: f1(x), y2: f1(y - 6), stroke: INK, "stroke-width": 1.2 }); node(map, "circle", { cx: f1(x), cy: f1(y - 6.5), r: 1.8, fill: "#fff3b0", stroke: INK, "stroke-width": .8 }); } }
}

export type FencePlan = { x0: number; x1: number; y: number; wood: boolean };
type Box = { x0: number; x1: number; y0: number; y1: number };
/** Zäune vor einem Teil der Häuser planen (nicht auf Straßen oder in Nachbarhäusern). */
export function planFences(bbox: Box[], onRoad: (p: P, extra?: number) => boolean, inIsland: (p: P) => boolean): FencePlan[] {
  const r = rng(73), out: FencePlan[] = [];
  bbox.forEach((b, i) => {
    if (r() > .42 || b.x1 - b.x0 < 8) return;
    const y = b.y1 + 6, x0 = b.x0 - 5, x1 = b.x1 + 5, probe = [{ x: x0, y }, { x: (x0 + x1) / 2, y }, { x: x1, y }];
    if (!probe.every(p => inIsland(p) && !onRoad(p, 1.5))) return;
    if (bbox.some((o, j) => j !== i && probe.some(p => p.x > o.x0 - 2 && p.x < o.x1 + 2 && p.y > o.y0 + 34 && p.y < o.y1 + 1))) return;
    out.push({ x0, x1, y, wood: r() < .35 });
  });
  return out;
}
export function fence(g: Element, f: FencePlan, snowy: boolean) {
  const d = `M${f1(f.x0)} ${f1(f.y)} L${f1(f.x1)} ${f1(f.y + (f.x1 - f.x0) * .02)}`;
  node(g, "path", { d, stroke: INK, "stroke-width": 3.6, "stroke-linecap": "round", fill: "none" });
  node(g, "path", { d, stroke: snowy ? "#eef4fa" : f.wood ? "#c58b4e" : "#fff", "stroke-width": 2.2, "stroke-dasharray": "1.8 2.2", fill: "none" });
}

/** Rauch aus Schornsteinen: weiche, geschwungene Rauchfahne, die mit dem Wind weht (nur bei kühlem Wetter). */
export function drawSmoke(map: Element, chimneys: P[], w: Weather | null) {
  if (!w || w.temperature > 16 || !chimneys.length) return;
  const dx = windVec(w).ux * (6 + Math.min(40, w.wind) * .7), defs = (map as SVGElement).ownerSVGElement?.querySelector("defs");
  if (defs && !defs.querySelector("#smoke-g")) {
    const g = node(defs, "linearGradient", { id: "smoke-g", x1: "0", y1: "1", x2: "0", y2: "0" });
    node(g, "stop", { offset: "0%", "stop-color": "#a9a7b6", "stop-opacity": ".95" }); node(g, "stop", { offset: "55%", "stop-color": "#dcdbe5", "stop-opacity": ".8" }); node(g, "stop", { offset: "100%", "stop-color": "#f6f6fa", "stop-opacity": "0" });
  }
  const r = rng(61);
  chimneys.slice(0, 40).forEach((c, i) => {
    const ph = r() * 6, steps = 7, L: P[] = [], R: P[] = [];
    for (let k = 0; k < steps; k++) { const t = k / (steps - 1), cx = c.x + dx * 1.2 * t * t + Math.sin(t * 4.4 + ph) * 2.4 * t, y = c.y - 27 * t, hw = 1.3 + 5.6 * t * (.8 + r() * .4); L.push({ x: cx - hw, y }); R.push({ x: cx + hw, y }); }
    node(map, "path", { d: smooth([...L, ...R.reverse()], true), fill: "url(#smoke-g)", class: "plume", style: `animation-delay:${-(i % 7) * .6}s` });
    for (let k = 0; k < 2; k++) {
      const g = node(map, "g", { class: "smoke", style: `--dx:${(dx * .9).toFixed(1)}px;animation-delay:${-(k * 3.4 + (i % 5) * .5).toFixed(1)}s` });
      node(g, "circle", { cx: f1(c.x), cy: f1(c.y - 1), r: 2.2 + k * .6, fill: "#eceaf2", opacity: ".75" });
    }
  });
}

/** Enten (und bei größeren Gewässern ein Segelboot) auf dem Wasser. */
export function drawWater(map: Element, waters: Shape[], inPoly: (p: P, poly: P[]) => boolean) {
  const r = rng(53);
  for (const wtr of waters) {
    const xs = wtr.points.map(p => p.x), ys = wtr.points.map(p => p.y), area = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
    if (area < 500) continue;
    const pick = () => { for (let t = 0; t < 40; t++) { const p = { x: Math.min(...xs) + r() * (Math.max(...xs) - Math.min(...xs)), y: Math.min(...ys) + r() * (Math.max(...ys) - Math.min(...ys)) }; if (inPoly(p, wtr.points)) return p; } return null; };
    for (let k = 0; k < Math.min(3, 1 + Math.floor(area / 3000)); k++) { const p = pick(); if (!p) continue;
      const g = node(map, "g", { transform: `translate(${f1(p.x)} ${f1(p.y)})` }), b = node(g, "g", { class: "bob", style: `animation-delay:${-r() * 3}s` });
      node(b, "ellipse", { cx: 0, cy: 1.5, rx: 6, ry: 2.2, fill: "#d8f6fb", opacity: ".9" });
      node(b, "ellipse", { cx: 0, cy: -1, rx: 5, ry: 3.4, fill: "#fff", stroke: INK, "stroke-width": 1.1 }); node(b, "circle", { cx: 4.2, cy: -5, r: 2.6, fill: "#fff", stroke: INK, "stroke-width": 1.1 });
      node(b, "polygon", { points: "6.4,-5.2 9.6,-4.4 6.4,-3.4", fill: "#ff9a1f", stroke: INK, "stroke-width": .7 }); node(b, "circle", { cx: 4.9, cy: -5.7, r: .6, fill: INK }); }
    if (area > 4000) { const p = pick(); if (p) { const g = node(map, "g", { transform: `translate(${f1(p.x)} ${f1(p.y)})` }), b = node(g, "g", { class: "bob", style: "animation-delay:-1s" });
      node(b, "path", { d: "M-9 0 L9 0 L6 5 L-6 5 Z", fill: "#e5322b", stroke: INK, "stroke-width": 1.4, "stroke-linejoin": "round" }); node(b, "line", { x1: 0, y1: 0, x2: 0, y2: -15, stroke: INK, "stroke-width": 1.4 });
      node(b, "path", { d: "M1.5 -14 L1.5 -2 L9 -2 Z", fill: "#fff", stroke: INK, "stroke-width": 1.2, "stroke-linejoin": "round" }); node(b, "path", { d: "M-1.5 -12 L-1.5 -2 L-7 -2 Z", fill: "#ffd93d", stroke: INK, "stroke-width": 1.2, "stroke-linejoin": "round" }); } }
  }
}
