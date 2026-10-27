import { LatLon, P, Shape } from "../types";
import { KIOSK, opts } from "../options";
import { $, svg } from "../dom";
import { state } from "../state";
import { INK, distSeg, inPoly, node, rng, smooth } from "../util";
import { dayInfo, skyColors } from "../weather/daytime";
import { forecastStrip } from "../ui/forecast";
import { weatherBubble } from "../ui/bubble";
import { drawWeather } from "../weather/effects";
import { CX, CY, ELLIPSE, RX, RY, sideOf } from "../map/geometry";
import { house } from "../map/buildings";
import { bush, tree } from "../map/vegetation";
import { setVB } from "../ui/zoom";
import { drawCompass } from "./compass";
import { moonBadge } from "../weather/effects";
import { drawBirds } from "../weather/birds";
import { Features, drawAreas, drawHedges, drawPower, drawRails, drawStreams, drawTrain, makeBlocker, on, splitFeatures, stopSign } from "./features";
import { drawLakes } from "./lakes";
import { drawCars, drawLamps, drawSmoke, drawWater, fence, planFences } from "./details";

export function drawBackdrop(svg: SVGSVGElement, night: boolean, rnd: () => number, bg: string, sky2: [string, string]) {
  if (bg === "transparent") return;
  const k = KIOSK, x = k ? -3000 : 0, y = k ? -3000 : 0, width = k ? 7000 : 1000, height = k ? 7000 : 560, rx = k ? 0 : 18;
  if (bg) { const col = /^[0-9a-f]{3}$|^[0-9a-f]{6}$|^[0-9a-f]{8}$/.test(bg) ? `#${bg}` : bg; if (CSS.supports("color", col)) { node(svg, "rect", { x, y, width, height, rx, fill: col }); return; } }
  const sky = node(svg, "linearGradient", { id: "sky", gradientUnits: "userSpaceOnUse", x1: "0", y1: "0", x2: "0", y2: "560" });
  node(sky, "stop", { offset: "0%", "stop-color": sky2[0] }); node(sky, "stop", { offset: "100%", "stop-color": sky2[1] });
  node(svg, "rect", { x, y, width, height, rx, fill: "url(#sky)" });
  if (night) for (let i = 0; i < 40; i++) node(svg, "circle", { cx: rnd() * 1000, cy: rnd() * 150, r: .8 + rnd() * 1.2, fill: "#fff", opacity: ".8" });
}

export function draw(shapes: Shape[], c: LatLon) {
  svg.replaceChildren(); setVB(); svg.classList.toggle("noanim", !opts.animation);
  const w = state.weatherNow, di = dayInfo(w), night = di.night;
  const snowy = !!w && [71, 73, 75, 77, 85, 86].includes(w.code);
  const wet = !!w && ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(w.code) || w.rain > 0.1);
  svg.style.setProperty("--sway", `${Math.max(1.4, 6 - (w?.wind ?? 0) / 8)}s`);
  svg.style.setProperty("--deg", `${Math.min(7, 1.5 + (w?.wind ?? 0) / 8)}deg`);
  const defs = node(svg, "defs"), grad = node(defs, "linearGradient", { id: "grass", x1: "0", y1: "0", x2: "0", y2: "1" });
  node(grad, "stop", { offset: "0%", "stop-color": snowy ? "#f1f7fa" : "#9be35f" }); node(grad, "stop", { offset: "100%", "stop-color": snowy ? "#d6e6ee" : "#5cb83f" });
  const clip = node(defs, "clipPath", { id: "clip" }); node(clip, "path", { d: ELLIPSE });
  drawBackdrop(svg, night, rng(7), opts.bg, skyColors(night, di.twilight));
  const fc = opts.vorhersage !== "aus", rootT = fc && opts.kompass ? "translate(500 262) scale(.74) translate(-500 -262)" : fc ? "translate(500 250) scale(.86) translate(-500 -250)" : opts.kompass ? "translate(500 280) scale(.9) translate(-500 -280)" : "";
  const root = node(svg, "g", rootT ? { transform: rootT } : {});
  if (opts.kompass) drawCompass(root, w); else node(root, "ellipse", { cx: CX, cy: CY + 255, rx: RX * .95, ry: 22, fill: INK, opacity: ".2" });
  node(root, "path", { d: sideOf(36), fill: "#8a5a32", stroke: INK, "stroke-width": 3.5, "stroke-linejoin": "round" });
  node(root, "path", { d: sideOf(18), fill: "#b27a45", stroke: INK, "stroke-width": 3, "stroke-linejoin": "round" });
  node(root, "path", { d: ELLIPSE, fill: "url(#grass)", stroke: INK, "stroke-width": 3.5 });
  const map = node(root, "g", { "clip-path": "url(#clip)" });
  const rnd = rng(11);
  for (let i = 0; i < 90; i++) node(map, "path", { d: `M${110 + rnd() * 780} ${100 + rnd() * 370} l3 -5 l3 5`, fill: "none", stroke: snowy ? "#c4d6df" : "#4ea53a", "stroke-width": 1.2, opacity: ".6", "stroke-linecap": "round" });
  const S = 1.45 * 200 / opts.radius, K = Math.max(.45, S / 1.45), projected = shapes.map(s => ({ ...s, points: s.points.map(p => ({ x: p.x * S + CX, y: p.y * S + CY })) }));
  const feat: Features = splitFeatures(projected), blocked = makeBlocker(feat, K);
  const lakesP = on("gewaesser") ? state.lastLakes.map(l => ({ rings: l.rings.map(r => r.map(p => ({ x: p.x * S + CX, y: p.y * S + CY }))) })) : [];
  const inLake = drawLakes(map, defs, lakesP);
  const greens = projected.filter(s => s.kind === "green" || (s.kind === "water" && on("gewaesser")));
  for (const s of greens) if (s.points.length > 2) {
    const wt = s.kind === "water";
    const d0 = smooth(s.points.slice(0, -1), true);
    node(map, "path", { d: d0, fill: wt ? "#3fb8c9" : snowy ? "#e4eff2" : "#6fc94a", stroke: INK, "stroke-width": 1.8, "stroke-linejoin": "round" });
    if (wt) { const m0 = s.points[0]; node(map, "path", { d: `M${m0.x + 4} ${m0.y + 5} q6 -4 12 0 t12 0`, fill: "none", stroke: "#d8f6fb", "stroke-width": 1.4, "stroke-linecap": "round" }); }
  }
  drawAreas(map, feat.areas, defs, snowy, K);
  drawStreams(map, feat.streams, K);
  const roads = projected.filter(s => s.kind === "road");
  const PATHS = ["footway", "path", "steps", "pedestrian", "track", "cycleway", "bridleway"], isPath = (s: Shape) => PATHS.includes(s.tags.highway ?? "");
  const roadW0 = (h?: string) => ["motorway", "trunk", "primary", "secondary"].includes(h ?? "") ? 10 : ["tertiary", "residential", "unclassified", "living_street"].includes(h ?? "") ? 6.5 : PATHS.includes(h ?? "") ? 2.4 : 3.6;
  const roadW = (h?: string) => roadW0(h) * Math.max(.55, K);
  const roadD = roads.map(r => smooth(r.points, false));
  const pass = (stroke: string | ((s: Shape) => string), add: number, extra: Record<string, string | number> = {}) => roads.forEach((s, i) => node(map, "path", { d: roadD[i], fill: "none", stroke: typeof stroke === "string" ? stroke : stroke(s), "stroke-width": roadW(s.tags.highway) + add, "stroke-linecap": "round", "stroke-linejoin": "round", ...extra }));
  pass(INK, 3.4); pass(s => isPath(s) ? "#f6ecc8" : "#efe9d6", 1.8); pass(s => isPath(s) ? (snowy ? "#f2f2ee" : "#e2c98e") : wet ? "#7d889f" : snowy ? "#e8eef4" : "#aab6c8", -.2);
  roads.forEach((s, i) => { if (roadW0(s.tags.highway) >= 6.5) node(map, "path", { d: roadD[i], fill: "none", stroke: "#fff", "stroke-width": 1.1, "stroke-dasharray": "5 5", opacity: ".85", "stroke-linecap": "round" }); });
  roads.forEach((s, i) => { if (s.tags.bridge && s.tags.bridge !== "no") { const w0 = roadW(s.tags.highway), d = { d: roadD[i], fill: "none", "stroke-linecap": "butt" };
    node(map, "path", { ...d, stroke: INK, opacity: ".25", "stroke-width": w0 + 6, transform: "translate(0 5)" });
    node(map, "path", { ...d, stroke: INK, "stroke-width": w0 + 5 }); node(map, "path", { ...d, stroke: "#d9c9a6", "stroke-width": w0 + 3 });
    node(map, "path", { ...d, stroke: wet ? "#7d889f" : "#aab6c8", "stroke-width": Math.max(1, w0 - .6) }); } });
  drawRails(map, feat, K, snowy); drawTrain(map, feat.rails);
  drawHedges(map, feat.hedges, K, snowy);
  drawWater(map, greens.filter(g2 => g2.kind === "water"), inPoly);
  drawCars(map, roads, roadW, night);
  if (night || di.twilight > .3) drawLamps(map, roads, roadW);
  // Gebäude + Bäume gemeinsam nach Tiefe sortieren
  const buildings = projected.filter(s => s.kind === "building" && s.points.length >= 3);
  const bbox = buildings.map(b => ({ x0: Math.min(...b.points.map(p => p.x)), x1: Math.max(...b.points.map(p => p.x)), y0: Math.min(...b.points.map(p => p.y)) - 36, y1: Math.max(...b.points.map(p => p.y)) }));
  const onRoad = (p: P, extra = 6) => roads.some(r => { const lim = roadW(r.tags.highway) / 2 + extra; for (let i = 1; i < r.points.length; i++) if (distSeg(p, r.points[i - 1], r.points[i]) < lim) return true; return false; });
  const free = (p: P, pad = 7) => !bbox.some(b => p.x > b.x0 - pad && p.x < b.x1 + pad && p.y > b.y0 - pad && p.y < b.y1 + pad) && !onRoad(p) && !blocked(p) && !inLake(p) && !greens.some(g2 => g2.kind === "water" && inPoly(p, g2.points));
  const inIsland = (p: P) => ((p.x - CX) / RX) ** 2 + ((p.y - CY) / RY) ** 2 < .92;
  const trees: { x: number; y: number; s: number; seed: number }[] = [];
  const tr = rng(99);
  for (const g2 of greens) if (g2.kind === "green" && g2.tags.natural !== "wetland" && g2.points.length > 2) {
    const xs = g2.points.map(p => p.x), ys2 = g2.points.map(p => p.y);
    for (let y = Math.min(...ys2); y < Math.max(...ys2); y += 13) for (let x = Math.min(...xs); x < Math.max(...xs); x += 13) {
      const p = { x: x + tr() * 9, y: y + tr() * 9 };
      if (trees.length < 260 && inPoly(p, g2.points) && inIsland(p) && free(p, 3)) trees.push({ ...p, s: 4.5 + tr() * 3, seed: Math.floor(tr() * 400) });
    }
  }
  buildings.forEach((b, i) => { for (let k = 0; k < 2 && trees.length < 320; k++) { const a = tr() * 6.28, d = Math.max(bbox[i].x1 - bbox[i].x0, 10) * .5 + 8 + tr() * 8; const p = { x: (bbox[i].x0 + bbox[i].x1) / 2 + Math.cos(a) * d, y: bbox[i].y1 + Math.sin(a) * d * .5 }; if (tr() > .45 && inIsland(p) && free(p, 4)) trees.push({ ...p, s: 4 + tr() * 2.5, seed: Math.floor(tr() * 400) }); } });
  for (let n = 0; n < 700 && trees.length < 420; n++) { const p = { x: CX + (tr() * 2 - 1) * RX, y: CY + (tr() * 2 - 1) * RY }; if (inIsland(p) && free(p, 6)) trees.push({ ...p, s: 4 + tr() * 3, seed: Math.floor(tr() * 400) }); }
  const bushes: { x: number; y: number; s: number }[] = [];
  for (let n = 0; n < 900 && bushes.length < 220 && buildings.length; n++) { const bb = bbox[Math.floor(tr() * buildings.length)], p = { x: bb.x0 - 3 + tr() * (bb.x1 - bb.x0 + 6), y: bb.y1 + 2 + tr() * 4 }; if (inIsland(p) && !onRoad(p, 3) && !blocked(p) && !bbox.some(b => b !== bb && p.x > b.x0 && p.x < b.x1 && p.y > b.y0 + 30 && p.y < b.y1)) bushes.push({ ...p, s: 2.6 + tr() * 2 }); }
  const home = buildings.map((b, i) => ({ i, d: Math.hypot((bbox[i].x0 + bbox[i].x1) / 2 - CX, bbox[i].y1 - CY) })).sort((a, b) => a.d - b.d)[0];
  if (home) { const hb = bbox[home.i], hx = (hb.x0 + hb.x1) / 2, hy = hb.y1 - 3, gr = Math.max((hb.x1 - hb.x0) * 1.2 + 26, 44);
    node(map, "ellipse", { class: "home-glow", cx: hx, cy: hy, rx: gr * .95, ry: gr * .48, fill: "#fff2a0", stroke: INK, "stroke-width": 1.8 }); }
  const items: { y: number; run: () => void }[] = [];
  const chimneys: P[] = [], o = { snowy, night, wet, K, low: buildings.length > 450, homeId: home ? buildings[home.i].id : "", chimneys };
  const maxY = (b: Shape) => b.points.reduce((n, p) => Math.max(n, p.y), -1e9);
  for (const b of buildings) items.push({ y: maxY(b), run: () => house(map, b, o) });
  for (const t of trees) items.push({ y: t.y, run: () => tree(map, t.x, t.y, t.s * Math.max(.6, K), t.seed, snowy) });
  for (const u of bushes) items.push({ y: u.y, run: () => bush(map, u.x, u.y, u.s * Math.max(.7, K), snowy) });
  for (const st of feat.stops) items.push({ y: st.points[0].y, run: () => stopSign(map, st, K) });
  for (const f of planFences(bbox, onRoad, inIsland)) items.push({ y: f.y, run: () => fence(map, f, snowy) });
  items.sort((a, b) => a.y - b.y).forEach(i => i.run());
  const smokers = chimneys.filter(c => inIsland({ x: c.x, y: c.y + 8 })), step = Math.max(1, Math.ceil(smokers.length / 36));
  drawSmoke(root, smokers.filter((_, i) => i % step === 0), w); drawPower(root, feat.power, K);
  if (night) node(root, "path", { d: ELLIPSE, fill: "#0b1e4a", opacity: (.28 * (1 - di.twilight * .6)).toFixed(2), "pointer-events": "none", style: "mix-blend-mode:multiply" });
  else if (di.twilight > 0) node(root, "path", { d: ELLIPSE, fill: "#ff9d4d", opacity: (.18 * di.twilight).toFixed(2), "pointer-events": "none", style: "mix-blend-mode:multiply" });
  const overlay = node(svg, "g", { "pointer-events": "none" }); drawBirds(overlay, w); drawWeather(overlay); if (opts.mondphase && state.weatherNow) moonBadge(overlay); weatherBubble(overlay); forecastStrip(overlay);
  if (KIOSK) { const at = node(svg, "text", { x: 996, y: 553, "text-anchor": "end", "font-size": 9, fill: night ? "#fff" : INK, opacity: ".55", "font-family": "system-ui,sans-serif" }); at.textContent = "© OpenStreetMap · Open-Meteo"; }
  state.drawn = true;
  $("stats").textContent = `${buildings.length} Gebäude · ${roads.length} Straßenabschnitte · ${c.lat.toFixed(4)}, ${c.lon.toFixed(4)}`;
  $("attribution").innerHTML = 'Kartendaten: © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap-Mitwirkende</a> · Wetter: <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>';
}
