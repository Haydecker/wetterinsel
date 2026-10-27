import { Weather } from "../types";
import { INK, node } from "../util";

/** Ein paar Vögel am Himmel bei ruhigem, trockenem Tageswetter. */
export function drawBirds(layer: Element, w: Weather | null) {
  if (!w || !w.day || w.rain > 0 || w.clouds > 85 || w.wind > 32) return;
  const toward = ((w.direction + 180) % 360) * Math.PI / 180, dir = Math.sin(toward) >= 0 ? 1 : -1;
  for (let i = 0; i < 4; i++) {
    const g = node(layer, "g", { class: "bird-fly", style: `--dir:${dir};animation-duration:${115 + i * 16}s;animation-delay:${-i * 30}s` });
    const b = node(g, "g", { transform: `translate(${180 + i * 170} ${45 + (i * 37) % 90}) scale(${(dir) * (1 + (i % 3) * .3)} ${1 + (i % 3) * .3})` });
    node(node(b, "g", { class: "flap", style: `animation-delay:${-i * .2}s` }), "path", { d: "M-9 0 Q-4.5 -7 0 0 Q4.5 -7 9 0", fill: "none", stroke: INK, "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round" });
  }
}
