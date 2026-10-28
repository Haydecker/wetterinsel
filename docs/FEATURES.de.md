# Funktionen & URL-Parameter

[English](FEATURES.md)

## Was gezeigt wird
| Bereich | Details |
|---|---|
| **Karte** | Gebäude (Satteldächer, Schornsteine, wackelige Comic-Konturen), Straßen und Wege, Brücken, Bäume und Büsche, Zäune, Laternen, fahrende und parkende Autos |
| **Wasser** | Bäche, Flüsse, Teiche, **Seen** (OSM-Relationen, z. B. Bodensee, inkl. Inseln) und **Ozeane/Meere** (aus Küstenlinien) mit Wellen, Enten und Segelbooten |
| **Objekte** | Gleise mit kleinem Zug, Spiel- und Sportplätze, Äcker/Obstwiesen/Kleingärten/Friedhöfe, Stromleitungen, Hecken und Mauern, Bushaltestellen und Bahnsteige – jede Gruppe lässt sich ein- und ausschalten |
| **Wetter** | Klar, heiter, bedeckt, Nebel, Nieselregen, Regen, Gewitter, Schnee. Wolken ziehen in der echten Windrichtung, die Geschwindigkeit folgt der Windstärke; leicht transparente Comic-Wolken |
| **Stimmung** | Tag, Dämmerung und Nacht nach echtem Sonnenauf-/-untergang; nasse Straßen, verschneite Dächer, wiegende Bäume, Windlinien, Vögel, Schornsteinrauch bei Kälte |
| **Himmelsobjekte** | Sonne, Mond mit echter Mondphase (optional), optionaler Kompass unter der Insel |
| **Infos** | Temperatur, Wind und Zeit als Text im Bild, Comic-Sprechblase, Vorhersage nach Stunden oder Tagen, °C/°F |
| **Bedienung** | **Scheibe drehen:** bei eingeschaltetem Kompass die Scheibe mit Maus oder einem Finger ziehen – die ganze Insel wird neu projiziert, Windpfeil und Wolkenzug folgen; die Taste „N“ dreht zurück nach Norden. Zoom (Tasten, Mausrad, Pinch), Verschieben, Touch, Zurücksetzen; Optionen-Panel mit Link-Generator und „Aktualisieren“-Button |
| **Einbetten** | `kiosk=true` zeigt nur die Insel (transparenter oder farbiger Hintergrund) – ideal für iFrames und Wanddisplays |

## URL-Parameter
Groß-/Kleinschreibung der Namen ist egal; Wahrheitswerte: `true/false`, `ja/nein`, `an/aus`, `1/0`. Standardwerte werden in erzeugten Links weggelassen.

| Parameter | Werte | Standard | Bedeutung |
|---|---|---|---|
| `adresse` (auch `address`, `ort`) | Text | `Marienplatz, 80331 München, Deutschland` | Adresse/Ort als Mittelpunkt |
| `lat`, `lon` | Dezimalgrad | – | Mittelpunkt per Koordinaten statt Adresse |
| `wetter` (auch `wetterdaten`) | Wahrheitswert | `false` | Wettertext im Bild anzeigen |
| `temperatur` | Wahrheitswert | `true` | Temperatur im Text |
| `wind` | Wahrheitswert | `true` | Wind im Text |
| `zeit` | Wahrheitswert | `false` | Aktualisierungszeit im Text |
| `textpos` | `unten-links`, `unten-rechts`, `oben-links`, `oben-rechts` | `unten-links` | Position des Wettertexts |
| `kiosk` | Wahrheitswert | `false` | Nur die Insel, ohne Seitenoberfläche |
| `zoom` | Wahrheitswert | `true` (im Kiosk `false`) | Zoom-/Verschiebe-Bedienung |
| `kompass` | Wahrheitswert | `false` | Kompass unter der Insel |
| `drehung` (auch `rotation`) | 0–359 (Grad) | `0` | Scheibe im Uhrzeigersinn drehen. Wird beim Ziehen gesetzt, wenn der Kompass an ist |
| `mondphase` | Wahrheitswert | `false` | Mondphasen-Schild anzeigen |
| `mondalter` | 0–29,5 | – | Test: Mondalter in Tagen erzwingen |
| `bg` | Hex-Farbe, CSS-Farbe, `transparent` | Himmelsverlauf | Hintergrund (Kiosk) |
| `radius` | 100–1500 (Meter) | `200` | Radius der Insel. Ab 700 m wird eine schlankere Kartenabfrage (weniger Details) genutzt |
| `objekte` | `gleise,gewaesser,freizeit,landnutzung,strom,hecken,haltestellen`, `alle`, `keine` | `alle` | Welche Kartenobjekte gezeichnet werden |
| `animation` | Wahrheitswert | `true` (`false` bei „Bewegung reduzieren“) | Animationen an/aus |
| `refresh` | 0–240 (Minuten) | `10` | Wetter-Aktualisierung, `0` = aus |
| `vorhersage` | `aus`, `stunden`, `tage` | `aus` | Vorhersage aus / Stunden / Tage |
| `einheit` (auch `unit`) | `celsius`, `fahrenheit` | `celsius` | Temperatureinheit |
| `sprache` (auch `lang`) | `de`, `en` | `de` | Sprache der gesamten Oberfläche (Deutsch/Englisch). Standard: letzte Wahl, sonst Browsersprache; im Kiosk-Modus `de` |
| `testwetter` | `klar`, `heiter`, `wolkig`, `bedeckt`, `nebel`, `nieselregen`, `regen`, `gewitter`, `schnee`, `wind` | – | Test: erfundenes Wetter |
| `tageszeit` | `auto`, `tag`, `nacht` | `auto` | Tag oder Nacht erzwingen |

**Beispiele**
- Dashboard-Kachel: `/?adresse=Lindau%20Bodensee&kiosk=true&wetter=true&zeit=true&radius=500`
- Nachttest mit Schnee: `/?kiosk=true&testwetter=schnee&tageszeit=nacht&mondphase=true`

## Aufbau in Kürze
- `src/api` – Zugriff auf Overpass, Nominatim, Open-Meteo (erst Server, direkter Fallback bei der Einzeldatei)
- `src/map` – Projektion, Insel, Gebäude, Vegetation, Kartenobjekte (Gleise, Bäche, Hecken …), Seen, Details
- `src/weather` – Wolken, Wind, Regen/Schnee, Mond, Tag/Nacht
- `src/ui` – Panels, Vorhersage, Zoom, Formular
- `server.mjs` – statische Dateien plus `/api/map`, `/api/lakes`, `/api/geocode`, `/api/status` mit Festplatten-Cache in `DATA_DIR`
