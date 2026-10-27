import { INK, node } from "../util";

export function tree(g: Element, x: number, y: number, s: number, seed: number, snowy: boolean) {
  const t = node(g, "g", { class: "tree", style: `animation-delay:${-(seed % 40) / 10}s` });
  const dark = snowy ? "#9fb9b0" : "#2f8f3a", mid2 = snowy ? "#cfe0d8" : "#4fc04a", light = snowy ? "#f4faf8" : "#8fe06a";
  node(t, "ellipse", { cx: x, cy: y + 1, rx: s * 1.1, ry: s * .4, fill: "#2a2438", opacity: ".18" });
  node(t, "line", { x1: x, y1: y, x2: x, y2: y - s * 1.1, stroke: "#6b4426", "stroke-width": 2.4, "stroke-linecap": "round" });
  for (const [dx, dy, r, c] of [[-.65, -1.05, .75, dark], [.65, -1.05, .75, dark], [0, -1.6, 1, mid2]] as [number, number, number, string][])
    node(t, "circle", { cx: x + dx * s, cy: y + dy * s, r: r * s, fill: c, stroke: INK, "stroke-width": 1.1 });
  node(t, "circle", { cx: x - s * .3, cy: y - s * 1.9, r: s * .35, fill: light, opacity: ".8" });
}

export function bush(g: Element, x: number, y: number, s: number, snowy: boolean) {
  const t = node(g, "g", {});
  node(t, "ellipse", { cx: x, cy: y + 1, rx: s * 1.3, ry: s * .45, fill: INK, opacity: ".15" });
  for (const [dx, dy, r] of [[-.7, -.6, .8], [.7, -.6, .8], [0, -1, 1]] as [number, number, number][]) node(t, "circle", { cx: x + dx * s, cy: y + dy * s, r: r * s, fill: snowy ? "#dfece6" : "#3fae45", stroke: INK, "stroke-width": 1 });
  node(t, "circle", { cx: x - s * .3, cy: y - s * 1.3, r: s * .3, fill: snowy ? "#fff" : "#7fdc6a", opacity: ".8" });
}
