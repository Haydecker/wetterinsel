import { P } from "../types";
import { KIOSK, opts } from "../options";
import { state } from "../state";
import { COMPASS } from "../map/compass";
import { CX, CY, RX, RY } from "../map/geometry";
import { $, svg } from "../dom";

// ---------- Zoom & Touch (Pinch, Ziehen, Doppeltipp, Tasten) ----------
export const BASE = { w: 1000, h: 560 }, view = { x: 0, y: 0, w: 1000, h: 560 }, MAXZOOM = 6;

export function setVB() { svg.setAttribute("viewBox", `${view.x.toFixed(1)} ${view.y.toFixed(1)} ${view.w.toFixed(1)} ${view.h.toFixed(1)}`); const z = BASE.w / view.w; document.getElementById("zoom-reset")?.toggleAttribute("disabled", z < 1.01); document.getElementById("rot-reset")?.toggleAttribute("hidden", !opts.drehung); }

export function clampView() { view.h = view.w * BASE.h / BASE.w; view.x = Math.max(0, Math.min(BASE.w - view.w, view.x)); view.y = Math.max(0, Math.min(BASE.h - view.h, view.y)); }

export const zoomLevel = () => BASE.w / view.w;

export function toSvg(cx: number, cy: number): P { const m = svg.getScreenCTM(); if (!m) return { x: 0, y: 0 }; const p = new DOMPoint(cx, cy).matrixTransform(m.inverse()); return { x: p.x, y: p.y }; }

export function zoomAt(cx: number, cy: number, level: number) {
  level = Math.max(1, Math.min(MAXZOOM, level)); const p0 = toSvg(cx, cy);
  view.w = BASE.w / level; view.h = BASE.h / level; setVB();
  const p1 = toSvg(cx, cy); view.x += p0.x - p1.x; view.y += p0.y - p1.y; clampView(); setVB();
}

export function resetView() { view.x = 0; view.y = 0; view.w = BASE.w; view.h = BASE.h; setVB(); }

export function panBy(dx: number, dy: number) {
  const r = svg.getBoundingClientRect(), f = Math.min(r.width / view.w, r.height / view.h) || 1;
  view.x -= dx / f; view.y -= dy / f; clampView(); setVB();
}

// ---------- Scheibe drehen (nur mit Kompass) ----------
export const rotationEnabled = () => opts.kompass && (!KIOSK || opts.zoom);
let rotateHook: (phase: "move" | "end") => void = () => {};
export const onRotate = (cb: (phase: "move" | "end") => void) => { rotateHook = cb; };

/** Position auf dem Bildschirm → angezeigte Peilung auf der Kompass-Scheibe (0 = Nord, im Uhrzeigersinn). */
function bearingAt(clientX: number, clientY: number) {
  const m = (state.root as SVGGraphicsElement | null)?.getScreenCTM(); if (!m) return null;
  const p = new DOMPoint(clientX, clientY).matrixTransform(m.inverse()), { cy, rx, ry } = COMPASS, dx = p.x - CX, dy = p.y - cy;
  const A = Math.SQRT2 * dx / rx, B = -Math.SQRT2 * dy / ry;
  return { b: Math.atan2((A + B) / 2, (B - A) / 2) * 180 / Math.PI, inDisc: (dx / rx) ** 2 + (dy / ry) ** 2 <= 1, inRing: ((p.x - CX) / RX) ** 2 + ((p.y - CY) / RY) ** 2 > 1 };
}

export function wireZoom() {
  const ptrs = new Map<number, { x: number; y: number }>(); let lastDist = 0, lastMid = { x: 0, y: 0 }, tap = { t: 0, x: 0, y: 0 }, moved = 0;
  const pinch = () => { const [a, b] = [...ptrs.values()]; return { dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } }; };
  let rot: { id: number; b0: number; r0: number; x0: number; y0: number; active: boolean } | null = null;
  const tapAt = (x: number, y: number) => { const now = Date.now();
    if (now - tap.t < 320 && Math.hypot(x - tap.x, y - tap.y) < 30) { if (zoomLevel() > 1.3) resetView(); else zoomAt(x, y, 2.6); tap.t = 0; } else tap = { t: now, x, y }; };
  svg.addEventListener("pointerdown", e => {
    if (rotationEnabled() && !rot && ptrs.size === 0 && e.isPrimary) {
      const h = bearingAt(e.clientX, e.clientY);
      if (h && h.inDisc && (zoomLevel() <= 1.001 || h.inRing)) { try { svg.setPointerCapture(e.pointerId); } catch {} rot = { id: e.pointerId, b0: h.b, r0: opts.drehung, x0: e.clientX, y0: e.clientY, active: false }; return; }
    }
    if (!opts.zoom) return;
    try { svg.setPointerCapture(e.pointerId); } catch {} ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved = 0;
    if (ptrs.size === 2) { const p = pinch(); lastDist = p.dist; lastMid = p.mid; }
  });
  svg.addEventListener("pointermove", e => {
    if (rot && e.pointerId === rot.id) {
      if (!rot.active && Math.hypot(e.clientX - rot.x0, e.clientY - rot.y0) < 5) return;
      const h = bearingAt(e.clientX, e.clientY); if (!h) return;
      rot.active = true; opts.drehung = (((rot.r0 + h.b - rot.b0) % 360) + 360) % 360; state.rotating = true; rotateHook("move"); return;
    }
    const prev = ptrs.get(e.pointerId); if (!prev || !opts.zoom) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved += Math.abs(e.clientX - prev.x) + Math.abs(e.clientY - prev.y);
    if (ptrs.size === 1) { if (zoomLevel() > 1.001) panBy(e.clientX - prev.x, e.clientY - prev.y); }
    else if (ptrs.size === 2) { const p = pinch(); zoomAt(p.mid.x, p.mid.y, zoomLevel() * p.dist / lastDist); panBy(p.mid.x - lastMid.x, p.mid.y - lastMid.y); lastDist = p.dist; lastMid = p.mid; }
  });
  const end = (e: PointerEvent) => {
    if (rot && e.pointerId === rot.id) { const r = rot; rot = null; if (r.active) { state.rotating = false; rotateHook("end"); } else if (e.type === "pointerup") tapAt(e.clientX, e.clientY); return; }
    if (!ptrs.has(e.pointerId)) return; const wasSingle = ptrs.size === 1; ptrs.delete(e.pointerId); lastDist = 0;
    if (ptrs.size === 1) { const rest = [...ptrs.values()][0]; lastMid = rest; }
    if (wasSingle && e.type === "pointerup" && moved < 12) { // Doppeltipp / Doppelklick
      tapAt(e.clientX, e.clientY);
    }
  };
  svg.addEventListener("pointerup", end); svg.addEventListener("pointercancel", end);
  svg.addEventListener("wheel", e => { if (!opts.zoom || !(e.ctrlKey || e.metaKey || e.altKey)) return; e.preventDefault(); zoomAt(e.clientX, e.clientY, zoomLevel() * Math.exp(-e.deltaY * (e.ctrlKey ? .01 : .003))); }, { passive: false });
  const mid = () => { const r = svg.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  $("zoom-in").addEventListener("click", () => { const m = mid(); zoomAt(m.x, m.y, zoomLevel() * 1.6); });
  $("zoom-out").addEventListener("click", () => { const m = mid(); zoomAt(m.x, m.y, zoomLevel() / 1.6); });
  $("zoom-reset").addEventListener("click", resetView);
  $("rot-reset").addEventListener("click", () => { opts.drehung = 0; rotateHook("end"); });
  document.addEventListener("visibilitychange", () => document.documentElement.classList.toggle("paused", document.hidden));
}

export function applyZoomMode() { document.querySelector(".stage")?.classList.toggle("zoomable", opts.zoom || rotationEnabled()); if (!opts.zoom) resetView(); }
