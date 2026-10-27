import { state } from "../state";
import { opts } from "../options";
import { moonInfo } from "../weather/moon";
import { INK, node } from "../util";
import { dayInfo, skyPos } from "../weather/daytime";
import { windVec } from "../weather/wind";
import { cloudShape } from "../weather/clouds";

export function drawWeather(layer:Element) {
  if(!state.weatherNow)return;
  const w=state.weatherNow, code=w.code;
  const rainy=[51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(code), snowy=[71,73,75,77,85,86].includes(code);
  const storm=[95,96,99].includes(code), foggy=[45,48].includes(code);
  const v=windVec(w);
  // Nebel
  if(foggy)for(let i=0;i<4;i++)node(layer,"rect",{x:40+i*30,y:150+i*65,width:920-i*60,height:46,rx:23,fill:"#fff",opacity:".5",class:"fog",style:`animation-delay:${-i*2}s`});
  // Sonne / Mond
  const clear=code<=2&&w.clouds<70;
  const di=dayInfo(w);
  if(clear&&w.day){const p=skyPos(di.frac);sunShape(layer,p.x,p.y,1.15);}
  if(clear&&!w.day){const p=skyPos(di.nfrac);moonShape(layer,p.x,p.y,1.5);}
  // Wolken
  if(w.clouds>15||rainy||snowy) {
    const count=Math.max(2,Math.min(6,Math.round(Math.max(w.clouds,rainy||snowy?60:0)/20)));
    // Echte Geschwindigkeit: km/h → m/s → Bildeinheiten (Kartenmaßstab und Perspektive der Windrichtung)
    const speed=Math.max(.4,(w.wind/3.6)*(1.45*200/opts.radius)*v.len), dur=Math.min(2400,Math.max(25,1520/speed));
    for(let i=0;i<count;i++){
      const cl=node(layer,"g",{class:"cloud-drift",style:`animation-duration:${dur}s;animation-delay:${-(i/count)*dur}s;--tx:${(v.ux*760).toFixed(0)}px;--ty:${(v.uy*760).toFixed(0)}px`});
      cloudShape(cl,60+((i*397)%800),55+((i*97)%190),(1.2+((i*7)%5)*.22)*(w.clouds>70?1.12:1),i*13+5,rainy||storm);
    }
  }
  // Regen
  if(rainy){const drizzle=[51,53,55,56,57].includes(code), n=drizzle?95:28+Math.min(40,Math.round(w.rain*18));for(let i=0;i<n;i++){const x=100+(i*53)%800,y=100+(i*37)%320;dropShape(layer,x,y,drizzle?.42+(i%3)*.08:.9+(i%3)*.25,-(i%11)*(drizzle?.23:.2),drizzle?.8:storm?.75:.9);}}
  // Blitz
  if(storm)for(let i=0;i<2;i++){const b=node(layer,"g",{class:"flash",style:`animation-delay:${-i*1.7}s`});node(b,"path",{d:"M0 0 L-12 26 L-2 26 L-10 52 L14 18 L3 18 L12 0 Z",transform:`translate(${360+i*260} ${150+i*50}) scale(1.1)`,fill:"#ffe23d",stroke:INK,"stroke-width":2.6,"stroke-linejoin":"round"});}
  // Schnee
  if(snowy)for(let i=0;i<36;i++){
    const x=100+(i*89)%800,y=100+(i*59)%320,s=.8+(i%3)*.35,g=node(layer,"g",{class:"snowflake",style:`animation-delay:${-(i%9)*.55}s`});
    const t=node(g,"g",{transform:`translate(${x} ${y}) scale(${s})`});
    if(i%2){const d="M0 -6 L0 6 M-5.2 -3 L5.2 3 M-5.2 3 L5.2 -3";node(t,"path",{d,stroke:INK,"stroke-width":4.4,"stroke-linecap":"round",fill:"none"});node(t,"path",{d,stroke:"#fff","stroke-width":2,"stroke-linecap":"round",fill:"none"});}
    else node(t,"circle",{r:3.6,fill:"#fff",stroke:INK,"stroke-width":1.4});
  }
  // Wind
  if(w.wind>=10){const n=3+Math.min(5,Math.round(w.wind/9));for(let i=0;i<n;i++){
    const y=140+((i*71)%290),d="M0 0 H52 C66 0 68 -15 56 -15 C48 -15 47 -6 54 -5",g=node(layer,"g",{class:"wind-streak",style:`animation-duration:${Math.max(4,12-w.wind/6)}s;animation-delay:${-i*.9}s;--tx:${(v.ux*260).toFixed(0)}px;--ty:${(v.uy*260).toFixed(0)}px`});
    const t=node(g,"g",{transform:`translate(${v.ux>=0?60+(i*131)%300:560+(i*131)%300} ${y}) rotate(${v.angle.toFixed(1)})`});
    node(t,"path",{d,fill:"none",stroke:"#fff","stroke-width":6,"stroke-linecap":"round"});node(t,"path",{d,fill:"none",stroke:INK,"stroke-width":2.4,"stroke-linecap":"round"});}}
}

export function sunShape(layer:Element,x:number,y:number,s:number){
  const g=node(layer,"g",{transform:`translate(${x} ${y}) scale(${s})`}),rays=node(g,"g",{class:"sun-rays"});
  const pts:string[]=[];for(let i=0;i<24;i++){const a=i*Math.PI/12,r=i%2?32:56;pts.push(`${(Math.cos(a)*r).toFixed(1)},${(Math.sin(a)*r).toFixed(1)}`);}
  node(rays,"polygon",{points:pts.join(" "),fill:"#ffb62e",stroke:INK,"stroke-width":3.5,"stroke-linejoin":"round"});
  node(g,"circle",{r:34,fill:"#f5a623",stroke:INK,"stroke-width":4});
  node(g,"circle",{cx:-3,cy:-3,r:29,fill:"#ffe45e"});
  node(g,"path",{d:"M-18 -12 A22 22 0 0 1 -4 -22",fill:"none",stroke:"#fff","stroke-width":3.5,"stroke-linecap":"round"});
}

/** Mondscheibe mit Phase (rechts beleuchtet = zunehmend). */
function phaseDisc(g: Element, R: number) {
  const m = moonInfo(), k = m.k, rx = Math.abs(k) * R, gg = node(g, "g", { transform: `scale(${m.waxing ? 1 : -1} 1)` });
  node(gg, "circle", { r: R, fill: "#3d4b82" });
  const lit = k >= 0 ? `M0 ${-R} A${R} ${R} 0 0 1 0 ${R} A${rx.toFixed(1)} ${R} 0 0 0 0 ${-R} Z` : `M0 ${-R} A${R} ${R} 0 0 1 0 ${R} A${rx.toFixed(1)} ${R} 0 0 1 0 ${-R} Z`;
  if (m.illum > .015) node(gg, "path", { d: lit, fill: "#fff3b0" });
  if (m.illum > .5) { node(gg, "circle", { cx: -R * .27, cy: -R * .2, r: R * .11, fill: "#e8d98a", opacity: ".7" }); node(gg, "circle", { cx: R * .3, cy: R * .23, r: R * .15, fill: "#e8d98a", opacity: ".6" }); }
  node(g, "circle", { r: R, fill: "none", stroke: INK, "stroke-width": 2.6 });
}
export function moonShape(layer:Element,x:number,y:number,s:number){
  const g=node(node(layer,"g",{transform:`translate(${x} ${y}) scale(${s})`}),"g",{class:"moon"});
  if(opts.mondphase){ phaseDisc(g,30); return; }
  node(g,"path",{d:"M8 -34 A34 34 0 1 0 8 34 A42 42 0 0 1 8 -34 Z",fill:"#fff3b0",stroke:INK,"stroke-width":2.6,"stroke-linejoin":"round"});
  node(g,"path",{d:"M-18 -14 A22 22 0 0 1 -6 -26",fill:"none",stroke:"#fff","stroke-width":3,"stroke-linecap":"round"});
}
/** Festes Mondphasen-Schild im Bild (unabhängig von Tageszeit und Bewölkung). */
export function moonBadge(layer:Element){
  const m=moonInfo(), W=186, H=60, right=opts.wetter&&opts.textpos==="oben-links", x=right?1000-24-W:24, y=24, font="'Comic Sans MS','Chalkboard SE',system-ui,sans-serif";
  const g=node(layer,"g",{transform:`translate(${x} ${y})`});
  node(g,"rect",{x:3,y:4,width:W,height:H,rx:18,fill:INK,opacity:".25"});
  node(g,"rect",{width:W,height:H,rx:18,fill:"#1d2750",stroke:INK,"stroke-width":3.5});
  phaseDisc(node(g,"g",{transform:`translate(${H/2} ${H/2})`}),22);
  const t1=node(g,"text",{x:H+4,y:26,"font-size":13,"font-weight":900,"font-family":font,fill:"#fff"});t1.textContent=m.name;
  const t2=node(g,"text",{x:H+4,y:44,"font-size":12,"font-weight":700,"font-family":font,fill:"#fff3b0"});t2.textContent=`${Math.round(m.illum*100)} % ${opts.sprache==="de"?"beleuchtet":"lit"}`;
}
export function dropShape(layer:Element,x:number,y:number,s:number,delay:number,speed:number){
  const g=node(layer,"g",{class:"drop",style:`animation-delay:${delay}s;animation-duration:${(1.9/speed).toFixed(2)}s`});
  node(g,"path",{d:"M0 -9 C2 -4 6 -1 6 3 A6 6 0 0 1 -6 3 C-6 -1 -2 -4 0 -9 Z",transform:`translate(${x} ${y}) scale(${s})`,fill:"#6ec1ff",stroke:INK,"stroke-width":1.5,"stroke-linejoin":"round"});
}
