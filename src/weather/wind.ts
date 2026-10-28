import { Weather } from "../types";
import { opts } from "../options";

/** Bodenrichtung (Peilung in Grad, 0 = Nord, 90 = Ost) → Richtung auf dem Bildschirm der isometrischen Karte. */
export function groundToScreen(bearingDeg: number): { ux: number; uy: number; angle: number; len: number } {
  const a = (bearingDeg + opts.drehung) * Math.PI / 180, vx = Math.sin(a), vy = Math.cos(a);
  const sx = vx - vy, sy = -(vx + vy) * .5, l = Math.hypot(sx, sy) || 1;
  return { ux: sx / l, uy: sy / l, angle: Math.atan2(sy, sx) * 180 / Math.PI, len: l };
}
/** Richtung, in die der Wind weht (Open-Meteo liefert die Richtung, aus der er kommt). */
export const windVec = (w: Weather) => groundToScreen((w.direction + 180) % 360);
