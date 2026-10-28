# Features & URL parameters

[Deutsch](FEATURES.de.md)

## What it shows
| Area | Details |
|---|---|
| **Map** | Buildings (gabled roofs, chimneys, wobbly comic outlines), roads and paths, bridges, trees and bushes, fences, lamps, parked and driving cars |
| **Water** | Streams, rivers, ponds and **lakes** (OSM multipolygon relations, e.g. Lake Constance, including islands) with waves, ducks and sailing boats |
| **Objects** | Rails with a small train, playgrounds and sports pitches, fields/orchards/allotments/cemeteries, power lines, hedges and walls, bus stops and platforms – each group can be switched on or off |
| **Weather** | Clear, partly cloudy, overcast, fog, drizzle, rain, thunderstorm, snow. Clouds drift in the real wind direction at a speed proportional to the wind speed; semi-transparent comic clouds |
| **Atmosphere** | Day, dusk and night from real sunrise/sunset; wet roads, snowy roofs, swaying trees, wind streaks, birds, chimney smoke when it is cold |
| **Sky objects** | Sun, moon with the real moon phase (optional), optional compass below the island |
| **Info** | Temperature, wind and time as text in the picture, comic speech bubble, forecast by hours or days, °C/°F |
| **Interaction** | **Rotate the disc:** with the compass on, drag the disc with the mouse or one finger – the whole island is re-projected, wind arrow and cloud drift follow; the "N" button turns it back to north. Zoom (buttons, wheel, pinch), pan/drag, touch, reset; option panel with link generator and "Update" button |
| **Embedding** | `kiosk=true` shows only the island (transparent or coloured background) – ideal for iFrames and wall displays |

## URL parameters
Parameter names are case-insensitive; booleans accept `true/false`, `yes/no`, `on/off`, `1/0`. Defaults are omitted from generated links. The parameter names are German (the app's original language); English aliases are listed where available.

| Parameter | Values | Default | Meaning |
|---|---|---|---|
| `adresse` (alias `address`, `ort`) | text | `Marienplatz, 80331 München, Deutschland` | Address or place to centre the island on |
| `lat`, `lon` | decimal degrees | – | Centre by coordinates instead of an address |
| `wetter` | boolean | `false` | Show the weather text in the picture |
| `temperatur` | boolean | `true` | Include temperature in the text |
| `wind` | boolean | `true` | Include wind in the text |
| `zeit` | boolean | `false` | Include the update time in the text |
| `textpos` | `unten-links`, `unten-rechts`, `oben-links`, `oben-rechts` | `unten-links` | Position of the weather text |
| `kiosk` | boolean | `false` | Island only, no page UI |
| `zoom` | boolean | `true` (`false` in kiosk) | Zoom/pan controls |
| `kompass` | boolean | `false` | Compass below the island |
| `drehung` (alias `rotation`) | 0–359 (degrees) | `0` | Turn the disc clockwise (north is not "up-left" any more). Set by dragging when the compass is on |
| `mondphase` | boolean | `false` | Show moon phase badge |
| `mondalter` | 0–29.5 | – | Test: force a moon age in days |
| `bg` | hex colour, CSS colour, `transparent` | sky gradient | Background (kiosk) |
| `radius` | 100–1500 (metres) | `200` | Radius of the island. Above 700 m a lighter map query (fewer details) is used |
| `objekte` | `gleise,gewaesser,freizeit,landnutzung,strom,hecken,haltestellen`, `alle`, `keine` | `alle` | Which map objects to draw (rails, water, leisure, land use, power, hedges, stops) |
| `animation` | boolean | `true` (`false` with reduced-motion setting) | Animations on/off |
| `refresh` | 0–240 (minutes) | `10` | Weather refresh interval, `0` = off |
| `vorhersage` | `aus`, `stunden`, `tage` | `aus` | Forecast off / hours / days |
| `einheit` (alias `unit`) | `celsius`, `fahrenheit` | `celsius` | Temperature unit |
| `sprache` (alias `lang`) | `de`, `en` | `de` | Language of the whole interface (German/English). Default: last choice, else browser language; `de` in kiosk mode |
| `testwetter` | `klar`, `heiter`, `wolkig`, `bedeckt`, `nebel`, `nieselregen`, `regen`, `gewitter`, `schnee`, `wind` | – | Test: fake weather |
| `tageszeit` | `auto`, `tag`, `nacht` | `auto` | Force day or night |

**Examples**
- Dashboard tile: `/?adresse=Lindau%20Bodensee&kiosk=true&wetter=true&zeit=true&radius=500`
- Night test with snow: `/?kiosk=true&testwetter=schnee&tageszeit=nacht&mondphase=true`

## Architecture in short
- `src/api` – Overpass, Nominatim, Open-Meteo access (server first, direct fallback for the single-file build)
- `src/map` – projection, island, buildings, vegetation, features (rails, streams, hedges …), lakes, details
- `src/weather` – clouds, wind, rain/snow, moon, day/night
- `src/ui` – panels, forecast, zoom, form
- `server.mjs` – static files plus `/api/map`, `/api/lakes`, `/api/geocode`, `/api/status` with a disk cache in `DATA_DIR`
