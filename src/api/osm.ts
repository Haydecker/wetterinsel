import { ElementOSM, LatLon } from "../types";
import { tr } from "../i18n";
import { queryRadius } from "../options";
import { state } from "../state";
import { message } from "../ui/status";
import { sleep } from "../util";
import { lakeQuery, thinElements } from "../map/lakes";

// ---------- Daten holen: erst eigener Server (mit Cache), sonst direkt ----------
export async function viaServer(path: string): Promise<{ status: number; data: any } | null> {
  try {
    const r = await fetch(path, { signal: AbortSignal.timeout(70000) });
    if (!(r.headers.get("content-type") ?? "").includes("json")) return null; // kein Backend (z. B. reine HTML-Variante)
    return { status: r.status, data: await r.json() };
  } catch { return null; }
}

export async function osm(c: LatLon, id: number): Promise<ElementOSM[]> {
  const r = queryRadius();
  for (let i = 0; i < 60; i++) {
    const s = await viaServer(`/api/map?lat=${c.lat.toFixed(5)}&lon=${c.lon.toFixed(5)}&r=${r}`);
    if (!s) return osmDirect(c, r);
    if (s.status === 200) return s.data.elements as ElementOSM[];
    if (s.status !== 503) throw new Error(s.data.error ?? tr("m_map_http", s.status));
    if (id !== state.runId) throw new Error("abgebrochen");
    message(tr("m_map_busy", i + 1));
    await sleep(20000);
  }
  throw new Error(tr("m_map_failed"));
}

export async function osmDirect(c: LatLon, r: number): Promise<ElementOSM[]> {
  const a = `(around:${r},${c.lat},${c.lon})`;
  const w = (f: string) => `way${a}${f};`, rel = (f: string) => `relation${a}["type"="multipolygon"]${f};`;
  const EXTRA = w('["place"="square"]') + w('["amenity"="parking"]') + rel('["building"]') + rel('["landuse"~"^(grass|meadow|forest|park|recreation_ground|village_green|farmland|orchard|allotments|cemetery|vineyard)$"]') + rel('["natural"~"^(wood|scrub|wetland)$"]') + rel('["leisure"~"^(park|garden|pitch|playground)$"]');
  const light = r > 700, hw = light ? '["highway"~"^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|service|motorway_link|trunk_link|primary_link|secondary_link|tertiary_link)$"]' : '["highway"]';
  const q = light ? `[out:json][timeout:90];(${w('["building"]')}${w(hw)}` +
    w('["landuse"~"^(grass|meadow|forest|park|recreation_ground|village_green|farmland|orchard|allotments|cemetery|vineyard|basin|reservoir)$"]') +
    w('["natural"~"^(water|wood|scrub|wetland)$"]') + w('["water"]') + w('["railway"~"^(rail|tram|light_rail|narrow_gauge)$"]') + w('["waterway"~"^(river|stream|canal|riverbank)$"]') + EXTRA + `);out body geom;` :
    `[out:json][timeout:60];(${w('["building"]')}${w(hw)}` +
    w('["landuse"~"^(grass|meadow|forest|park|recreation_ground|village_green|farmland|orchard|allotments|cemetery|vineyard|basin|reservoir)$"]') +
    w('["natural"~"^(water|wood|scrub|wetland)$"]') + w('["water"]') + w('["leisure"~"^(playground|pitch|garden|park|sports_centre|swimming_pool)$"]') +
    w('["railway"~"^(rail|tram|light_rail|narrow_gauge|platform)$"]') + w('["waterway"~"^(river|stream|canal|ditch|drain|riverbank)$"]') +
    w('["power"~"^(line|minor_line)$"]') + w('["barrier"~"^(hedge|wall|city_wall|retaining_wall)$"]') + w('["public_transport"="platform"]') +
    `node${a}["highway"="bus_stop"];node${a}["railway"~"^(halt|station|tram_stop)$"];` + EXTRA + `);out body geom;`;
  const key=`wi-osm3-${c.lat.toFixed(4)}-${c.lon.toFixed(4)}-${r}`;
  try { const hit=JSON.parse(localStorage.getItem(key)??"null") as {t:number;e:ElementOSM[]}|null; if(hit&&Date.now()-hit.t<7*864e5) return hit.e; } catch {}
  const mirrors=["https://overpass-api.de/api/interpreter","https://lz4.overpass-api.de/api/interpreter","https://z.overpass-api.de/api/interpreter","https://overpass.private.coffee/api/interpreter","https://overpass.kumi.systems/api/interpreter"];
  const ask=async(endpoint:string)=>{
    const res=await fetch(endpoint,{method:"POST",signal:AbortSignal.timeout(40000),headers:{"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"},body:new URLSearchParams({data:q})});
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    return ((await res.json()) as {elements:ElementOSM[]}).elements ?? [];
  };
  for(let attempt=1;attempt<=2;attempt++){
    message(attempt===1?tr("m_map_loading"):tr("m_map_retry"));
    try { const e=await Promise.any(mirrors.map(ask)); try { localStorage.setItem(key,JSON.stringify({t:Date.now(),e})); } catch {} return e; }
    catch { await sleep(4000); }
  }
  throw new Error(tr("m_overpass_down"));
}

/** Seen (Relationen wie der Bodensee) – optional, Fehler sind nicht schlimm. */
export async function lakes(c: LatLon): Promise<ElementOSM[]> {
  const r = queryRadius();
  const s = await viaServer(`/api/lakes?lat=${c.lat.toFixed(5)}&lon=${c.lon.toFixed(5)}&r=${r}`);
  if (s) return s.status === 200 ? (s.data.elements as ElementOSM[]) : [];
  const key = `wi-lake2-${c.lat.toFixed(4)}-${c.lon.toFixed(4)}-${r}`;
  try { const hit = JSON.parse(localStorage.getItem(key) ?? "null") as { t: number; e: ElementOSM[] } | null; if (hit && Date.now() - hit.t < 7 * 864e5) return hit.e; } catch {}
  const q = lakeQuery(+c.lat.toFixed(4), +c.lon.toFixed(4), r);
  const ask = async (endpoint: string) => {
    const res = await fetch(endpoint, { method: "POST", signal: AbortSignal.timeout(60000), headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" }, body: new URLSearchParams({ data: q }) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return ((await res.json()) as { elements: ElementOSM[] }).elements ?? [];
  };
  try {
    const e = thinElements(await Promise.any(["https://overpass-api.de/api/interpreter", "https://lz4.overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter", "https://overpass.kumi.systems/api/interpreter"].map(ask)), c, r);
    try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), e })); } catch {}
    return e;
  } catch { return []; }
}
