/**
 * Color parsing and conversion.
 *
 * The whole point of token-bridge is that shadcn/ui on Tailwind v4 expects its
 * color variables in OKLCH. Design tokens almost never arrive that way — they
 * come as hex, rgb(), or hsl(). This module parses those formats and converts
 * them to OKLCH so the emitted theme matches the shadcn contract exactly.
 *
 * Pipeline: sRGB (0–255) -> linear sRGB -> OKLab -> OKLCH.
 * Reference: Björn Ottosson, "A perceptual color space for image processing".
 */

export interface Rgb {
  r: number; // 0–255
  g: number;
  b: number;
  a: number; // 0–1
}

export interface Oklch {
  l: number; // 0–1
  c: number; // ~0–0.4
  h: number; // 0–360 (NaN for achromatic)
  a: number; // 0–1
}

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

// ─── Parsing ────────────────────────────────────────────────────────────────

export function parseColor(input: string): Rgb | null {
  const value = input.trim().toLowerCase();
  return (
    parseHex(value) ??
    parseRgb(value) ??
    parseHsl(value) ??
    null
  );
}

function parseHex(value: string): Rgb | null {
  const m = /^#([0-9a-f]{3,8})$/i.exec(value);
  if (!m) return null;
  let hex = m[1];
  if (hex.length === 3 || hex.length === 4) {
    hex = hex.split("").map((c) => c + c).join("");
  }
  if (hex.length !== 6 && hex.length !== 8) return null;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
  return { r, g, b, a };
}

function parseRgb(value: string): Rgb | null {
  const m = /^rgba?\(([^)]+)\)$/.exec(value);
  if (!m) return null;
  const parts = m[1].split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 3) return null;
  const toByte = (p: string) =>
    p.endsWith("%") ? (parseFloat(p) / 100) * 255 : parseFloat(p);
  const r = clamp(toByte(parts[0]), 0, 255);
  const g = clamp(toByte(parts[1]), 0, 255);
  const b = clamp(toByte(parts[2]), 0, 255);
  const a = parts[3] != null ? parseAlpha(parts[3]) : 1;
  return { r, g, b, a };
}

function parseHsl(value: string): Rgb | null {
  const m = /^hsla?\(([^)]+)\)$/.exec(value);
  if (!m) return null;
  const parts = m[1].split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 3) return null;
  const h = ((parseFloat(parts[0]) % 360) + 360) % 360;
  const s = clamp(parseFloat(parts[1]) / 100, 0, 1);
  const l = clamp(parseFloat(parts[2]) / 100, 0, 1);
  const a = parts[3] != null ? parseAlpha(parts[3]) : 1;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const mm = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return {
    r: (r + mm) * 255,
    g: (g + mm) * 255,
    b: (b + mm) * 255,
    a,
  };
}

function parseAlpha(p: string): number {
  return clamp(p.endsWith("%") ? parseFloat(p) / 100 : parseFloat(p), 0, 1);
}

// ─── sRGB -> OKLCH ────────────────────────────────────────────────────────────

function srgbToLinear(c: number): number {
  const cs = c / 255;
  return cs <= 0.04045 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
}

export function rgbToOklch({ r, g, b, a }: Rgb): Oklch {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  const l_ = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m_ = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s_ = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const aa = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  const C = Math.sqrt(aa * aa + bb * bb);
  let H = (Math.atan2(bb, aa) * 180) / Math.PI;
  if (H < 0) H += 360;

  return { l: L, c: C, h: C < 1e-4 ? NaN : H, a };
}

// ─── Formatting ───────────────────────────────────────────────────────────────

const round = (n: number, dp: number) => {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
};

/** Format an Oklch as a CSS `oklch(...)` string matching shadcn's style. */
export function formatOklch(o: Oklch): string {
  const l = round(o.l, 4);
  const c = round(o.c, 4);
  const h = Number.isNaN(o.h) ? 0 : round(o.h, 2);
  const base = `${l} ${c} ${h}`;
  return o.a < 1 ? `oklch(${base} / ${round(o.a, 3)})` : `oklch(${base})`;
}

/** Convenience: any CSS color string -> shadcn-style oklch() string, or null. */
export function toOklchString(input: string): string | null {
  const rgb = parseColor(input);
  if (!rgb) return null;
  return formatOklch(rgbToOklch(rgb));
}
