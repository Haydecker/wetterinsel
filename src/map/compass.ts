import { Weather } from "../types";
import { opts } from "../options";
import { INK, node } from "../util";
import { CX, CY, RX, RY } from "./geometry";
import { groundToScreen } from "../weather/wind";

/** Kompass-Scheibe unter der Insel: größer als die Insel, mit Himmelsrichtungen und Windpfeil. */
export function drawCompass(root: Element, w: Weather | null) {
  const cy = CY + 18, rx = RX * 1.17, ry = 275, font = "'Comic Sans MS','Chalkboard SE',system-ui,sans-serif";
  const at = (bearing: number, f: number) => { const a = bearing * Math.PI / 180, vx = Math.sin(a), vy = Math.cos(a); return { x: CX + (vx - vy) * rx / Math.SQRT2 * f, y: cy - (vx + vy) / 2 * ry * Math.SQRT2 * f }; };
  node(root, "ellipse", { cx: CX, cy: cy + 14, rx, ry, fill: INK, opacity: ".2" });
  node(root, "ellipse", { cx: CX, cy: cy + 8, rx, ry, fill: "#c9b48a", stroke: INK, "stroke-width": 3 });
  node(root, "ellipse", { cx: CX, cy, rx, ry, fill: "#fff6d8", stroke: INK, "stroke-width": 3 });
  node(root, "ellipse", { cx: CX, cy, rx: rx * .93, ry: ry * .93, fill: "none", stroke: INK, "stroke-width": 1.2, "stroke-dasharray": "3 5", opacity: ".6" });
  for (let b = 0; b < 360; b += 15) { const major = b % 90 === 0, mid = b % 45 === 0, p1 = at(b, major ? .935 : .965), p2 = at(b, 1);
    node(root, "line", { x1: p1.x.toFixed(1), y1: p1.y.toFixed(1), x2: p2.x.toFixed(1), y2: p2.y.toFixed(1), stroke: INK, "stroke-width": major ? 2.4 : mid ? 1.8 : 1, "stroke-linecap": "round", opacity: major || mid ? 1 : .55 }); }
  const names = opts.sprache === "de" ? ["N", "O", "S", "W"] : ["N", "E", "S", "W"];
  names.forEach((n, i) => { const p = at(i * 90, .9), t = node(root, "text", { x: p.x.toFixed(1), y: (p.y + 7).toFixed(1), "text-anchor": "middle", "font-size": 23, "font-weight": 900, "font-family": font, fill: i === 0 ? "#e5322b" : INK, stroke: "#fff6d8", "stroke-width": 4, "paint-order": "stroke" }); t.textContent = n; });
  // Windpfeil: kommt von außen, zeigt in Wehrichtung
  if (w && w.wind >= 1) {
    const from = at(w.direction, .93), v = groundToScreen((w.direction + 180) % 360), g = node(root, "g", { transform: `translate(${from.x.toFixed(1)} ${from.y.toFixed(1)}) rotate(${v.angle.toFixed(1)})` });
    node(g, "path", { d: "M-18 -4 H6 V-10 L20 0 L6 10 V4 H-18 Z", fill: "#6ec1ff", stroke: INK, "stroke-width": 2, "stroke-linejoin": "round" });
  }
}
