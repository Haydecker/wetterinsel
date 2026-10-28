import { KIOSK } from "../options";
import { address, statusBox, svg } from "../dom";
import { state } from "../state";
import { tr } from "../i18n";

let lastKey = "", lastType = "";
/** Statusmeldung; mit Schlüssel wird sie beim Sprachwechsel mit übersetzt. */
export function message(text: string, type = "", key = "") {
  lastKey = key; lastType = type;
  statusBox.textContent = text; statusBox.className = `status ${type}`; address.classList.toggle("invalid", type === "error");
  if (KIOSK && !state.drawn) { const t = svg.querySelector("text"); if (t) t.textContent = text; }
}

export function retranslateStatus() { if (lastKey) message(tr(lastKey), lastType, lastKey); }
