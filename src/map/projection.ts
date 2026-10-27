import { ElementOSM, LatLon, P, Shape } from "../types";
import { queryRadius } from "../options";

export function local(p: LatLon, c: LatLon): P {
  return { x: (p.lon-c.lon)*111320*Math.cos(c.lat*Math.PI/180), y: (p.lat-c.lat)*110540 };
}

export function iso(p: P): P { return { x: p.x-p.y, y: -(p.x+p.y)*0.5 }; }

const AREA_LANDUSE = ["farmland", "orchard", "allotments", "cemetery", "vineyard"];
const AREA_LEISURE = ["playground", "pitch", "sports_centre", "swimming_pool"];
const GREEN_LANDUSE = ["grass", "meadow", "forest", "park", "recreation_ground", "village_green"];

/** OSM-Elemente in Zeichenobjekte (inkl. Gleise, Gewässer, Flächen, Strom, Hecken, Haltestellen) umwandeln. */
export function shapesFrom(elements: ElementOSM[], c: LatLon): Shape[] {
  const out: Shape[]=[], lim=queryRadius();
  for(const e of elements) {
    const geom = e.geometry ?? (e.type === "node" && e.lat != null && e.lon != null ? [{ lat: e.lat, lon: e.lon }] : undefined);
    if(!geom || !e.tags) continue;
    const t=e.tags, isNode=e.type==="node";
    if(!isNode&&geom.length<2) continue;
    const tunnel = t.tunnel === "yes" || t.tunnel === "building_passage" || t.covered === "yes";
    let kind: Shape["kind"] | null = null;
    if(isNode) { if(t.highway==="bus_stop"||["halt","station","tram_stop"].includes(t.railway??"")) kind="stop"; }
    else if("building" in t) kind="building";
    else if("highway" in t) kind="road";
    else if(["rail","tram","light_rail","narrow_gauge"].includes(t.railway??"")) { if(!tunnel) kind="rail"; }
    else if(t.railway==="platform"||t.public_transport==="platform") kind="platform";
    else if(["river","stream","canal","ditch","drain"].includes(t.waterway??"")) { if(!tunnel) kind="stream"; }
    else if("power" in t) kind="power";
    else if(["hedge","wall","city_wall","retaining_wall"].includes(t.barrier??"")) kind="hedge";
    else if("water" in t || t.natural==="water" || ["basin","reservoir"].includes(t.landuse??"") || t.waterway==="riverbank") kind="water";
    else if(AREA_LANDUSE.includes(t.landuse??"")||AREA_LEISURE.includes(t.leisure??"")) kind="area";
    else if(GREEN_LANDUSE.includes(t.landuse??"") || ["wood","scrub","wetland"].includes(t.natural??"") || ["park","garden"].includes(t.leisure??"")) kind="green";
    if(!kind) continue;
    const meters=geom.map(g=>local({lat:g.lat,lon:g.lon},c));
    // Keep ways that cross the visible area even when some vertices lie outside it.
    if(!meters.some(p=>Math.hypot(p.x,p.y)<=lim)) continue;
    let height=8;
    if(t.height) { const n=parseFloat(t.height.replace(",", ".")); if(Number.isFinite(n)) height=Math.max(3,Math.min(35,n)); }
    else if(t["building:levels"]) height=Math.max(3,Math.min(35,(parseFloat(t["building:levels"])||2)*3));
    if(t.building==="shed"||t.building==="garage") height=3.2;
    out.push({points:meters.map(iso),tags:t,kind,id:`${e.type}-${e.id}`,height});
  }
  return out;
}
