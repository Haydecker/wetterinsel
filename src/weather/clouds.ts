import { INK, f1, node, rng } from "../util";

/** Comic-Wolke nach Vorlage: weißer Aufkleber-Rand, dicke Kontur, hellblauer Körper, bläulicher Schatten, geschwungene Innenlinien. */
export function cloudShape(parent: Element, x: number, y: number, s: number, seed: number, dark = false) {
  const r = rng(seed), n = 5 + Math.floor(r() * 2), w = 150 * s;
  const puffs: { cx: number; cy: number; r: number }[] = [];
  for (let i = 0; i < n; i++) { const t = i / (n - 1), hump = Math.sin(t * Math.PI); puffs.push({ cx: (t - .5) * w, cy: -hump * 26 * s * (.6 + r() * .6), r: (17 + hump * 21 + r() * 7) * s }); }
  const g = node(parent, "g", { transform: `translate(${x} ${y})` });
  const rect = { x: -w * .56, y: -4 * s, width: w * 1.12, height: 24 * s, rx: 12 * s };
  const body = dark ? "#c3ced9" : "#e9eff6", shadow = dark ? "#7f93a8" : "#a9c0d0";
  node(g, "rect", { ...rect, fill: "#fff", stroke: "#fff", "stroke-width": 13 });
  for (const p of puffs) node(g, "circle", { cx: p.cx, cy: p.cy, r: p.r, fill: "#fff", stroke: "#fff", "stroke-width": 13 });
  node(g, "rect", { ...rect, fill: INK, stroke: INK, "stroke-width": 6.5 });
  for (const p of puffs) node(g, "circle", { cx: p.cx, cy: p.cy, r: p.r, fill: INK, stroke: INK, "stroke-width": 6.5 });
  node(g, "rect", { ...rect, fill: shadow });
  for (const p of puffs) node(g, "circle", { cx: p.cx, cy: p.cy, r: p.r, fill: shadow });
  for (const p of puffs) node(g, "circle", { cx: p.cx - p.r * .13, cy: p.cy - p.r * .17, r: p.r * .88, fill: body });
  node(g, "rect", { x: rect.x + 5 * s, y: -9 * s, width: rect.width - 10 * s, height: 16 * s, rx: 8 * s, fill: body });
  puffs.forEach((p, i) => { if (i === 0 || i === n - 1) return; const a1 = (195 + r() * 15) * Math.PI / 180, a2 = a1 + (55 + r() * 25) * Math.PI / 180, q = p.r * .7;
    node(g, "path", { d: `M${f1(p.cx + Math.cos(a1) * q)} ${f1(p.cy + Math.sin(a1) * q)} A${f1(q)} ${f1(q)} 0 0 1 ${f1(p.cx + Math.cos(a2) * q)} ${f1(p.cy + Math.sin(a2) * q)}`, fill: "none", stroke: INK, "stroke-width": 2.6, "stroke-linecap": "round" }); });
}
