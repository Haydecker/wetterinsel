import { ElementOSM, LatLon, P, Shape } from "../types";
import { queryRadius } from "../options";
import { stitch } from "./lakes";

export function local(p: LatLon, c: LatLon): P {
  return { x: (p.lon-c.lon)*111320*Math.cos(c.lat*Math.PI/180), y: (p.lat-c.lat)*110540 };
}

export function iso(p: P): P { return { x: p.x-p.y, y: -(p.x+p.y)*0.5 }; }

const AREA_LANDUSE = ["farmland", "orchard", "allotments", "cemetery", "vineyard"];
const AREA_LEISURE = ["playground", "pitch", "sports_centre", "swimming_pool"];
const GREEN_LANDUSE = ["grass", "meadow", "forest", "park", "recreation_ground", "village_green"];

const REL_GREEN_LEISURE = ["park", "garden", "pitch", "playground"];

/** Art eines OSM-Objekts anhand seiner Tags bestimmen (null = nicht darstellen). */
function kindOf(t: Record<string, string>, isNode: boolean): Shape["kind"] | null {
  const tunnel = t.tunnel === "yes" || t.tunnel === "building_passage" || t.covered === "yes";
  if(isNode) return t.highway==="bus_stop"||["halt","station","tram_stop"].includes(t.railway??"") ? "stop" : null;
  if("building" in t) return "building";
  if(("highway" in t && t.area==="yes") || t.place==="square" || t.amenity==="parking") return "plaza";
  if("highway" in t) return "road";
  if(["rail","tram","light_rail","narrow_gauge"].includes(t.railway??"")) return tunnel ? null : "rail";
  if(t.railway==="platform"||t.public_transport==="platform") return "platform";
  if(["river","stream","canal","ditch","drain"].includes(t.waterway??"")) return tunnel ? null : "stream";
  if("power" in t) return "power";
  if(["hedge","wall","city_wall","retaining_wall"].includes(t.barrier??"")) return "hedge";
  if("water" in t || t.natural==="water" || ["basin","reservoir"].includes(t.landuse??"") || t.waterway==="riverbank") return "water";
  if(AREA_LANDUSE.includes(t.landuse??"")||AREA_LEISURE.includes(t.leisure??"")) return "area";
  if(GREEN_LANDUSE.includes(t.landuse??"") || ["wood","scrub","wetland"].includes(t.natural??"") || ["park","garden"].includes(t.leisure??"")) return "green";
  return null;
}

/** Multipolygon-Relationen (Gebäude mit Innenhof, Parks …) in einzelne Außenringe zerlegen. */
function expandRelations(elements: ElementOSM[]): ElementOSM[] {
  const out: ElementOSM[] = [];
  for(const e of elements) {
    if(e.type!=="relation") { out.push(e); continue; }
    if(!e.members||!e.tags) continue;
    const kind=kindOf(e.tags,false);
    if(!kind||!["building","green","area","plaza"].includes(kind)) continue;
    const hasInner=e.members.some(m=>m.role==="inner");
    if(kind!=="building"&&hasInner) continue; // Flächen mit Löchern (z. B. Park um einen See) lieber weglassen als falsch füllen
    const rings=stitch(e.members.filter(m=>m.type==="way"&&m.geometry&&m.role!=="inner").map(m=>m.geometry!));
    rings.forEach((r,k)=>{ if(r.length>=4&&r[0].lat===r[r.length-1].lat&&r[0].lon===r[r.length-1].lon) out.push({type:"relation",id:e.id,lat:undefined,lon:undefined,tags:e.tags,geometry:r,part:k} as ElementOSM); });
  }
  return out;
}

/** OSM-Elemente in Zeichenobjekte (inkl. Gleise, Gewässer, Flächen, Strom, Hecken, Haltestellen) umwandeln. */
export function shapesFrom(elements: ElementOSM[], c: LatLon): Shape[] {
  const out: Shape[]=[], lim=queryRadius();
  for(const e of expandRelations(elements)) {
    const geom = e.geometry ?? (e.type === "node" && e.lat != null && e.lon != null ? [{ lat: e.lat, lon: e.lon }] : undefined);
    if(!geom || !e.tags) continue;
    const t=e.tags, isNode=e.type==="node";
    if(!isNode&&geom.length<2) continue;
    const kind=kindOf(t,isNode);
    if(kind==="plaza"&&(geom.length<4||geom[0].lat!==geom[geom.length-1].lat||geom[0].lon!==geom[geom.length-1].lon)) continue;
    if(!kind) continue;
    const meters=geom.map(g=>local({lat:g.lat,lon:g.lon},c));
    // Keep ways that cross the visible area even when some vertices lie outside it.
    if(!meters.some(p=>Math.hypot(p.x,p.y)<=lim)) continue;
    let height=8;
    if(t.height) { const n=parseFloat(t.height.replace(",", ".")); if(Number.isFinite(n)) height=Math.max(3,Math.min(35,n)); }
    else if(t["building:levels"]) height=Math.max(3,Math.min(35,(parseFloat(t["building:levels"])||2)*3));
    if(t.building==="shed"||t.building==="garage") height=3.2;
    out.push({points:meters.map(iso),tags:t,kind,id:`${e.type}-${e.id}${e.part?`-${e.part}`:""}`,height});
  }
  return out;
}
