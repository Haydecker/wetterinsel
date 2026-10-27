export const $ = (id: string) => document.getElementById(id)!;

export const svg = $("island") as unknown as SVGSVGElement;

export const address = $("address") as HTMLInputElement;

export const statusBox = $("status");

export const weatherSummary = $("weather-summary");

export const NS = "http://www.w3.org/2000/svg";

// ---------- Optionen-Formular & Link ----------
export const I = (id: string) => $(id) as HTMLInputElement;

export const S = (id: string) => $(id) as HTMLSelectElement;
