import { OBJEKTE, Opts, buildQuery, opts } from "../options";
import { $, I, S, address } from "../dom";
import { state } from "../state";
import { applyZoomMode } from "../ui/zoom";

export function optsToForm() {
  for (const k of ["wetter", "temperatur", "wind", "zeit", "kiosk", "zoom", "kompass", "mondphase", "animation"] as const) I(`o-${k}`).checked = opts[k];
  for (const k of OBJEKTE) I(`o-ob-${k}`).checked = opts.objekte.includes(k);
  I("o-bg").value = opts.bg; I("o-radius").value = String(opts.radius); I("o-refresh").value = String(opts.refresh);
  for (const k of ["textpos", "vorhersage", "einheit", "sprache", "testwetter", "tageszeit"] as const) S(`o-${k}`).value = opts[k];
  $("o-radius-val").textContent = `${opts.radius} m`; $("radius-label").textContent = `${opts.radius} m Radius`;
}

export function formToOpts() {
  for (const k of ["wetter", "temperatur", "wind", "zeit", "kiosk", "zoom", "kompass", "mondphase", "animation"] as const) opts[k] = I(`o-${k}`).checked;
  opts.objekte = OBJEKTE.filter(k => I(`o-ob-${k}`).checked);
  opts.bg = I("o-bg").value.trim().replace(/^#/, "").toLowerCase(); opts.radius = +I("o-radius").value;
  opts.refresh = Math.max(0, Math.min(240, Math.round(+I("o-refresh").value || 0)));
  opts.textpos = S("o-textpos").value; opts.vorhersage = S("o-vorhersage").value as Opts["vorhersage"]; opts.einheit = S("o-einheit").value as Opts["einheit"]; opts.sprache = S("o-sprache").value as Opts["sprache"];
  opts.testwetter = S("o-testwetter").value; opts.tageszeit = S("o-tageszeit").value as Opts["tageszeit"];
  opts.adresse = address.value.trim() || opts.adresse;
}

export function updateUrl() {
  const qs = buildQuery(opts, I("o-coords").checked, state.center), full = `${location.origin}${location.pathname}${qs ? `?${qs}` : ""}`;
  ($("o-url") as unknown as HTMLTextAreaElement).value = full; ($("o-open") as HTMLAnchorElement).href = full;
  $("o-radius-val").textContent = `${opts.radius} m`; $("radius-label").textContent = `${opts.radius} m Radius`;
}

let reloadTimer: number | undefined;
export function wireForm(hooks: { reload: () => void; arm: () => void; rerender: () => void; apply: () => void }) {
  optsToForm(); I("o-coords").checked = true;
  $("params").addEventListener("input", e => {
    const before = opts.radius, id = (e.target as HTMLElement).id; if (id === "o-coords") { updateUrl(); return; }
    formToOpts(); updateUrl();
    if (opts.radius !== before) { clearTimeout(reloadTimer); reloadTimer = window.setTimeout(() => hooks.reload(), 700); return; }
    if (id === "o-refresh") hooks.arm();
    if (id === "o-zoom") applyZoomMode();
    hooks.rerender();
  });
  address.addEventListener("input", () => { address.classList.remove("invalid"); formToOpts(); updateUrl(); });
  $("o-apply").addEventListener("click", () => hooks.apply());
  $("o-copy").addEventListener("click", async () => {
    const t = $("o-url") as unknown as HTMLTextAreaElement;
    try { await navigator.clipboard.writeText(t.value); } catch { t.select(); document.execCommand("copy"); }
    $("o-copy").textContent = "Kopiert ✓"; setTimeout(() => ($("o-copy").textContent = "Link kopieren"), 1600);
  });
}
