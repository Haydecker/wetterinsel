import { LatLon } from "../types";
import { viaServer } from "../api/osm";

export async function geocode(q: string): Promise<{point:LatLon; label:string}> {
  const s = await viaServer(`/api/geocode?q=${encodeURIComponent(q)}`);
  if (s?.status === 200) return { point: { lat: s.data.lat, lon: s.data.lon }, label: s.data.label };
  if (s && s.status !== 502) throw new Error(s.data.error ?? "Adresssuche fehlgeschlagen.");
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.search = new URLSearchParams({q,format:"jsonv2",limit:"1"}).toString();
  const r = await fetch(url, {headers:{"Accept":"application/json"}});
  if (!r.ok) throw new Error(`Adresssuche fehlgeschlagen (HTTP ${r.status}).`);
  const data = await r.json() as {lat:string;lon:string;display_name:string}[];
  if (!data.length) throw new Error("Adresse nicht gefunden. Bitte Ort und Land ergänzen.");
  return {point:{lat:+data[0].lat,lon:+data[0].lon},label:data[0].display_name};
}
