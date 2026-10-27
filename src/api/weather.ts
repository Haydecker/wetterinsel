import { LatLon, Weather } from "../types";

export async function fetchWeather(c: LatLon): Promise<Weather> {
  const u = new URL("https://api.open-meteo.com/v1/forecast");
  u.search = new URLSearchParams({latitude:String(c.lat),longitude:String(c.lon),current:"temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m",hourly:"temperature_2m,precipitation_probability,weather_code,is_day",daily:"sunrise,sunset,weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",forecast_days:"5",timezone:"auto"}).toString();
  const r=await fetch(u,{signal:AbortSignal.timeout(12000)}); if(!r.ok) throw new Error(`Wetter-API HTTP ${r.status}`);
  const j=await r.json() as {current:Record<string,number|string>;daily?:Record<string,(string|number)[]>;hourly?:Record<string,(string|number)[]>}; const v=j.current; const H=j.hourly,D=j.daily;
  return {temperature:+v.temperature_2m,feels:+v.apparent_temperature,code:+v.weather_code,wind:+v.wind_speed_10m,direction:+v.wind_direction_10m,clouds:+v.cloud_cover,rain:+v.precipitation,humidity:+v.relative_humidity_2m,day:+v.is_day,time:String(v.time),sunrise:D?.sunrise?.[0] as string|undefined,sunset:D?.sunset?.[0] as string|undefined,
    hourly:H?{time:H.time as string[],temp:H.temperature_2m as number[],pop:H.precipitation_probability as number[],code:H.weather_code as number[],day:H.is_day as number[]}:undefined,
    daily:D?{time:D.time as string[],code:D.weather_code as number[],max:D.temperature_2m_max as number[],min:D.temperature_2m_min as number[],pop:D.precipitation_probability_max as number[]}:undefined};
}
