import { opts } from "../options";
import { state } from "../state";
import { INK, node } from "../util";
import { L, compass, fmtTemp, fmtTime, fmtWind, labelWeather } from "../weather/format";
import { kindOf, miniIcon } from "../weather/icons";

/** Wetter als Comic-Sprechblase im Bild. */
export function weatherBubble(layer: Element) {
  const w = state.weatherNow; if (!w || !opts.wetter) return;
  const rows: { t: string; big?: boolean }[] = [];
  if (opts.temperatur) { rows.push({ t: fmtTemp(w.temperature), big: true }); rows.push({ t: labelWeather(w.code) }); }
  if (opts.wind) rows.push({ t: `${L("wind")} ${fmtWind(w.wind)} ${compass(w.direction)}` });
  if (opts.zeit) rows.push({ t: `${L("stand")} ${fmtTime(w.time)}` });
  if (!rows.length) return;
  const pad = 14, icon = opts.temperatur ? 46 : 0, width = Math.max(150, icon + 12 + Math.max(...rows.map(r => r.t.length * (r.big ? 17 : 8.2)))) + pad * 2 - 10;
  const height = pad * 2 + rows.reduce((n, r) => n + (r.big ? 34 : 19), 0) - 2;
  const [v, h] = opts.textpos.split("-"), x = h === "links" ? 24 : 1000 - 24 - width, y = v === "oben" ? 24 : 560 - 24 - height - (opts.vorhersage !== "aus" ? 72 : 0);
  const g = node(layer, "g", { transform: `translate(${x} ${y})` });
  node(g, "rect", { x: 3, y: 4, width, height, rx: 18, fill: INK, opacity: ".25" });
  node(g, "rect", { width, height, rx: 18, fill: "#fff", stroke: INK, "stroke-width": 3.5 });
  const font = "'Comic Sans MS','Chalkboard SE',system-ui,sans-serif";
  if (icon) miniIcon(g, kindOf(w.code, w.day), pad + 22, pad + 26, 1.5);
  let yy = pad;
  for (const r of rows) {
    yy += r.big ? 31 : 17;
    const t = node(g, "text", { x: pad + icon + (icon ? 6 : 0), y: yy - (r.big ? 3 : 2), "font-size": r.big ? 31 : 14, "font-weight": r.big ? 900 : 700, "font-family": font, fill: INK }); t.textContent = r.t;
    yy += r.big ? 3 : 2;
  }
}
