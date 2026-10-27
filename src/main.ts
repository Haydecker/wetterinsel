import "./styles.css";
import { LatLon } from "./types";
import { KIOSK, opts } from "./options";
import { $, address } from "./dom";
import { state } from "./state";
import { message } from "./ui/status";
import { shapesFrom } from "./map/projection";
import { osm, lakes } from "./api/osm";
import { lakesFrom } from "./map/lakes";
import { sleep } from "./util";
import { geocode } from "./api/geocoding";
import { fetchWeather } from "./api/weather";
import { setWeather } from "./ui/weather-panel";
import { draw } from "./map/island";
import { applyZoomMode, resetView, wireZoom } from "./ui/zoom";
import { formToOpts, updateUrl, wireForm } from "./ui/form";

import "./styles.css";

// ---------- Steuerung ----------
let weatherTimer: number | undefined, lastGeocoded = "";

const urlHasAddr = /(^|[?&])(adresse|address|ort)=/i.test(location.search);

async function loadAll(mode: "address" | "url" | "center" = "address") {
  const id = ++state.runId;
  $("create").setAttribute("disabled","true"); $("reload").setAttribute("disabled","true");
  try {
    let found: { point: LatLon; label: string };
    if (mode === "center" && state.center) found = { point: state.center, label: $("place").textContent ?? "" };
    else if (mode === "url" && opts.lat != null && opts.lon != null) found = { point: { lat: opts.lat, lon: opts.lon }, label: `${opts.lat.toFixed(4)}, ${opts.lon.toFixed(4)}` };
    else {
      const q = address.value.trim(); if (!q) { message("Bitte eine Adresse eingeben.", "error"); return; }
      message("Suche Adresse …"); opts.adresse = q; found = await geocode(q); lastGeocoded = q;
    }
    if (mode !== "center") resetView();
    state.center = found.point; $("place").textContent = found.label; message("Lade Gebäude, Straßen und Wetter …");
    state.lastLakes = [];
    const lk = lakes(found.point).then(e => lakesFrom(e, found.point)).catch(() => []);
    const [elements, w] = await Promise.all([osm(found.point, id), fetchWeather(found.point).catch(() => null)]);
    if (id !== state.runId) return;
    state.lastLakes = (await Promise.race([lk, sleep(15000).then(() => null)])) ?? [];
    void lk.then(l => { if (id === state.runId && l.length && !state.lastLakes.length) { state.lastLakes = l; rerender(); } });
    const shapes = shapesFrom(elements, found.point);
    if (!shapes.some(s => s.kind === "building")) throw new Error("Keine Gebäudeumrisse im Ausschnitt gefunden.");
    state.lastShapes = shapes; opts.lat = found.point.lat; opts.lon = found.point.lon;
    if (w) setWeather(w); else if (state.weatherRaw) setWeather(state.weatherRaw);
    draw(shapes, found.point); updateUrl();
    if (w) message("Wetterinsel erfolgreich erstellt.", "success"); else message("Insel erstellt, aber die Wetterdaten sind gerade nicht erreichbar. Mit „Aktualisieren“ erneut versuchen.", "error");
  } catch (e) { if (String(e).includes("abgebrochen")) return; message(e instanceof Error ? e.message : "Unbekannter Fehler.", "error"); }
  finally { if (id === state.runId) { $("create").removeAttribute("disabled"); $("reload").removeAttribute("disabled"); } }
}

async function weatherOnly() {
  if (!state.center) { await loadAll(); return; }
  $("weather-reload").setAttribute("disabled","true");
  try { setWeather(await fetchWeather(state.center)); draw(state.lastShapes, state.center); message("Wetter aktualisiert.", "success"); }
  catch (e) { message(e instanceof Error ? e.message : "Wetter konnte nicht aktualisiert werden.", "error"); }
  finally { $("weather-reload").removeAttribute("disabled"); }
}

/** „Aktualisieren“: alle Formularwerte übernehmen und Insel (inkl. Daten) neu aufbauen. */
function applyAll() {
  formToOpts(); armTimer(); applyZoomMode(); updateUrl();
  const q = address.value.trim();
  void loadAll(q && q !== lastGeocoded ? "address" : state.center ? "center" : "address");
}
function rerender() { if (state.weatherRaw) setWeather(state.weatherRaw); if (state.center && state.lastShapes.length) draw(state.lastShapes, state.center); }

function armTimer() { clearInterval(weatherTimer); if (opts.refresh > 0) weatherTimer = window.setInterval(() => { if (state.center && !document.hidden) void weatherOnly(); }, opts.refresh * 60000); }

if (KIOSK) {
  document.body.classList.add("kiosk");
  const solid = opts.bg === "transparent" ? "transparent" : opts.bg ? (/^[0-9a-f]{3,8}$/.test(opts.bg) ? `#${opts.bg}` : opts.bg) : "";
  document.documentElement.style.background = solid || "transparent"; document.body.style.background = solid || "transparent";
}

address.value = opts.lat != null && !urlHasAddr ? "" : opts.adresse;

wireForm({ reload: () => void loadAll(state.center ? "center" : "address"), arm: armTimer, rerender, apply: applyAll }); wireZoom(); applyZoomMode(); updateUrl();

$("create").addEventListener("click", () => void loadAll());

$("reload").addEventListener("click", () => void loadAll(state.center ? "center" : "address"));

$("weather-reload").addEventListener("click", () => void weatherOnly());

address.addEventListener("keydown", e => { if (e.key === "Enter") void loadAll(); });

armTimer();

void loadAll(opts.lat != null ? "url" : "address");
