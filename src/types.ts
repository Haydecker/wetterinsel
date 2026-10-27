export type LatLon = { lat: number; lon: number };

export type ElementOSM = { type: string; id: number; lat?: number; lon?: number; geometry?: { lat: number; lon: number }[]; tags?: Record<string, string>; part?: number; members?: { type: string; role?: string; geometry?: { lat: number; lon: number }[] }[] };

/** See als Ringe (außen und Inseln) in Isometrie-Metern. */
export type Lake = { rings: P[][] };

export type P = { x: number; y: number };

export type Shape = { points: P[]; tags: Record<string, string>; kind: "building" | "road" | "plaza" | "green" | "water" | "rail" | "platform" | "stream" | "area" | "power" | "hedge" | "stop"; id: string; height: number };

export type Weather = { temperature: number; feels: number; code: number; wind: number; direction: number; clouds: number; rain: number; humidity: number; day: number; time: string; sunrise?: string; sunset?: string; hourly?: { time: string[]; temp: number[]; pop: number[]; code: number[]; day: number[] }; daily?: { time: string[]; code: number[]; max: number[]; min: number[]; pop: number[] } };
