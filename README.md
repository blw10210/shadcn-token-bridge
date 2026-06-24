# shadcn-token-bridge

Turn raw design tokens into a correct **shadcn/ui + Tailwind v4** theme — without the spacing, radius, shadow and type drift.

```bash
npx shadcn-token-bridge build tokens.json --out app/globals.css
```

## The problem

You design or generate a UI, then express it in shadcn/Tailwind. The colors come out right — they came straight from your tokens — but everything else quietly rounds to framework defaults: spacing snaps to Tailwind's scale, radii and shadows go generic, type sizes shift. The result reads subtly *off* while the palette looks correct, and it's hard to point at why.

Tailwind v4 adds a second trap: shadcn now expects its color variables in **OKLCH**. Paste hex into the variable contract and the format silently mismatches — the classic symptom is colors rendering transparent or black because a stray `hsl(var(--x))` wrapper is trying to read a hex value.

token-bridge fixes both. It reads your tokens, converts every color to OKLCH, and writes a `globals.css` mapped onto the **exact** shadcn variable contract — then tells you which contract tokens you forgot, because the missing ones are where drift hides.

## Install

```bash
npm i -g shadcn-token-bridge   # or just use npx
```

After a global install the commands `shadcn-token-bridge` and the shorter alias `token-bridge` both work. The examples below use `npx shadcn-token-bridge`.

## Usage

Start a tokens file (a complete light + dark starter covering the whole contract):

```bash
npx shadcn-token-bridge init                 # writes tokens.json
```

Edit the values, then generate:

```bash
npx shadcn-token-bridge build tokens.json --out app/globals.css
npx shadcn-token-bridge build tokens.json --print      # preview to stdout
```

You can also feed it a **mockup's CSS** directly — any file with `:root { --x: … }` and `.dark { … }` blocks. Colors are converted; non-color values (shadows, custom spacing) pass through untouched:

```bash
npx shadcn-token-bridge build mockup.css --out app/globals.css
```

### The drift report

Every build prints which shadcn contract tokens you didn't supply:

```
  ⚠ 4 shadcn contract token(s) not supplied — components will
    fall back to defaults for these (a common source of drift):
    chart-3, chart-4, chart-5, sidebar-ring
```

Treat it as a checklist. Full coverage is the goal — that's the difference between "looks close" and "matches the design."

## Input format (JSON)

```json
{
  "radius": "0.625rem",
  "fonts": { "sans": "Figtree, sans-serif", "mono": "ui-monospace, monospace" },
  "light": { "background": "#ffffff", "primary": "#1f6f54", "...": "..." },
  "dark":  { "background": "#0c0f0e", "primary": "#3f9f7c", "...": "..." },
  "extra": { "light": { "surface-card": "#f7f8f7" }, "dark": { "surface-card": "#141917" } }
}
```

Colors may be hex (`#1f6f54`, `#fff`, `#00000080`), `rgb()/rgba()`, or `hsl()/hsla()`. Anything under `extra` becomes a custom token and is still exposed to Tailwind via `@theme inline` (e.g. `bg-surface-card`).

## What it generates

A Tailwind v4 `globals.css`: `:root` and `.dark` blocks in OKLCH, the `@theme inline` mapping (`--color-*: var(--*)`), and the radius scale. See [`examples/`](./examples).

## Use it with shadcn's CLI

token-bridge ships a [registry](./registry) item, so the generated theme installs through shadcn's own CLI:

```bash
npx shadcn@latest add https://your-host/registry/theme.json
```

This is the supported, merge-free way to distribute a theme — it complements shadcn rather than patching it.

## Use it with Claude Code

There's a [skill](./.claude/skills/token-bridge) that teaches Claude Code when and how to run token-bridge — handy when a ported screen "has the right colors but looks off." Drop the `.claude/skills/token-bridge` folder into your project.

## What it does *not* do

This is the token + theming layer only. It doesn't port layouts or components — those are a visual spec to reimplement, not importable source. It won't invent values you didn't provide; it tells you what's missing instead.

## Releasing

CI runs the build and color tests on every push and PR ([`.github/workflows/ci.yml`](./.github/workflows/ci.yml)). Publishing is automated ([`.github/workflows/publish.yml`](./.github/workflows/publish.yml)): cut a GitHub Release tagged `vX.Y.Z` and the workflow builds, tests, and runs `npm publish --provenance`. Configure auth once — either trusted publishing on npmjs.com (no secret) or an `NPM_TOKEN` repo secret.

## License

MIT
