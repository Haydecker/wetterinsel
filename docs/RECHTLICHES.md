# Rechtliche Hinweise

[English](LEGAL.md) · *Allgemeine Informationen zu einem Hobby-Open-Source-Projekt, keine Rechtsberatung.*

## 1. Lizenz des Codes
Der Quellcode steht unter der **Apache License 2.0** (siehe [LICENSE](../LICENSE)). Die Software wird **„wie besehen“ ohne jede Gewährleistung** bereitgestellt; der Autor haftet nicht für Schäden aus der Nutzung (siehe Abschnitte 7 und 8 der Lizenz).

## 2. Daten und Dienste Dritter
Die App zeigt Daten Dritter an und ruft sie ab. Sie gehören **nicht** zur Apache-2.0-Lizenz:

| Quelle | Verwendung | Bedingungen |
|---|---|---|
| **OpenStreetMap** | Kartendaten (Gebäude, Straßen, Wasser …) | © OpenStreetMap-Mitwirkende, [ODbL 1.0](https://www.openstreetmap.org/copyright). Der Quellenhinweis wird in der App angezeigt und **muss auch bei Kiosk-Einbettungen sichtbar bleiben** (eine kleine Quellenzeile wird ins Bild gezeichnet). Bei Veröffentlichung abgeleiteter Datenbanken gilt Weitergabe unter gleichen Bedingungen. |
| **Nominatim** | Adresssuche | [Nutzungsrichtlinie](https://operations.osmfoundation.org/policies/nominatim/): höchstens ca. 1 Anfrage/Sekunde, identifizierbarer User-Agent/Referer, keine massenhafte Nutzung, Zwischenspeichern erforderlich. Die Docker-Version speichert Ergebnisse zwischen und sendet den konfigurierten `CONTACT`. |
| **Overpass API** | Kartenabfragen | Gemeinschaftsserver mit Kapazitätsgrenzen; keine Verfügbarkeitszusage. Bitte nicht überlasten. |
| **Open-Meteo** | Wetter | [CC BY 4.0](https://open-meteo.com/en/license), kostenlos für **nicht kommerzielle** Nutzung im Rahmen fairer Nutzung. Kommerzielle Nutzung erfordert ein Open-Meteo-Abo/einen API-Schlüssel. Der Quellenhinweis wird in der App angezeigt. |

Wer eine öffentliche oder kommerzielle Instanz betreibt, ist selbst für die Einhaltung dieser Bedingungen verantwortlich (und muss ggf. eigene oder kommerzielle Dienste nutzen).

## 3. Haftungsausschluss
- Wetter- und Kartendaten werden ohne Gewähr bereitgestellt. Die App **nicht** für sicherheitsrelevante Entscheidungen verwenden (Reise, Flug, Segeln, Unwetterwarnung, Notfälle). Für Warnungen amtliche Wetterdienste nutzen.
- Das Bild ist eine stilisierte Illustration: Gebäudeformen folgen OSM, Höhen und Dächer sind erfunden oder geschätzt; Maßstab und Details können von der Wirklichkeit abweichen. Fehlende oder falsche Kartendaten sind eine Eigenschaft von OpenStreetMap.

## 4. Datenschutz
- Die App selbst hat **keine Konten, keine Cookies, keine Analyse, kein Tracking**. Einstellungen und zwischengespeicherte Karten liegen im lokalen Speicher deines Browsers (Einzeldatei) bzw. auf deinem eigenen Server (Docker).
- **Einzeldatei:** Dein Browser verbindet sich direkt mit Nominatim, Overpass und Open-Meteo. Diese Dienste erhalten deine IP-Adresse und die eingegebene Adresse/Koordinaten und haben eigene Datenschutzerklärungen.
- **Docker-Version:** Dein Browser spricht nur mit deinem Server; der Server kontaktiert diese Dienste (mit seiner IP und dem konfigurierten `CONTACT`) und speichert Adressen, Koordinaten und Kartendaten in `DATA_DIR`. Das Wetter wird direkt aus dem Browser abgerufen.
- Adressen können personenbezogene Daten sein. Links mit der eigenen Wohnadresse nicht veröffentlichen.

## 5. Wenn du eine öffentliche Instanz betreibst
In Deutschland/EU braucht eine öffentlich erreichbare Website in der Regel ein **Impressum** und eine **Datenschutzerklärung** mit Name und Kontakt des Betreibers. Dieses Repository enthält bewusst keine persönlichen Kontaktdaten – ergänze deine eigenen im Deployment. Achte darauf, dass deine Nutzung im Rahmen der Bedingungen der Datenanbieter bleibt.

## 6. Namen und Marken
„Wetterinsel / Weather Island“ ist der Projektname. Der Comic-Look ist ein eigener Illustrationsstil; das Projekt steht in keiner Verbindung zu fremden Comics, Figuren oder Marken und wird von ihnen weder unterstützt noch ist es davon abgeleitet. Genannte Produkt- und Dienstnamen gehören ihren jeweiligen Inhabern.
