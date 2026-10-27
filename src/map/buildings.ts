import { P, Shape } from "../types";
import { INK, f1, lerp, mid, node, pointsText, rng, shade, up } from "../util";

export const WALLS = ["#f6e3b0", "#f3d37a", "#f1e9d8", "#ecb894", "#d8e8f2", "#f0c8a0", "#f7efc4"];

export const ROOFS = ["#d93a2b", "#e5522d", "#c8302b", "#f0a22e", "#b8402f", "#dc6e2a", "#d93a2b"];

export const TOWER = ["#c9d9ea", "#dfe8f0", "#b7c9dd"];

export function steeple(g: Element, c: P, h: number, K: number, snowy: boolean) {
  const w = Math.max(4, 6.5 * Math.max(.7, K)), H = h * 1.5 + 12, Bt: P = { x: c.x, y: c.y + w / 2 }, Lt: P = { x: c.x - w, y: c.y }, Rt: P = { x: c.x + w, y: c.y }, top = (p: P) => up(p, H);
  node(g, "polygon", { points: pointsText([Lt, Bt, top(Bt), top(Lt)]), fill: "#cfc3ad", stroke: INK, "stroke-width": 1.6, "stroke-linejoin": "round" });
  node(g, "polygon", { points: pointsText([Bt, Rt, top(Rt), top(Bt)]), fill: "#efe6d2", stroke: INK, "stroke-width": 1.6, "stroke-linejoin": "round" });
  const wc = up({ x: c.x + w / 2, y: c.y + w / 4 }, H * .62); node(g, "polygon", { points: pointsText([{ x: wc.x - 1.4, y: wc.y + 1.5 }, { x: wc.x + 1.4, y: wc.y + .5 }, { x: wc.x + 1.4, y: wc.y - 4 }, { x: wc.x - 1.4, y: wc.y - 3 }]), fill: INK });
  const apex: P = { x: c.x, y: c.y - H - w * 2.8 };
  node(g, "polygon", { points: pointsText([top(Lt), top(Bt), apex]), fill: snowy ? "#dfe8f0" : "#5d6f8c", stroke: INK, "stroke-width": 1.6, "stroke-linejoin": "round" });
  node(g, "polygon", { points: pointsText([top(Bt), top(Rt), apex]), fill: snowy ? "#f4f8ff" : "#7a8fb0", stroke: INK, "stroke-width": 1.6, "stroke-linejoin": "round" });
  node(g, "path", { d: `M${f1(apex.x)} ${f1(apex.y)} v-7 M${f1(apex.x - 2.5)} ${f1(apex.y - 4.5)} h5`, stroke: INK, "stroke-width": 3, "stroke-linecap": "round" });
  node(g, "path", { d: `M${f1(apex.x)} ${f1(apex.y)} v-7 M${f1(apex.x - 2.5)} ${f1(apex.y - 4.5)} h5`, stroke: "#ffd23d", "stroke-width": 1.4, "stroke-linecap": "round" });
}

export const isHomeId = (o: { homeId?: string }, b: Shape) => !!o.homeId && b.id === o.homeId;

export function house(g: Element, b: Shape, o: { snowy: boolean; night: boolean; wet: boolean; K: number; low: boolean; homeId?: string; chimneys?: P[] }) {
  const base = b.points.slice(); if (base.length > 1 && base[0].x === base[base.length - 1].x && base[0].y === base[base.length - 1].y) base.pop();
  if (base.length < 3) return;
  const id = +(b.id.replace(/\D/g, "") || "0"), rnd = rng(id);
  const tower = b.height >= 16 || (b.tags.building === "apartments" && b.height >= 12);
  const flat = tower || ["industrial", "commercial", "retail"].includes(b.tags.building ?? "") || base.length !== 4;
  const h = Math.max(4, Math.min(42, b.height * (tower ? 1.05 : .85) * o.K));
  const wall = isHomeId(o, b) ? "#fff1a8" : tower ? TOWER[id % TOWER.length] : WALLS[id % WALLS.length];
  let roof = b.tags.building === "industrial" ? "#9aa3ad" : tower ? "#8fa3ba" : ROOFS[Math.floor(rnd() * ROOFS.length)];
  if (o.snowy) roof = "#f4f8ff";
  const isHome = !!o.homeId && b.id === o.homeId; if (isHome) roof = "#ff2e63";
  const cen = base.reduce((a, p) => ({ x: a.x + p.x / base.length, y: a.y + p.y / base.length }), { x: 0, y: 0 });
  const lean = tower ? 0 : (rnd() - .5) * .22, taper = tower ? .07 : 0;
  const T = (p: P): P => { const q = lerp(p, cen, taper); return { x: q.x + lean * h, y: q.y - h }; };
  const topPts = base.map(T);
  const wob = (a: P, b2: P): P => { const m = mid(a, b2), l = Math.hypot(b2.x - a.x, b2.y - a.y) || 1, j = (rnd() - .5) * Math.min(1.8, l * .07); return { x: m.x - (b2.y - a.y) / l * j, y: m.y + (b2.x - a.x) / l * j }; };
  const edges = base.map((p, i) => ({ i, p1: p, p2: base[(i + 1) % base.length], t1: topPts[i], t2: topPts[(i + 1) % base.length] })).sort((a, b2) => (a.p1.y + a.p2.y) - (b2.p1.y + b2.p2.y));
  const front = edges[edges.length - 1];
  for (const e of edges) {
    const { p1, p2, t1, t2 } = e, f = (p2.x - p1.x) + (p2.y - p1.y) >= 0 ? 1 : .78;
    node(g, "polygon", { points: pointsText([p1, wob(p1, p2), p2, t2, wob(t2, t1), t1]), fill: shade(wall, f), stroke: INK, "stroke-width": 1.7, "stroke-linejoin": "round" });
    const len = Math.hypot(p2.x - p1.x, p2.y - p1.y), Q = (t: number, v: number): P => lerp(lerp(p1, p2, t), lerp(t1, t2, t), v);
    if (!o.low && len > 12 && h >= 9) {
      const cols = Math.min(6, Math.floor(len / 9)), rows = Math.max(1, Math.floor((h - 4) / 11));
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const t0 = (c + .28) / cols, t1b = (c + .72) / cols, v0 = (r + .25) / rows * .72 + .22, v1 = (r + .75) / rows * .72 + .22;
        node(g, "polygon", { points: pointsText([Q(t0, v0), Q(t1b, v0), Q(t1b, v1), Q(t0, v1)]), fill: o.night ? "#ffe27a" : "#8cc3e8", stroke: INK, "stroke-width": .8 });
        const a = Q((t0 + t1b) / 2, v0), b3 = Q((t0 + t1b) / 2, v1), l2 = Q(t0, (v0 + v1) / 2), r2 = Q(t1b, (v0 + v1) / 2);
        node(g, "path", { d: `M${f1(a.x)} ${f1(a.y)} L${f1(b3.x)} ${f1(b3.y)} M${f1(l2.x)} ${f1(l2.y)} L${f1(r2.x)} ${f1(r2.y)}`, stroke: INK, "stroke-width": .5, fill: "none" });
      }
    }
    if (!o.low && e === front && !tower && len > 9) { const d0 = .42, d1 = .58; node(g, "polygon", { points: pointsText([Q(d0, 0), Q(d1, 0), Q(d1, .42), Q((d0 + d1) / 2, .5), Q(d0, .42)]), fill: "#7a4a2a", stroke: INK, "stroke-width": 1 }); }
  }
  if (!flat) {
    let q = topPts.map(p => lerp(p, T(cen), 0)); // Dachkanten
    const ov = 1.1, c2 = q.reduce((a, p) => ({ x: a.x + p.x / 4, y: a.y + p.y / 4 }), { x: 0, y: 0 });
    q = q.map(p => ({ x: c2.x + (p.x - c2.x) * ov, y: c2.y + (p.y - c2.y) * ov + 1.2 }));
    const l0 = Math.hypot(q[1].x - q[0].x, q[1].y - q[0].y), l1 = Math.hypot(q[2].x - q[1].x, q[2].y - q[1].y);
    if (l1 > l0) q = [q[1], q[2], q[3], q[0]];
    const rh = Math.max(4, Math.min(13, Math.min(l0, l1) * .5));
    const A = up(mid(q[1], q[2]), rh), B = up(mid(q[3], q[0]), rh);
    const gable = shade(wall, .9);
    node(g, "polygon", { points: pointsText([q[1], q[2], A]), fill: gable, stroke: INK, "stroke-width": 1.5, "stroke-linejoin": "round" });
    node(g, "polygon", { points: pointsText([q[3], q[0], B]), fill: gable, stroke: INK, "stroke-width": 1.5, "stroke-linejoin": "round" });
    const frontFirst = (q[0].y + q[1].y) > (q[2].y + q[3].y);
    const faces: [P[], boolean][] = [[[B, A, q[2], q[3]], !frontFirst], [[q[0], q[1], A, B], frontFirst]];
    for (const [pts, lit] of faces) {
      const col = lit ? roof : shade(roof, .74);
      node(g, "polygon", { points: pointsText([pts[0], wob(pts[0], pts[1]), pts[1], pts[2], wob(pts[2], pts[3]), pts[3]]), fill: col, stroke: INK, "stroke-width": 1.7, "stroke-linejoin": "round" });
      // Dachziegel-Linien
      const [r0, r1, e1, e0] = pts[0] === B ? [B, A, q[2], q[3]] : [q[0], q[1], A, B];
      let d = ""; for (const t of [.34, .67]) { const a = pts[0] === B ? lerp(r0, e0, t) : lerp(r0, e0, t), b3 = pts[0] === B ? lerp(r1, e1, t) : lerp(r1, e1, t); d += `M${f1(a.x)} ${f1(a.y)} L${f1(b3.x)} ${f1(b3.y)}`; }
      node(g, "path", { d, fill: "none", stroke: shade(roof, .55), "stroke-width": .8, opacity: ".8" });
    }
    if (rnd() > .5) { const c = lerp(A, B, .28); node(g, "polygon", { points: pointsText([{ x: c.x - 2, y: c.y + 1 }, { x: c.x + 2.2, y: c.y + 1 }, { x: c.x + 1.8, y: c.y - 7 }, { x: c.x - 2.4, y: c.y - 6 }]), fill: "#a65a42", stroke: INK, "stroke-width": 1.1 }); o.chimneys?.push({ x: c.x, y: c.y - 8 }); }
  } else {
    const flatTop = topPts.map(p => ({ x: cen.x + (p.x - cen.x) * 1.03, y: p.y }));
    node(g, "polygon", { points: pointsText(flatTop), fill: roof, stroke: INK, "stroke-width": 1.7, "stroke-linejoin": "round" });
    if (tower) { const c = topPts.reduce((a, p) => ({ x: a.x + p.x / topPts.length, y: a.y + p.y / topPts.length }), { x: 0, y: 0 }); node(g, "line", { x1: c.x, y1: c.y, x2: c.x, y2: c.y - 10, stroke: INK, "stroke-width": 1.5 }); node(g, "circle", { cx: c.x, cy: c.y - 10, r: 1.8, fill: "#e5322b", stroke: INK, "stroke-width": .8 }); }
  }
  if (b.tags.building === "church" || b.tags.amenity === "place_of_worship") steeple(g, lerp(base[0], cen, .4), h, o.K, o.snowy);
}
