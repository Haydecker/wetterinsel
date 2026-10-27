# Legal information

[Deutsch](RECHTLICHES.md) · *This is general information for a hobby open-source project, not legal advice.*

## 1. License of the code
The source code is released under the **Apache License 2.0** (see [LICENSE](../LICENSE)). The software is provided **"as is", without warranty of any kind**; the author is not liable for damages arising from its use (see sections 7 and 8 of the license).

## 2. Third-party data and services
The app displays and requests data from third parties. These are **not** part of the Apache-2.0 license:

| Source | Used for | Terms |
|---|---|---|
| **OpenStreetMap** | Map data (buildings, roads, water …) | © OpenStreetMap contributors, [ODbL 1.0](https://www.openstreetmap.org/copyright). Attribution is shown in the app and **must be kept visible** in kiosk embeds (a small credit line is drawn into the picture). Share-alike applies if you publish derived databases. |
| **Nominatim** | Address search | [Usage policy](https://operations.osmfoundation.org/policies/nominatim/): max. ~1 request/second, identifiable User-Agent/Referer, no heavy or bulk use, caching required. The Docker version caches results and sends the `CONTACT` you configure. |
| **Overpass API** | Map queries | Community servers with capacity limits; no guarantee of availability. Please do not hammer them. |
| **Open-Meteo** | Weather | [CC BY 4.0](https://open-meteo.com/en/license), free for **non-commercial** use with fair-use limits. Commercial use requires an Open-Meteo subscription/API key. Attribution is shown in the app. |

If you run a public or commercial instance, you are responsible for complying with these terms (and for using your own or commercial service endpoints where required).

## 3. Disclaimer
- Weather and map data are provided without warranty. **Do not** use the app for safety-critical decisions (travel, flying, sailing, storm warnings, emergencies). Use official weather services for warnings.
- The picture is a stylised illustration: building shapes follow OSM, heights and roofs are invented or estimated; scale and details may deviate from reality. Missing or wrong map data is a property of OpenStreetMap.

## 4. Privacy
- The app itself has **no accounts, no cookies, no analytics, no tracking**. Settings and cached maps are kept in your browser's local storage (single-file version) or on your own server (Docker version).
- **Single-file version:** your browser connects directly to Nominatim, Overpass and Open-Meteo. These services receive your IP address and the typed address/coordinates and have their own privacy policies.
- **Docker version:** your browser talks only to your server; the server contacts those services (with its own IP and the configured `CONTACT`) and stores addresses, coordinates and map data in `DATA_DIR`. Weather is requested from the browser directly.
- Addresses can be personal data. Do not publish links containing your home address.

## 5. If you host a public instance
In Germany/EU a publicly accessible website usually requires a **legal notice (Impressum)** and a **privacy policy (Datenschutzerklärung)** with the operator's name and contact. This repository intentionally contains no personal contact data – add your own to your deployment. Make sure your use stays within the terms of the data providers above.

## 6. Names and trademarks
"Wetterinsel / Weather Island" is the name of this project. The comic look is an original illustration style; the project is not affiliated with, endorsed by or derived from any third-party comics, characters or brands. Product and service names mentioned belong to their respective owners.
