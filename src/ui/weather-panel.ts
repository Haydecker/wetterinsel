import { Weather } from "../types";
import { $, weatherSummary } from "../dom";
import { state } from "../state";
import { L, compass, effective, fmtTemp, fmtWind, iconWeather, labelWeather } from "../weather/format";
import { renderForecast } from "../ui/forecast";

export function setWeather(raw: Weather | null) { state.weatherRaw = raw; state.weatherNow = effective(raw); if (state.weatherNow) renderWeather(state.weatherNow); }

export function renderWeather(w:Weather) {
  renderForecast(w);
  weatherSummary.innerHTML=`<span class="icon">${iconWeather(w.code,w.day)}</span><div><b>${fmtTemp(w.temperature)}</b><small>${labelWeather(w.code)}</small></div><div class="details">${L("gefuehlt")} ${fmtTemp(w.feels)}<br>${L("wind")} ${fmtWind(w.wind)} · ${compass(w.direction)}<br>${L("bewoelkung")} ${Math.round(w.clouds)}% · ${w.rain.toFixed(1)} mm</div>`;
  $("updated").removeAttribute("data-i18n"); $("updated").textContent=`${L("stand")}: ${w.time.replace("T"," ")} · Open-Meteo`;
}
