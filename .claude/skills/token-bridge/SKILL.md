---
name: token-bridge
description: >
  Turn a set of design tokens (hex/HSL/rgb colors, radius, fonts) into a correct
  shadcn/ui + Tailwind v4 globals.css, with colors converted to OKLCH and mapped
  onto the full shadcn variable contract. Use this whenever a generated or
  ported UI "has the right colors but looks generically off," when wiring a
  design system or Figma token export into a shadcn project, when setting up
  theming for a new Next.js + Tailwind + shadcn app, or when the user mentions
  token drift, OKLCH, globals.css, or matching a mockup.
---

# token-bridge

## The problem this solves

When a design or mockup gets re-expressed as shadcn/Tailwind, colors usually
survive (they come straight from tokens) but **spacing, radius, shadow, and type
round to framework defaults** — so the layout reads generically off while the
palette looks right. On Tailwind v4, shadcn also expects colors in **OKLCH**;
hand-pasting hex into the variable contract silently mismatches the format.

token-bridge converts tokens to OKLCH and emits a `globals.css` mapped onto the
exact shadcn contract, then reports which contract tokens are missing (the
silent gaps that cause drift).

## How to use it

1. Gather the user's tokens. Accept any of: a JSON map, a Figma/Style Dictionary
   export, or a mockup's `:root { --x: … }` CSS block. If only a palette exists,
   ask for radius and font choices too.

2. Write them into a tokens file (`token-bridge init` produces a complete
   starter covering both light and dark for the whole contract).

3. Generate the theme:
   ```bash
   npx token-bridge build tokens.json --out app/globals.css
   ```
   Or preview with `--print`.

4. **Read the drift report.** If it lists missing contract tokens
   (e.g. `chart-3`, `sidebar-ring`), fill them in rather than letting shadcn
   defaults leak through. Full contract coverage is the goal.

5. Wire fonts in `app/layout.tsx` and confirm dark mode uses the `.dark` class
   (next-themes `attribute="class"`).

## Rules

- Don't wrap the generated color vars in `hsl()`. They're already `oklch(...)`.
- Don't hand-edit the generated `globals.css`; edit the tokens source and
  regenerate so the two never diverge.
- Treat the missing-token list as a checklist, not a warning to ignore.
