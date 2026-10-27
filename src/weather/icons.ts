import { INK, node } from "../util";

// ---------- Mini-Comic-Icons (für Karten und Sprechblase) ----------
export function kindOf(code: number, day: number) {
  if ([95, 96, 99].includes(code)) return "storm"; if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rain"; if ([45, 48].includes(code)) return "fog";
  if (code === 3) return "cloud"; if (code === 1 || code === 2) return day ? "partly" : "cloud"; return day ? "sun" : "moon";
}

export function miniCloud(g: Element, x: number, y: number, s: number, fill = "#e9eff6") {
  const parts: [string, Record<string, number>][] = [["circle", { cx: x - 8 * s, cy: y, r: 7 * s }], ["circle", { cx: x, cy: y - 5 * s, r: 9 * s }], ["circle", { cx: x + 9 * s, cy: y - .5 * s, r: 6.5 * s }], ["rect", { x: x - 14 * s, y: y - 1 * s, width: 28 * s, height: 8 * s, rx: 4 * s }]];
  for (const [n, a] of parts) node(g, n, { ...a, fill: INK, stroke: INK, "stroke-width": 3.2 });
  for (const [n, a] of parts) node(g, n, { ...a, fill });
  node(g, "path", { d: `M${x - 3 * s} ${y - 10 * s} q${4 * s} -1 ${6 * s} ${2 * s}`, fill: "none", stroke: INK, "stroke-width": 1.2, "stroke-linecap": "round" });
}

export function miniIcon(layer: Element, kind: string, x: number, y: number, s = 1) {
  const g = node(layer, "g", {});
  const sun = (cx: number, cy: number, k: number) => { const p: string[] = []; for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, r = (i % 2 ? 9 : 15) * k; p.push(`${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`); }
    node(g, "polygon", { points: p.join(" "), fill: "#ffb62e", stroke: INK, "stroke-width": 1.6, "stroke-linejoin": "round" }); node(g, "circle", { cx, cy, r: 8 * k, fill: "#ffe45e", stroke: INK, "stroke-width": 1.6 }); };
  if (kind === "sun") sun(x, y, s);
  else if (kind === "moon") node(g, "path", { d: `M${x + 3 * s} ${y - 15 * s} A${15 * s} ${15 * s} 0 1 0 ${x + 3 * s} ${y + 15 * s} A${11 * s} ${11 * s} 0 1 1 ${x + 3 * s} ${y - 15 * s} Z`, fill: "#fff3b0", stroke: INK, "stroke-width": 1.8, "stroke-linejoin": "round" });
  else if (kind === "partly") { sun(x + 6 * s, y - 6 * s, .8 * s); miniCloud(g, x - 1 * s, y + 5 * s, .85 * s); }
  else {
    miniCloud(g, x, y - 3 * s, .95 * s, kind === "storm" ? "#c3ced9" : "#e9eff6");
    if (kind === "rain") for (const dx of [-8, 0, 8]) node(g, "path", { d: "M0 -5 C1 -2 3 0 3 2 A3 3 0 0 1 -3 2 C-3 0 -1 -2 0 -5 Z", transform: `translate(${x + dx * s} ${y + 11 * s}) scale(${s})`, fill: "#6ec1ff", stroke: INK, "stroke-width": 1.1 });
    if (kind === "snow") for (const dx of [-8, 0, 8]) node(g, "circle", { cx: x + dx * s, cy: y + (dx === 0 ? 14 : 11) * s, r: 2.6 * s, fill: "#fff", stroke: INK, "stroke-width": 1.1 });
    if (kind === "storm") node(g, "path", { d: "M0 0 L-6 11 L-1 11 L-4 20 L6 7 L1 7 L5 0 Z", transform: `translate(${x} ${y + 5 * s}) scale(${s * .8})`, fill: "#ffe23d", stroke: INK, "stroke-width": 1.4, "stroke-linejoin": "round" });
    if (kind === "fog") for (const [dy, w] of [[8, 22], [13, 16]]) node(g, "path", { d: `M${x - w / 2 * s} ${y + dy * s} h${w * s}`, stroke: INK, "stroke-width": 2.2 * s, "stroke-linecap": "round" });
  }
}
