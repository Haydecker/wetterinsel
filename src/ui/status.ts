import { KIOSK } from "../options";
import { address, statusBox, svg } from "../dom";
import { state } from "../state";

export function message(text: string, type = "") {
  statusBox.textContent = text; statusBox.className = `status ${type}`; address.classList.toggle("invalid", type === "error");
  if (KIOSK && !state.drawn) { const t = svg.querySelector("text"); if (t) t.textContent = text; }
}
