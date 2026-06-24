# Changelog

## 0.1.0

First release.

- `build` command: convert a tokens file (JSON or a mockup's CSS `:root`/`.dark`
  blocks) into a Tailwind v4 `globals.css` mapped onto the shadcn variable
  contract, with all colors converted to OKLCH.
- `init` command: write a complete starter `tokens.json` covering the full
  light + dark contract.
- Drift report: lists shadcn contract tokens you didn't supply (the silent
  source of "looks generically off").
- Accepts hex, `rgb()/rgba()`, and `hsl()/hsla()` inputs; passes non-color
  tokens (shadows, custom spacing) through untouched.
- Ships a shadcn registry item and a Claude Code skill.
