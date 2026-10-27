// Wetterinsel-Server: liefert die App aus und cached Kartendaten (Overpass) und Geocoding (Nominatim) dauerhaft.
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const PORT = +(process.env.PORT ?? 80), DATA = process.env.DATA_DIR ?? "/data", DIST = process.env.DIST_DIR ?? "/app/dist";
// Nominatim/Overpass verlangen einen identifizierbaren User-Agent: eigene Kontaktangabe per Umgebungsvariable CONTACT setzen.
const UA = `Wetterinsel/1.1 (self-hosted; ${process.env.CONTACT ?? "https://github.com/Haydecker/wetterinsel"})`;
const MIRRORS = ["https://overpass-api.de/api/interpreter", "https://lz4.overpass-api.de/api/interpreter", "https://z.overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".json": "application/json", ".webmanifest": "application/manifest+json", ".ico": "image/x-icon" };
const log = (...a) => console.log(new Date().toISOString(), ...a);

await fs.mkdir(path.join(DATA, "map"), { recursive: true });
const geoFile = path.join(DATA, "geocode.json");
let geo = {}; try { geo = JSON.parse(await fs.readFile(geoFile, "utf8")); } catch {}

const q4 = n => (+n).toFixed(4);
const mapKey = (lat, lon, r) => `v3_${q4(lat)}_${q4(lon)}_${r}`;
const mapKeyV2 = (lat, lon, r) => `v2_${q4(lat)}_${q4(lon)}_${r}`; // ohne Relationen und Plätze
const mapFile = key => path.join(DATA, "map", `${key}.json`);
const legacyKey = (lat, lon, r) => `${q4(lat)}_${q4(lon)}_${r}`; // Version 1 (ohne Gleise, Bäche usw.)
const LIGHT_HW = '["highway"~"^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|service|motorway_link|trunk_link|primary_link|secondary_link|tertiary_link)$"]';
const overpassQuery = (lat, lon, r) => {
  const a = `(around:${r},${lat},${lon})`, w = f => `way${a}${f};`, rel = f => `relation${a}["type"="multipolygon"]${f};`;
  const RELS = rel('["building"]') + rel('["landuse"~"^(grass|meadow|forest|park|recreation_ground|village_green|farmland|orchard|allotments|cemetery|vineyard)$"]') + rel('["natural"~"^(wood|scrub|wetland)$"]') + rel('["leisure"~"^(park|garden|pitch|playground)$"]');
  const PLAZA = w('["place"="square"]') + w('["amenity"="parking"]');
  if (r > 700) return `[out:json][timeout:90];(${w('["building"]')}${w(LIGHT_HW)}` + // große Radien: nur das Wesentliche
    w('["landuse"~"^(grass|meadow|forest|park|recreation_ground|village_green|farmland|orchard|allotments|cemetery|vineyard|basin|reservoir)$"]') +
    w('["natural"~"^(water|wood|scrub|wetland)$"]') + w('["water"]') + w('["railway"~"^(rail|tram|light_rail|narrow_gauge)$"]') + w('["waterway"~"^(river|stream|canal|riverbank)$"]') + PLAZA + RELS + `);out body geom;`;
  return `[out:json][timeout:90];(${w('["building"]')}${w('["highway"]')}` +
    w('["landuse"~"^(grass|meadow|forest|park|recreation_ground|village_green|farmland|orchard|allotments|cemetery|vineyard|basin|reservoir)$"]') +
    w('["natural"~"^(water|wood|scrub|wetland)$"]') + w('["water"]') + w('["leisure"~"^(playground|pitch|garden|park|sports_centre|swimming_pool)$"]') +
    w('["railway"~"^(rail|tram|light_rail|narrow_gauge|platform)$"]') + w('["waterway"~"^(river|stream|canal|ditch|drain|riverbank)$"]') +
    w('["power"~"^(line|minor_line)$"]') + w('["barrier"~"^(hedge|wall|city_wall|retaining_wall)$"]') + w('["public_transport"="platform"]') +
    `node${a}["highway"="bus_stop"];node${a}["railway"~"^(halt|station|tram_stop)$"];` + PLAZA + RELS + `);out body geom;`;
};

async function fetchMirrors(query) {
  const ask = async url => {
    const r = await fetch(url, { method: "POST", signal: AbortSignal.timeout(85000), headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8", "User-Agent": UA }, body: new URLSearchParams({ data: query }) });
    if (!r.ok) throw new Error(`${url} HTTP ${r.status}`);
    const j = await r.json();
    if (!Array.isArray(j.elements)) throw new Error(`${url} ohne elements`);
    return j.elements;
  };
  return Promise.any(MIRRORS.map(ask));
}

const pending = new Map(); // key -> Promise, verhindert doppelte Abfragen
function fetchAndStore(lat, lon, r) {
  const key = mapKey(lat, lon, r);
  if (pending.has(key)) return pending.get(key);
  const p = (async () => {
    const elements = (await fetchMirrors(overpassQuery(q4(lat), q4(lon), r))).map(e => e.type === "relation" && e.members ? { ...e, members: e.members.map(m => m.geometry ? { ...m, geometry: thin(m.geometry, +q4(lat), +q4(lon), r) } : m) } : e);
    await fs.writeFile(mapFile(key), JSON.stringify({ t: Date.now(), lat: +q4(lat), lon: +q4(lon), r, elements }));
    log("Karte gespeichert", key, elements.length, "Elemente");
    return elements;
  })().finally(() => pending.delete(key));
  pending.set(key, p);
  return p;
}
// Hintergrund-Wiederholung, wenn Overpass überlastet ist
const retrying = new Set();
function retryLater(lat, lon, r, left = 40) {
  const key = mapKey(lat, lon, r);
  if (retrying.has(key) || left <= 0) return;
  retrying.add(key);
  setTimeout(async () => {
    retrying.delete(key);
    try { await fs.access(mapFile(key)); return; } catch {}
    try { await fetchAndStore(lat, lon, r); } catch { log("Wiederholung fehlgeschlagen", key, "übrig:", left - 1); retryLater(lat, lon, r, left - 1); }
  }, 120000);
}

/** Ufer weit weg vom Mittelpunkt ausdünnen (Anfang und Ende bleiben erhalten). */
function thin(g, lat, lon, r) {
  if (g.length < 3) return g;
  const kx = 111320 * Math.cos(lat * Math.PI / 180), ky = 110540, m = (a, b) => Math.hypot((a.lon - b.lon) * kx, (a.lat - b.lat) * ky), c = { lat, lon };
  const out = [g[0]]; let last = g[0];
  for (let i = 1; i < g.length - 1; i++) { const d = m(g[i], c), sp = d < r * 1.6 ? 0 : Math.min(400, d * .04); if (sp === 0 || m(g[i], last) >= sp) { out.push(g[i]); last = g[i]; } }
  out.push(g[g.length - 1]); return out;
}
const lakeKey = (lat, lon, r) => `lakes1_${q4(lat)}_${q4(lon)}_${r}`, lakePending = new Map(), lakeRetrying = new Set();
function fetchLakes(lat, lon, r) {
  const key = lakeKey(lat, lon, r);
  if (lakePending.has(key)) return lakePending.get(key);
  const p = (async () => {
    const raw = await fetchMirrors(`[out:json][timeout:90];(relation(around:${r},${q4(lat)},${q4(lon)})["type"="multipolygon"]["natural"="water"];relation(around:${r},${q4(lat)},${q4(lon)})["type"="multipolygon"]["waterway"="riverbank"];);out geom;`);
    const elements = raw.filter(e => e.type === "relation").map(e => ({ type: "relation", id: e.id, tags: { natural: e.tags?.natural, water: e.tags?.water, name: e.tags?.name },
      members: (e.members ?? []).filter(m => m.type === "way" && m.geometry).map(m => ({ type: "way", role: m.role, geometry: thin(m.geometry, lat, lon, r) })) }));
    await fs.writeFile(mapFile(key), JSON.stringify({ t: Date.now(), elements })); log("Seen gespeichert", key, elements.length, "Relationen");
    return elements;
  })().finally(() => lakePending.delete(key));
  lakePending.set(key, p); return p;
}
function retryLakes(lat, lon, r, left = 30) {
  const key = lakeKey(lat, lon, r);
  if (lakeRetrying.has(key) || left <= 0) return;
  lakeRetrying.add(key);
  setTimeout(async () => {
    lakeRetrying.delete(key);
    try { await fs.access(mapFile(key)); return; } catch {}
    try { await fetchLakes(lat, lon, r); } catch { retryLakes(lat, lon, r, left - 1); }
  }, 120000);
}
async function readMap(key) { try { return JSON.parse(await fs.readFile(mapFile(key), "utf8")); } catch { return null; } }
const json = (res, code, obj, extra = {}) => { res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extra }); res.end(JSON.stringify(obj)); };

async function api(req, res, url) {
  if (url.pathname === "/api/map") {
    const lat = +url.searchParams.get("lat"), lon = +url.searchParams.get("lon"), r = Math.max(100, Math.min(1900, Math.round(+url.searchParams.get("r") || 240)));
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return json(res, 400, { error: "lat/lon ungültig" });
    const key = mapKey(lat, lon, r), hit = await readMap(key);
    if (hit) return json(res, 200, { elements: hit.elements, cached: true, savedAt: hit.t });
    const old1 = (await readMap(mapKeyV2(lat, lon, r))) ?? (await readMap(legacyKey(lat, lon, r))); // ältere Karte sofort zeigen, neue im Hintergrund holen
    if (old1) { fetchAndStore(lat, lon, r).catch(() => retryLater(lat, lon, r)); return json(res, 200, { elements: old1.elements, cached: true, stale: true, savedAt: old1.t }); }
    try { const elements = await fetchAndStore(lat, lon, r); return json(res, 200, { elements, cached: false, savedAt: Date.now() }); }
    catch (e) { log("Overpass nicht erreichbar", key); retryLater(lat, lon, r); return json(res, 503, { error: "Kartenserver überlastet – der Server versucht es im Hintergrund weiter.", retry: true }, { "Retry-After": "30" }); }
  }
  if (url.pathname === "/api/lakes") {
    const lat = +url.searchParams.get("lat"), lon = +url.searchParams.get("lon"), r = Math.max(100, Math.min(1900, Math.round(+url.searchParams.get("r") || 240)));
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return json(res, 400, { error: "lat/lon ungültig" });
    const key = lakeKey(lat, lon, r), hit = await readMap(key);
    if (hit) return json(res, 200, { elements: hit.elements, cached: true });
    try { return json(res, 200, { elements: await fetchLakes(lat, lon, r), cached: false }); }
    catch (e) { log("Seen nicht erreichbar", key); retryLakes(lat, lon, r); return json(res, 503, { error: "Seen konnten nicht geladen werden – der Server versucht es im Hintergrund weiter." }, { "Retry-After": "60" }); }
  }
  if (url.pathname === "/api/geocode") {
    const q = (url.searchParams.get("q") ?? "").trim(); if (!q) return json(res, 400, { error: "q fehlt" });
    const key = q.toLowerCase().replace(/\s+/g, " ");
    if (geo[key]) return json(res, 200, geo[key]);
    try {
      const u = new URL("https://nominatim.openstreetmap.org/search"); u.search = new URLSearchParams({ q, format: "jsonv2", limit: "1" }).toString();
      const r = await fetch(u, { headers: { "User-Agent": UA, "Accept": "application/json" }, signal: AbortSignal.timeout(15000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      if (!d.length) return json(res, 404, { error: "Adresse nicht gefunden. Bitte Ort und Land ergänzen." });
      geo[key] = { lat: +d[0].lat, lon: +d[0].lon, label: d[0].display_name };
      await fs.writeFile(geoFile, JSON.stringify(geo, null, 1));
      return json(res, 200, geo[key]);
    } catch (e) { return json(res, 502, { error: `Adresssuche nicht erreichbar (${e.message})` }); }
  }
  if (url.pathname === "/api/status") {
    const files = await fs.readdir(path.join(DATA, "map")).catch(() => []);
    return json(res, 200, { gespeicherteKarten: files.length, adressen: Object.keys(geo).length, wartend: [...retrying] });
  }
  return json(res, 404, { error: "unbekannt" });
}

async function serveStatic(req, res, url) {
  let p = path.normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
  let file = path.join(DIST, p); if (!file.startsWith(DIST)) { res.writeHead(403); return res.end(); }
  try { if ((await fs.stat(file)).isDirectory()) file = path.join(file, "index.html"); } catch { file = path.join(DIST, "index.html"); }
  try {
    const buf = await fs.readFile(file), ext = path.extname(file);
    res.writeHead(200, { "Content-Type": MIME[ext] ?? "application/octet-stream", "Cache-Control": file.includes("/assets/") ? "public, max-age=31536000, immutable" : "no-cache", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin" });
    res.end(buf);
  } catch { res.writeHead(404); res.end("Not found"); }
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://x");
    if (url.pathname.startsWith("/api/")) return await api(req, res, url);
    return await serveStatic(req, res, url);
  } catch (e) { log("Fehler", e); res.writeHead(500); res.end("Fehler"); }
}).listen(PORT, () => log("Wetterinsel-Server läuft auf Port", PORT));

// Vorwärmen: Standardorte beim Start holen (Overpass-Ausfälle werden im Hintergrund wiederholt)
for (const spec of (process.env.WARM ?? "").split(";").filter(Boolean)) {
  const [lat, lon, r = "240"] = spec.split(",").map(Number);
  readMap(mapKey(lat, lon, r)).then(h => { if (!h) fetchAndStore(lat, lon, r).catch(() => retryLater(lat, lon, r)); });
}
