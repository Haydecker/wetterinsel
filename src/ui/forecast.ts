import { Weather } from "../types";
import { tr } from "../i18n";
import { opts } from "../options";
import { $ } from "../dom";
import { state } from "../state";
import { INK, node } from "../util";
import { fmtTemp, iconWeather } from "../weather/format";
import { kindOf, miniIcon } from "../weather/icons";

// ---------- Vorhersage ----------
export type Card = { title: string; icon: string; kind: string; t1: string; t2: string };

export function hourCards(w: Weather, n = 6): Card[] {
  const h = w.hourly; if (!h) return [];
  const from = Math.max(0, h.time.findIndex(t => t > w.time.slice(0, 13) + ":00")), out: Card[] = [];
  for (let i = from; i < h.time.length && out.length < n; i += 2) out.push({ title: opts.sprache === "de" ? `${h.time[i].slice(11, 13)} Uhr` : h.time[i].slice(11, 16), icon: iconWeather(h.code[i], h.day[i]), kind: kindOf(h.code[i], h.day[i]), t1: fmtTemp(h.temp[i]), t2: `💧 ${h.pop[i] ?? 0}%` });
  return out;
}

export function dayCards(w: Weather, n = 5): Card[] {
  const d = w.daily; if (!d) return [];
  return d.time.slice(0, n).map((t, i) => ({ title: i === 0 ? tr("today") : new Date(t + "T12:00").toLocaleDateString(opts.sprache, { weekday: "short" }), icon: iconWeather(d.code[i], 1), kind: kindOf(d.code[i], 1), t1: `${fmtTemp(d.max[i])} / ${fmtTemp(d.min[i])}`.replace(/°[CF]/g, "°"), t2: `💧 ${d.pop[i] ?? 0}%` }));
}

export function renderForecast(w: Weather) {
  const chip = (c: Card) => `<div class="fc-card"><b>${c.title}</b><span class="fc-i">${c.icon}</span><em>${c.t1}</em><small>${c.t2}</small></div>`;
  $("fc-hours").innerHTML = hourCards(w, 8).map(chip).join("") || `<small>${tr("fc_none")}</small>`;
  $("fc-days").innerHTML = dayCards(w, 5).map(chip).join("");
}

export function forecastStrip(layer: Element) {
  const w = state.weatherNow; if (!w || opts.vorhersage === "aus") return;
  const cards = opts.vorhersage === "tage" ? dayCards(w, 5) : hourCards(w, 6); if (!cards.length) return;
  const cw = opts.vorhersage === "tage" ? 140 : 120, gap = 10, total = cards.length * cw + (cards.length - 1) * gap, x0 = (1000 - total) / 2, y0 = 494, font = "'Comic Sans MS','Chalkboard SE',system-ui,sans-serif";
  cards.forEach((c, i) => {
    const g = node(layer, "g", { transform: `translate(${x0 + i * (cw + gap)} ${y0})` });
    node(g, "rect", { x: 3, y: 4, width: cw, height: 62, rx: 14, fill: INK, opacity: ".25" });
    node(g, "rect", { width: cw, height: 62, rx: 14, fill: i === 0 ? "#fff6c9" : "#fff", stroke: INK, "stroke-width": 3 });
    miniIcon(g, c.kind, 25, 34, 1.15);
    for (const [t, yy, fs, fw] of [[c.title, 18, 12, 900], [c.t1, 36, 14, 900], [c.t2, 53, 11, 700]] as [string, number, number, number][]) { const e = node(g, "text", { x: 48, y: yy, "font-size": fs, "font-weight": fw, "font-family": font, fill: INK }); e.textContent = t; }
  });
}
