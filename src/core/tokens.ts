/**
 * Token input parsing.
 *
 * token-bridge accepts two input shapes and normalizes them into a `TokenSet`:
 *
 *  1. A JSON file:
 *     {
 *       "radius": "0.625rem",
 *       "fonts": { "sans": "Figtree, sans-serif", "mono": "..." },
 *       "light": { "background": "#ffffff", "primary": "#1f6f54", ... },
 *       "dark":  { "background": "#0c0f0e", "primary": "#2f8f6f", ... },
 *       "extra": { "light": { "surface-card": "#f7f8f7" }, "dark": { ... } }
 *     }
 *
 *  2. A CSS file with `:root { --x: ... }` and `.dark { --x: ... }` blocks
 *     (e.g. a mockup's exported variables). Color values are converted; any
 *     non-color value (rem, px, font stacks) is passed through untouched.
 */
import { parseColor } from "./color.js";

export interface TokenSet {
  radius?: string;
  fonts?: Record<string, string>;
  /** shadcn contract colors + any extras, keyed by token name. */
  light: Record<string, string>;
  dark: Record<string, string>;
  /** Non-color tokens passed through verbatim (spacing, shadows, etc.). */
  passthroughLight: Record<string, string>;
  passthroughDark: Record<string, string>;
}

export function parseInput(raw: string, filename: string): TokenSet {
  const isJson = filename.endsWith(".json") || raw.trimStart().startsWith("{");
  return isJson ? parseJsonInput(raw) : parseCssInput(raw);
}

function emptySet(): TokenSet {
  return {
    light: {},
    dark: {},
    passthroughLight: {},
    passthroughDark: {},
  };
}

function parseJsonInput(raw: string): TokenSet {
  const data = JSON.parse(raw) as Record<string, unknown>;
  const set = emptySet();
  if (typeof data.radius === "string") set.radius = data.radius;
  if (data.fonts && typeof data.fonts === "object") {
    set.fonts = data.fonts as Record<string, string>;
  }
  Object.assign(set.light, (data.light as object) ?? {});
  Object.assign(set.dark, (data.dark as object) ?? {});
  const extra = data.extra as { light?: object; dark?: object } | undefined;
  if (extra) {
    Object.assign(set.light, extra.light ?? {});
    Object.assign(set.dark, extra.dark ?? {});
  }
  return set;
}

function parseCssInput(raw: string): TokenSet {
  const set = emptySet();
  const blocks = extractBlocks(raw);
  for (const { selector, body } of blocks) {
    const isDark = /\.dark\b|\[data-theme=["']?dark/.test(selector);
    const colors = isDark ? set.dark : set.light;
    const pass = isDark ? set.passthroughDark : set.passthroughLight;
    for (const [name, value] of parseDeclarations(body)) {
      if (name === "radius") {
        set.radius = set.radius ?? value;
        continue;
      }
      if (parseColor(value)) colors[name] = value;
      else pass[name] = value;
    }
  }
  return set;
}

/** Find `selector { ... }` blocks that contain custom properties. */
function extractBlocks(css: string): Array<{ selector: string; body: string }> {
  const out: Array<{ selector: string; body: string }> = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css))) {
    const selector = m[1].trim();
    const body = m[2];
    if (body.includes("--")) out.push({ selector, body });
  }
  return out;
}

/** Parse `--name: value;` declarations from a block body. */
function parseDeclarations(body: string): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const decl of body.split(";")) {
    const idx = decl.indexOf(":");
    if (idx === -1) continue;
    const name = decl.slice(0, idx).trim();
    const value = decl.slice(idx + 1).trim();
    if (!name.startsWith("--") || !value) continue;
    out.push([name.slice(2), value]);
  }
  return out;
}
