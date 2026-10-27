// Zusätzliche Kartenobjekte: Gleise & Zug, Bäche/Flüsse, Spiel-/Sportplätze, Äcker usw., Strom, Hecken, Haltestellen.
import { P, Shape } from "../types";
import { opts } from "../options";
import { INK, distSeg, f1, inPoly, lerp, mid, node, rng, smooth } from "../util";
import { pointAt, polyLen } from "./details";

export type Features = { areas: Shape[]; streams: Shape[]; rails: Shape[]; platforms: Shape[]; power: Shape[]; hedges: Shape[]; stops: Shape[] };
export const on = (k: string) => opts.objekte.includes(k);

export function splitFeatures(shapes: Shape[]): Features {
  const k = (n: Shape["kind"]) => shapes.filter(s => s.kind === n);
  const isFreizeit = (s: Shape) => ["playground", "pitch", "sports_centre", "swimming_pool"].includes(s.tags.leisure ?? "");
  return {
    areas: k("area").filter(s => isFreizeit(s) ? on("freizeit") : on("landnutzung")),
    streams: on("gewaesser") ? k("stream") : [], rails: on("gleise") ? k("rail") : [], platforms: on("haltestellen") || on("gleise") ? k("platform") : [],
    power: on("strom") ? k("power") : [], hedges: on("hecken") ? k("hedge").slice(0, 250) : [], stops: on("haltestellen") ? k("stop") : [],
  };
}

const closed = (pts: P[]) => pts.length > 3 && pts[0].x === pts[pts.length - 1].x && pts[0].y === pts[pts.length - 1].y ? pts.slice(0, -1) : pts;
const centroid = (pts: P[]): P => pts.reduce((a, p) => ({ x: a.x + p.x / pts.length, y: a.y + p.y / pts.length }), { x: 0, y: 0 });
const streamW = (t?: string) => t === "river" ? 13 : t === "canal" ? 9 : t === "stream" ? 5 : 2.8;
const railW = 6.4;

/** Für Baumplatzierung: liegt der Punkt auf einem dieser Objekte? */
export function makeBlocker(f: Features, K: number) {
  const k = Math.max(.6, K);
  return (p: P) => f.areas.some(a => inPoly(p, a.points))
    || f.streams.some(s => { const lim = streamW(s.tags.waterway) * k / 2 + 4; for (let i = 1; i < s.points.length; i++) if (distSeg(p, s.points[i - 1], s.points[i]) < lim) return true; return false; })
    || [...f.rails, ...f.platforms, ...f.hedges].some(s => { const lim = (s.kind === "rail" ? railW * k / 2 + 4 : 5); for (let i = 1; i < s.points.length; i++) if (distSeg(p, s.points[i - 1], s.points[i]) < lim) return true; return false; });
}

/** Muster (Furchen, Obstbäume, Beete) einmalig in <defs> anlegen. */
function patterns(defs: Element) {
  if (defs.querySelector("#pat-field")) return;
  const f = node(defs, "pattern", { id: "pat-field", width: 9, height: 9, patternUnits: "userSpaceOnUse", patternTransform: "rotate(28)" });
  node(f, "rect", { width: 9, height: 9, fill: "#ecdc8e" }); node(f, "rect", { y: 4, width: 9, height: 2.2, fill: "#d1b95e" });
  const v = node(defs, "pattern", { id: "pat-vine", width: 7, height: 7, patternUnits: "userSpaceOnUse", patternTransform: "rotate(-20)" });
  node(v, "rect", { width: 7, height: 7, fill: "#b9d96f" }); node(v, "rect", { y: 3, width: 7, height: 1.8, fill: "#5f9a3a" });
  const o = node(defs, "pattern", { id: "pat-orchard", width: 12, height: 12, patternUnits: "userSpaceOnUse" });
  node(o, "rect", { width: 12, height: 12, fill: "#8fd36a" }); node(o, "circle", { cx: 6, cy: 6, r: 3.4, fill: "#4fae45", stroke: INK, "stroke-width": .8 }); node(o, "circle", { cx: 5, cy: 5, r: 1, fill: "#e5322b" });
  const a = node(defs, "pattern", { id: "pat-allot", width: 11, height: 11, patternUnits: "userSpaceOnUse", patternTransform: "rotate(18)" });
  node(a, "rect", { width: 11, height: 11, fill: "#d3d98c" }); node(a, "rect", { x: 1, y: 1, width: 4.5, height: 9, fill: "#b8905a" }); node(a, "rect", { x: 6.2, y: 1, width: 3.8, height: 9, fill: "#7cbf5a" });
}

function playground(g: Element, c: P, k: number) {
  const t = node(g, "g", { transform: `translate(${f1(c.x)} ${f1(c.y)}) scale(${k})` });
  // Schaukel
  node(t, "path", { d: "M-12 2 l4 -12 l4 12 M-8 -10 h-8 M-16 -10 l-4 12", fill: "none", stroke: INK, "stroke-width": 1.4, "stroke-linecap": "round", "stroke-linejoin": "round", transform: "translate(8 0)" });
  node(t, "rect", { x: -9, y: -2, width: 5, height: 1.8, rx: .6, fill: "#ff8a3d", stroke: INK, "stroke-width": .8 });
  // Rutsche
  node(t, "path", { d: "M5 2 v-11 l10 11", fill: "none", stroke: INK, "stroke-width": 3.2, "stroke-linecap": "round", "stroke-linejoin": "round", transform: "translate(2 0)" });
  node(t, "path", { d: "M5 2 v-11 l10 11", fill: "none", stroke: "#e5322b", "stroke-width": 1.6, "stroke-linecap": "round", "stroke-linejoin": "round", transform: "translate(2 0)" });
}
function pitch(g: Element, pts: P[]) {
  const c = centroid(pts), inner = pts.map(p => ({ x: c.x + (p.x - c.x) * .86, y: c.y + (p.y - c.y) * .86 }));
  node(g, "polygon", { points: inner.map(p => `${f1(p.x)},${f1(p.y)}`).join(" "), fill: "none", stroke: "#fff", "stroke-width": 1.5, "stroke-linejoin": "round" });
  if (inner.length === 4) { const a = mid(inner[1], inner[2]), b = mid(inner[3], inner[0]); node(g, "line", { x1: f1(a.x), y1: f1(a.y), x2: f1(b.x), y2: f1(b.y), stroke: "#fff", "stroke-width": 1.3 }); }
  node(g, "ellipse", { cx: f1(c.x), cy: f1(c.y), rx: 6, ry: 3, fill: "none", stroke: "#fff", "stroke-width": 1.3 });
}

export function drawAreas(map: Element, areas: Shape[], defs: Element, snowy: boolean, K: number) {
  if (!areas.length) return; patterns(defs); const k = Math.max(.6, K), r = rng(5);
  for (const a of areas) {
    const t = a.tags, pts = closed(a.points); if (pts.length < 3) continue;
    const kind = t.landuse ?? t.leisure ?? "";
    let fill = "#9fd77a";
    if (kind === "farmland") fill = "url(#pat-field)"; else if (kind === "vineyard") fill = "url(#pat-vine)"; else if (kind === "orchard") fill = "url(#pat-orchard)"; else if (kind === "allotments") fill = "url(#pat-allot)";
    else if (kind === "cemetery") fill = "#8fd070"; else if (kind === "playground") fill = "#f1dfa6"; else if (kind === "pitch" || kind === "sports_centre") fill = "#5fbe48"; else if (kind === "swimming_pool") fill = "#58c8e8";
    node(map, "path", { d: smooth(pts, true), fill: snowy ? "#eef3f6" : fill, stroke: INK, "stroke-width": 1.6, "stroke-linejoin": "round" });
    if (snowy && fill.startsWith("url")) node(map, "path", { d: smooth(pts, true), fill, opacity: ".35" });
    if (kind === "cemetery") { const xs = pts.map(p => p.x), ys = pts.map(p => p.y); let n = 0;
      for (let y = Math.min(...ys) + 5; y < Math.max(...ys); y += 9) for (let x = Math.min(...xs) + 5; x < Math.max(...xs); x += 8) { const p = { x: x + r() * 3, y: y + r() * 3 }; if (n < 60 && inPoly(p, pts)) { n++;
        node(map, "path", { d: `M${f1(p.x - 1.6)} ${f1(p.y)} v-3.4 a1.6 1.6 0 0 1 3.2 0 v3.4 z`, fill: "#cfd3d8", stroke: INK, "stroke-width": .7 }); } } }
    if (kind === "playground") playground(map, centroid(pts), k);
    if (kind === "pitch" || kind === "sports_centre") pitch(map, pts);
  }
}

export function drawStreams(map: Element, streams: Shape[], K: number) {
  const k = Math.max(.6, K);
  for (const s of streams) { const w = streamW(s.tags.waterway) * k, d = smooth(s.points, false), base = { d, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" };
    node(map, "path", { ...base, stroke: INK, "stroke-width": w + 2.6 }); node(map, "path", { ...base, stroke: "#3fb8c9", "stroke-width": w });
    node(map, "path", { ...base, stroke: "#d8f6fb", "stroke-width": Math.max(1, w * .24), "stroke-dasharray": "5 9", class: "flow" }); }
}

function offsetPts(pts: P[], d: number): P[] {
  return pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1; return { x: p.x - dy / l * d, y: p.y + dx / l * d }; });
}
export function drawRails(map: Element, f: Features, K: number, snowy: boolean) {
  const k = Math.max(.6, K), w = railW * k;
  for (const s of f.platforms) { const d = smooth(s.points, false), b = { d, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" };
    node(map, "path", { ...b, stroke: INK, "stroke-width": 9 * k }); node(map, "path", { ...b, stroke: snowy ? "#f4f8fb" : "#dcd8cf", "stroke-width": 6.4 * k }); node(map, "path", { ...b, stroke: "#fff", "stroke-width": 1.2, opacity: ".8", "stroke-dasharray": "3 4" }); }
  for (const s of f.rails) { const d = smooth(s.points, false), b = { d, fill: "none", "stroke-linejoin": "round" };
    node(map, "path", { ...b, stroke: INK, "stroke-width": w + 2.4, "stroke-linecap": "round" }); node(map, "path", { ...b, stroke: snowy ? "#e8eef2" : "#cdbba0", "stroke-width": w, "stroke-linecap": "round" });
    node(map, "path", { ...b, stroke: "#6b4a2b", "stroke-width": w - .6, "stroke-dasharray": `${f1(1.3 * k)} ${f1(2.6 * k)}` });
    for (const o of [-1.6 * k, 1.6 * k]) { const dd = smooth(offsetPts(s.points, o), false); node(map, "path", { d: dd, fill: "none", stroke: INK, "stroke-width": 1.9 }); node(map, "path", { d: dd, fill: "none", stroke: "#b9c3d0", "stroke-width": 1 }); } }
}

function wagon(g: Element, x: number, color: string, loco: boolean) {
  const w = node(g, "g", { transform: `translate(${x} -7)` });
  node(w, "rect", { x: -7.5, y: -3, width: 15, height: 8, rx: 2, fill: color, stroke: INK, "stroke-width": 1.3 });
  if (loco) { node(w, "rect", { x: 1, y: -6.5, width: 5, height: 4, rx: 1, fill: "#3a3a4a", stroke: INK, "stroke-width": 1 }); node(w, "rect", { x: -5, y: -1.5, width: 4.5, height: 3.4, rx: .8, fill: "#bfe3f5", stroke: INK, "stroke-width": .8 }); }
  else for (const dx of [-5, -1, 3]) node(w, "rect", { x: dx, y: -1.4, width: 3, height: 3, rx: .6, fill: "#bfe3f5", stroke: INK, "stroke-width": .7 });
  for (const dx of [-4.5, 4.5]) node(w, "circle", { cx: dx, cy: 5.2, r: 1.7, fill: INK });
}
/** Ein kleiner Zug fährt auf dem längsten Gleisstück. */
export function drawTrain(map: Element, rails: Shape[]) {
  const ok = rails.filter(r => polyLen(r.points) > 60).sort((a, b) => polyLen(b.points) - polyLen(a.points)); if (!ok.length) return;
  let pts = ok[0].points; if (pts[pts.length - 1].x < pts[0].x) pts = pts.slice().reverse();
  const g = node(map, "g", {}), t = node(g, "g", {}); wagon(t, 0, "#e5322b", true); wagon(t, -17, "#ffd23d", false); wagon(t, -33, "#3b82f6", false);
  if (opts.animation) node(t, "animateMotion", { dur: `${(polyLen(pts) / 20).toFixed(1)}s`, repeatCount: "indefinite", path: smooth(pts, false), rotate: "auto" });
  else { const { p, dx, dy } = pointAt(pts, .5); g.setAttribute("transform", `translate(${f1(p.x)} ${f1(p.y)}) rotate(${(Math.atan2(dy, dx) * 180 / Math.PI).toFixed(1)})`); }
}

export function drawHedges(map: Element, hedges: Shape[], K: number, snowy: boolean) {
  const k = Math.max(.6, K);
  for (const s of hedges) { const d = smooth(s.points, false), hedge = s.tags.barrier === "hedge", w = (hedge ? 3.6 : 2.2) * k, b = { d, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" };
    node(map, "path", { ...b, stroke: INK, "stroke-width": w + 2 }); node(map, "path", { ...b, stroke: hedge ? (snowy ? "#cfe0d8" : "#3fae45") : "#b7b1a6", "stroke-width": w });
    if (hedge) node(map, "path", { ...b, stroke: snowy ? "#fff" : "#7fdc6a", "stroke-width": Math.max(.8, w * .3), "stroke-dasharray": "2 5", transform: "translate(0 -.8)" }); }
}

/** Strommasten mit durchhängenden Leitungen (liegen über der Szene). */
export function drawPower(map: Element, power: Shape[], K: number) {
  const k = Math.max(.7, K), H = 14 * k; let poles = 0;
  for (const s of power) { const tops: P[] = [];
    for (const p of s.points) { if (poles++ > 70) break; tops.push({ x: p.x, y: p.y - H });
      node(map, "line", { x1: f1(p.x), y1: f1(p.y), x2: f1(p.x), y2: f1(p.y - H), stroke: INK, "stroke-width": 2.4, "stroke-linecap": "round" });
      node(map, "line", { x1: f1(p.x - 5 * k), y1: f1(p.y - H + 2), x2: f1(p.x + 5 * k), y2: f1(p.y - H + 2), stroke: INK, "stroke-width": 1.8, "stroke-linecap": "round" }); }
    for (let i = 1; i < tops.length; i++) for (const o of [-4 * k, 4 * k]) { const a = { x: tops[i - 1].x + o, y: tops[i - 1].y + 2 }, b = { x: tops[i].x + o, y: tops[i].y + 2 }, m = lerp(a, b, .5);
      node(map, "path", { d: `M${f1(a.x)} ${f1(a.y)} Q${f1(m.x)} ${f1(m.y + 7)} ${f1(b.x)} ${f1(b.y)}`, fill: "none", stroke: INK, "stroke-width": .9 }); } }
}

/** Haltestellen-Schild (Bus: gelb mit H, Bahn: blau). */
export function stopSign(g: Element, s: Shape, K: number) {
  const p = s.points[0], k = Math.max(.75, K), bus = s.tags.highway === "bus_stop", t = node(g, "g", { transform: `translate(${f1(p.x)} ${f1(p.y)}) scale(${k})` });
  node(t, "ellipse", { cx: 0, cy: 0, rx: 3.2, ry: 1.3, fill: INK, opacity: ".25" });
  node(t, "line", { x1: 0, y1: 0, x2: 0, y2: -14, stroke: INK, "stroke-width": 1.6 });
  if (bus) { node(t, "circle", { cx: 0, cy: -17, r: 5.2, fill: "#ffd93d", stroke: INK, "stroke-width": 1.3 }); const tx = node(t, "text", { x: 0, y: -14.6, "text-anchor": "middle", "font-size": 7.4, "font-weight": 900, "font-family": "system-ui,sans-serif", fill: "#1d7a3a" }); tx.textContent = "H"; }
  else { node(t, "rect", { x: -7, y: -23, width: 14, height: 8, rx: 2, fill: "#2f6fd6", stroke: INK, "stroke-width": 1.2 }); const tx = node(t, "text", { x: 0, y: -16.8, "text-anchor": "middle", "font-size": 6, "font-weight": 900, "font-family": "system-ui,sans-serif", fill: "#fff" }); tx.textContent = "Bf"; }
}
