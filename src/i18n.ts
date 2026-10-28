import { opts } from "./options";

export type Lang = "de" | "en";
const D: Record<string, [string, string]> = {
  // --- Seite ---
  eyebrow: ["DEINE UMGEBUNG · LIVE ILLUSTRIERT", "YOUR SURROUNDINGS · LIVE ILLUSTRATED"],
  subtitle: ["Eine kleine Welt aus echten Häusern und aktuellem Wetter.", "A tiny world of real houses and live weather."],
  map_title: ["Deine Nachbarschaft als Miniaturwelt", "Your neighbourhood as a miniature world"],
  place_loading: ["Adresse wird geladen …", "Loading address …"],
  reload: ["Insel neu laden", "Reload island"],
  zoom_in: ["Vergrößern", "Zoom in"], zoom_out: ["Verkleinern", "Zoom out"], zoom_reset: ["Zurücksetzen", "Reset view"],
  svg_aria: ["Isometrische Wetterinsel", "Isometric weather island"], svg_loading: ["Lade Wetterinsel …", "Loading weather island …"],
  stats_loading: ["Kartendaten werden geladen …", "Loading map data …"],
  radius_label: ["{0} m Radius", "{0} m radius"],
  create_h: ["Insel erstellen", "Create island"],
  create_p: ["Adresse eingeben, um echte Gebäude und Straßen zu laden.", "Enter an address to load real buildings and streets."],
  addr_label: ["Adresse / Mittelpunkt", "Address / centre"], create_btn: ["✦ Insel erstellen", "✦ Create island"],
  params_summary: ["⚙ Anzeige-Optionen & Link", "⚙ Display options & link"],
  o_wetter: ["Wetter im Bild anzeigen", "Show weather in the picture"], o_temp: ["Temperatur & Zustand", "Temperature & conditions"], o_wind: ["Wind", "Wind"], o_zeit: ["Stand (Uhrzeit)", "Updated (time)"],
  l_textpos: ["Textposition", "Text position"], tp_ul: ["unten links", "bottom left"], tp_ur: ["unten rechts", "bottom right"], tp_ol: ["oben links", "top left"], tp_or: ["oben rechts", "top right"],
  o_kiosk: ["Kiosk: nur das Bild", "Kiosk: picture only"], link_only: ["(nur im Link)", "(link only)"], o_zoom: ["Zoom & Touch", "Zoom & touch"], o_kompass: ["Kompass unter der Insel", "Compass below the island"],
  o_mond: ["Mondphase anzeigen", "Show moon phase"], at_night: ["(nachts)", "(at night)"], l_bg: ["Hintergrund", "Background"], bg_ph: ["leer = Himmel", "empty = sky"],
  bg_hint: ["leer = Himmel · <b>transparent</b> · Farbe als Hex (<b>ffe9c8</b>, <b>#fff</b>) oder Name (<b>white</b>, <b>lightblue</b>) · auch <b>rgb(30,40,70)</b>", "empty = sky · <b>transparent</b> · colour as hex (<b>ffe9c8</b>, <b>#fff</b>) or name (<b>white</b>, <b>lightblue</b>) · also <b>rgb(30,40,70)</b>"],
  l_radius: ["Radius", "Radius"], o_anim: ["Animationen", "Animations"], l_refresh: ["Wetter-Aktualisierung (Min., 0 = aus)", "Weather refresh (min., 0 = off)"],
  l_forecast: ["Vorhersage im Bild", "Forecast in the picture"], fc_off: ["aus", "off"], fc_hours: ["nächste Stunden", "next hours"], fc_days: ["nächste 5 Tage", "next 5 days"],
  l_unit: ["Einheit", "Unit"], l_lang: ["Sprache", "Language"], l_test: ["Testwetter", "Test weather"], tw_real: ["echtes Wetter", "real weather"],
  tw_klar: ["klar", "clear"], tw_heiter: ["heiter", "fair"], tw_wolkig: ["wolkig", "cloudy"], tw_bedeckt: ["bedeckt", "overcast"], tw_nebel: ["Nebel", "fog"], tw_niesel: ["Nieselregen", "drizzle"],
  tw_regen: ["Regen", "rain"], tw_gewitter: ["Gewitter", "thunderstorm"], tw_schnee: ["Schnee", "snow"], tw_wind: ["Wind", "wind"],
  l_tod: ["Tageszeit", "Time of day"], tod_auto: ["automatisch", "automatic"], tod_tag: ["Tag", "Day"], tod_nacht: ["Nacht", "Night"],
  objs_legend: ["Objekte anzeigen", "Show objects"], ob_gleise: ["Gleise & Zug", "Rails & train"], ob_gew: ["Bäche, Flüsse & Teiche", "Streams, rivers & ponds"], ob_frei: ["Spiel- & Sportplätze", "Playgrounds & sports pitches"],
  ob_land: ["Äcker, Obstwiesen, Kleingärten, Friedhof", "Fields, orchards, allotments, cemetery"], ob_strom: ["Stromleitungen", "Power lines"], ob_hecken: ["Hecken & Mauern", "Hedges & walls"], ob_halt: ["Bushaltestellen & Bahnsteige", "Bus stops & platforms"],
  o_coords: ["Koordinaten statt Adresse im Link", "Coordinates instead of address in link"],
  o_apply: ["↻ Aktualisieren (alle Werte übernehmen)", "↻ Update (apply all values)"], l_link: ["Link für iFrame / Kiosk", "Link for iFrame / kiosk"], copy: ["Link kopieren", "Copy link"], copied: ["Kopiert ✓", "Copied ✓"], open: ["Öffnen ↗", "Open ↗"],
  w_h: ["Aktuelles Wetter", "Current weather"], w_refresh: ["Aktualisieren", "Refresh"], w_loading: ["Wetter wird geladen", "Loading weather"], w_wait: ["Warte auf Wetterdaten …", "Waiting for weather data …"],
  fc_h: ["Vorhersage", "Forecast"], fc_nh: ["Nächste Stunden", "Next hours"], fc_nd: ["Nächste Tage", "Next days"],
  n_geo: ["<b>⌖ Echte Geometrie</b><br>Gebäude und Straßen aus OpenStreetMap; Höhen, Seitenwände und Dächer werden als Miniaturmodell dargestellt.", "<b>⌖ Real geometry</b><br>Buildings and streets from OpenStreetMap; heights, walls and roofs are shown as a miniature model."],
  n_live: ["<b>↻ Live-Wetter</b><br>Wetterdaten von Open-Meteo mit animierten Effekten.", "<b>↻ Live weather</b><br>Weather data from Open-Meteo with animated effects."],
  attribution: ['Kartendaten: © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap-Mitwirkende</a> · Wetter: <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>', 'Map data: © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a> · Weather: <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>'],
  stats: ["{0} Gebäude · {1} Straßenabschnitte · {2}", "{0} buildings · {1} street segments · {2}"],
  // --- Meldungen ---
  m_need_addr: ["Bitte eine Adresse eingeben.", "Please enter an address."], m_searching: ["Suche Adresse …", "Searching address …"], m_loading: ["Lade Gebäude, Straßen und Wetter …", "Loading buildings, streets and weather …"],
  m_no_buildings: ["Keine Gebäudeumrisse im Ausschnitt gefunden.", "No building outlines found in this area."], m_ok: ["Wetterinsel erfolgreich erstellt.", "Weather island created."],
  m_ok_noweather: ["Insel erstellt, aber die Wetterdaten sind gerade nicht erreichbar. Mit „Aktualisieren“ erneut versuchen.", "Island created, but the weather data is not reachable right now. Try “Refresh” again."],
  m_unknown: ["Unbekannter Fehler.", "Unknown error."], m_w_updated: ["Wetter aktualisiert.", "Weather updated."], m_w_failed: ["Wetter konnte nicht aktualisiert werden.", "Weather could not be updated."],
  m_geo_failed: ["Adresssuche fehlgeschlagen.", "Address search failed."], m_geo_http: ["Adresssuche fehlgeschlagen (HTTP {0}).", "Address search failed (HTTP {0})."],
  m_geo_none: ["Adresse nicht gefunden. Bitte Ort und Land ergänzen.", "Address not found. Please add town and country."],
  m_map_busy: ["Kartenserver überlastet – der Server holt die Daten im Hintergrund. Neuer Versuch in 20 s ({0}) …", "Map server busy – the server is fetching the data in the background. Retrying in 20 s ({0}) …"],
  m_map_failed: ["Die Kartendaten konnten nicht geladen werden. Bitte später erneut versuchen.", "The map data could not be loaded. Please try again later."],
  m_map_http: ["Kartenserver HTTP {0}", "Map server HTTP {0}"],
  m_map_loading: ["Lade Kartendaten (alle Kartenserver parallel) …", "Loading map data (all map servers in parallel) …"], m_map_retry: ["Kartenserver ausgelastet – zweiter Versuch …", "Map servers busy – second attempt …"],
  m_overpass_down: ["Die öffentlichen Kartenserver (Overpass) sind gerade überlastet oder nicht erreichbar. Das liegt nicht an der Adresse – bitte in ein paar Minuten über „Insel neu laden“ erneut versuchen.", "The public map servers (Overpass) are overloaded or unreachable right now. This is not caused by the address – please try “Reload island” again in a few minutes."],
  m_weather_http: ["Wetter-API HTTP {0}", "Weather API HTTP {0}"],
  fc_none: ["Keine Vorhersage verfügbar.", "No forecast available."], hour_t: ["{0} Uhr", "{0}"], today: ["Heute", "Today"],
  moon_lit: ["beleuchtet", "lit"],
};

/** Aktuelle Sprache für Texte (opts.sprache), Platzhalter {0}, {1} … werden ersetzt. */
export const tr = (k: string, ...a: (string | number)[]) => a.reduce<string>((s, v, i) => s.replace(`{${i}}`, String(v)), D[k]?.[opts.sprache === "de" ? 0 : 1] ?? k);

/** Alle statischen Texte der Seite (data-i18n …) in die gewählte Sprache setzen. */
export function applyStaticTexts() {
  document.documentElement.lang = opts.sprache;
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach(e => { e.textContent = tr(e.dataset.i18n!); });
  document.querySelectorAll<HTMLElement>("[data-i18n-html]").forEach(e => { e.innerHTML = tr(e.dataset.i18nHtml!); });
  document.querySelectorAll<HTMLElement>("[data-i18n-aria]").forEach(e => e.setAttribute("aria-label", tr(e.dataset.i18nAria!)));
  document.querySelectorAll<HTMLInputElement>("[data-i18n-ph]").forEach(e => e.placeholder = tr(e.dataset.i18nPh!));
  document.getElementById("lang-de")?.classList.toggle("on", opts.sprache === "de");
  document.getElementById("lang-en")?.classList.toggle("on", opts.sprache === "en");
}

let hook: () => void = () => {};
/** Wird nach einem Sprachwechsel aufgerufen (neu zeichnen, Texte aktualisieren). */
export const onLanguage = (cb: () => void) => { hook = cb; };

export function setLanguage(l: Lang) {
  opts.sprache = l;
  try { localStorage.setItem("wi-lang", l); } catch {}
  applyStaticTexts(); hook();
}
