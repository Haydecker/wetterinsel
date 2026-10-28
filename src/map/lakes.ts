import { ElementOSM, Lake, LatLon, P } from "../types";
import { INK, f1, inPoly, node, rng, smooth } from "../util";
import { CX, CY, RX, RY } from "./geometry";
import { local } from "./projection";

type LL = { lat: number; lon: number };
const key = (p: LL) => `${p.lat.toFixed(7)},${p.lon.toFixed(7)}`;
const meters = (p: LL, c: LatLon) => Math.hypot((p.lon - c.lon) * 111320 * Math.cos(c.lat * Math.PI / 180), (p.lat - c.lat) * 110540);

export const lakeQuery = (lat: number, lon: number, r: number) =>
  `[out:json][timeout:90];(relation(around:${r},${lat},${lon})["type"="multipolygon"]["natural"="water"];relation(around:${r},${lat},${lon})["type"="multipolygon"]["waterway"="riverbank"];way(around:${r},${lat},${lon})["natural"="coastline"];);out geom;`;

/** Ufer weit weg vom Mittelpunkt ausdünnen (Anfang und Ende bleiben, damit Teilstücke zusammenpassen). */
export function thin(g: LL[], c: LatLon, R: number): LL[] {
  if (g.length < 3) return g;
  const out = [g[0]]; let last = g[0];
  for (let i = 1; i < g.length - 1; i++) {
    const d = meters(g[i], c), sp = d < R * 1.6 ? 0 : Math.min(400, d * .04);
    if (sp === 0 || meters(g[i], last) >= sp) { out.push(g[i]); last = g[i]; }
  }
  out.push(g[g.length - 1]); return out;
}

export function thinElements(els: ElementOSM[], c: LatLon, R: number): ElementOSM[] {
  return els.map(e => e.members ? { ...e, members: e.members.map(m => m.geometry ? { ...m, geometry: thin(m.geometry, c, R) } : m) } : e.geometry ? { ...e, geometry: thin(e.geometry, c, R) } : e);
}

/** Einzelne Uferlinien zu geschlossenen Ringen zusammensetzen. */
export function stitch(segs: LL[][]): LL[][] {
  const pool = segs.filter(s => s.length > 1).map(s => s.slice()), rings: LL[][] = [];
  while (pool.length) {
    let cur = pool.pop()!, grew = true;
    while (grew && key(cur[0]) !== key(cur[cur.length - 1])) {
      grew = false;
      for (let i = 0; i < pool.length; i++) {
        const s = pool[i], a = key(cur[0]), b = key(cur[cur.length - 1]), s0 = key(s[0]), s1 = key(s[s.length - 1]);
        if (s0 === b) cur = cur.concat(s.slice(1));
        else if (s1 === b) cur = cur.concat(s.slice(0, -1).reverse());
        else if (s1 === a) cur = s.slice(0, -1).concat(cur);
        else if (s0 === a) cur = s.slice(1).reverse().concat(cur);
        else continue;
        pool.splice(i, 1); grew = true; break;
      }
    }
    rings.push(cur);
  }
  return rings;
}

/** Küstenlinien (Land links, Wasser rechts) mit fester Richtung zu Ketten verbinden. */
function chainCoast(segs: LL[][]): LL[][] {
  const pool = segs.filter(s => s.length > 1).map(s => s.slice()), out: LL[][] = [];
  while (pool.length) {
    let cur = pool.pop()!, grew = true;
    while (grew && key(cur[0]) !== key(cur[cur.length - 1])) {
      grew = false;
      for (let i = 0; i < pool.length; i++) {
        const s = pool[i];
        if (key(s[0]) === key(cur[cur.length - 1])) cur = cur.concat(s.slice(1)); else if (key(s[s.length - 1]) === key(cur[0])) cur = s.slice(0, -1).concat(cur); else continue;
        pool.splice(i, 1); grew = true; break;
      }
    }
    out.push(cur);
  }
  return out;
}

const FAR = 9000; // Meter: so weit wird das Meer über den sichtbaren Bereich hinaus gezeichnet
const unit = (a: P, b: P): P => { const l = Math.hypot(b.x - a.x, b.y - a.y) || 1; return { x: (b.x - a.x) / l, y: (b.y - a.y) / l }; };
const add = (a: P, d: P, f: number): P => ({ x: a.x + d.x * f, y: a.y + d.y * f });
const right = (d: P): P => ({ x: d.y, y: -d.x });

/** Meer aus Küstenlinien: Wasser liegt in Laufrichtung rechts der Linie. */
function coastLakes(elements: ElementOSM[], c: LatLon): Lake[] {
  const segs = elements.filter(e => e.type === "way" && e.tags?.natural === "coastline" && e.geometry).map(e => e.geometry!);
  const out: Lake[] = [];
  for (const ch of chainCoast(segs)) {
    const m = ch.map(p => local(p, c));
    if (m.length < 3) continue;
    if (key(ch[0]) === key(ch[ch.length - 1])) { // geschlossen: Insel (Land innen) oder Binnenmeer
      const ring = m.slice(0, -1), area = ring.reduce((s, p, i) => { const q = ring[(i + 1) % ring.length]; return s + p.x * q.y - q.x * p.y; }, 0);
      out.push({ raw: area > 0 ? [[{ x: -FAR, y: -FAR }, { x: FAR, y: -FAR }, { x: FAR, y: FAR }, { x: -FAR, y: FAR }], ring] : [ring] });
      continue;
    }
    const d0 = unit(m[1], m[0]), d1 = unit(m[m.length - 2], m[m.length - 1]), s = add(m[0], d0, FAR), e = add(m[m.length - 1], d1, FAR);
    out.push({ raw: [[s, ...m, e, add(e, right(d1), FAR), add(s, right({ x: -d0.x, y: -d0.y }), FAR)]] });
  }
  return out;
}

/** Seen (Multipolygon-Relationen) und Meere (Küstenlinien) als Ringe in Metern. */
export function lakesFrom(elements: ElementOSM[], c: LatLon): Lake[] {
  const out: Lake[] = coastLakes(elements, c);
  for (const e of elements) {
    if (!e.members) continue;
    const ways = (role: (r: string) => boolean) => e.members!.filter(m => m.type === "way" && m.geometry && role(m.role ?? "")).map(m => m.geometry!);
    const rings = [...stitch(ways(r => r !== "inner")), ...stitch(ways(r => r === "inner"))]
      .map(r => (key(r[0]) === key(r[r.length - 1]) ? r.slice(0, -1) : r).map(p => local(p, c))).filter(r => r.length >= 3);
    if (rings.length) out.push({ raw: rings });
  }
  return out;
}

const inLakes = (lakes: { rings: P[][] }[], p: P) => lakes.some(l => l.rings.reduce((a, r) => a !== inPoly(p, r), false));

/** Zeichnet Seen (unter allem anderen) samt Segelbooten und liefert einen Wasser-Test. */
export function drawLakes(map: Element, defs: Element, lakes: { rings: P[][] }[]): (p: P) => boolean {
  if (!lakes.length) return () => false;
  const pat = node(defs, "pattern", { id: "lakewaves", width: 46, height: 28, patternUnits: "userSpaceOnUse" });
  node(pat, "path", { d: "M3 8 q5 -5 10 0 t10 0 M26 21 q5 -5 10 0 t10 0", fill: "none", stroke: "#d8f6fb", "stroke-width": 1.5, "stroke-linecap": "round", opacity: ".85" });
  for (const l of lakes) {
    const d = l.rings.map(r => smooth(r, true)).join(" ");
    node(map, "path", { d, "fill-rule": "evenodd", fill: "#3fb8c9", stroke: INK, "stroke-width": 1.8, "stroke-linejoin": "round" });
    node(map, "path", { d, "fill-rule": "evenodd", fill: "url(#lakewaves)", "pointer-events": "none" });
  }
  const r = rng(23), spots: P[] = [];
  for (let y = CY - RY * .85; y < CY + RY * .85; y += 24) for (let x = CX - RX * .85; x < CX + RX * .85; x += 24) {
    const p = { x: x + r() * 8, y: y + r() * 8 };
    if (((p.x - CX) / RX) ** 2 + ((p.y - CY) / RY) ** 2 > .7) continue;
    if ([[0, 0], [24, 0], [-24, 0], [0, 17], [0, -17]].every(([dx, dy]) => inLakes(lakes, { x: p.x + dx, y: p.y + dy }))) spots.push(p);
  }
  const boats: P[] = [];
  while (spots.length && boats.length < 3) { const p = spots.splice(Math.floor(r() * spots.length), 1)[0]; if (boats.every(b => Math.hypot(b.x - p.x, b.y - p.y) > 150)) boats.push(p); }
  boats.forEach((p, i) => {
    const g = node(map, "g", { transform: `translate(${f1(p.x)} ${f1(p.y)}) scale(1.25)` }), b = node(g, "g", { class: "bob", style: `animation-delay:${-i * 1.3}s` });
    node(b, "path", { d: "M-9 0 L9 0 L6 5 L-6 5 Z", fill: i % 2 ? "#3b82f6" : "#e5322b", stroke: INK, "stroke-width": 1.4, "stroke-linejoin": "round" });
    node(b, "line", { x1: 0, y1: 0, x2: 0, y2: -15, stroke: INK, "stroke-width": 1.4 });
    node(b, "path", { d: "M1.5 -14 L1.5 -2 L9 -2 Z", fill: "#fff", stroke: INK, "stroke-width": 1.2, "stroke-linejoin": "round" });
    node(b, "path", { d: "M-1.5 -12 L-1.5 -2 L-7 -2 Z", fill: "#ffd93d", stroke: INK, "stroke-width": 1.2, "stroke-linejoin": "round" });
  });
  return p => inLakes(lakes, p);
}
