#!/usr/bin/env node
/**
 * token-bridge CLI
 *
 *   token-bridge build <input> [--out app/globals.css]
 *   token-bridge init   [--out tokens.json]
 *
 * `build` reads a tokens file (JSON or CSS), converts colors to OKLCH, and
 * writes a Tailwind v4 globals.css mapped onto the shadcn contract. It prints a
 * drift report listing any contract tokens you didn't supply.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import { parseInput } from "./core/tokens.js";
import { emitGlobalsCss } from "./core/emit.js";
import { SAMPLE_TOKENS } from "./core/sample.js";

const args = process.argv.slice(2);
const cmd = args[0];

function getFlag(name: string, fallback?: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}

function fail(msg: string): never {
  console.error(`token-bridge: ${msg}`);
  process.exit(1);
}

function help() {
  console.log(`token-bridge — design tokens → shadcn/ui + Tailwind v4 theme

Usage:
  token-bridge build <input>   Generate globals.css from a tokens file (JSON or CSS)
    --out <path>               Output path (default: app/globals.css)
    --print                    Write to stdout instead of a file

  token-bridge init            Write a starter tokens.json you can fill in
    --out <path>               Output path (default: tokens.json)

Examples:
  token-bridge init
  token-bridge build tokens.json --out app/globals.css
  token-bridge build mockup.css --print
`);
}

switch (cmd) {
  case "init": {
    const out = getFlag("out", "tokens.json")!;
    writeFileSync(out, JSON.stringify(SAMPLE_TOKENS, null, 2) + "\n");
    console.log(`✓ Wrote starter tokens to ${out}`);
    console.log("  Fill in your colors, then run: token-bridge build " + out);
    break;
  }

  case "build": {
    const input = args[1];
    if (!input || input.startsWith("--")) fail("build needs an input file. Try: token-bridge build tokens.json");
    let raw: string;
    try {
      raw = readFileSync(input, "utf8");
    } catch {
      fail(`could not read ${input}`);
    }
    const set = parseInput(raw, basename(input));
    const result = emitGlobalsCss(set);

    if (args.includes("--print")) {
      process.stdout.write(result.css);
    } else {
      const out = getFlag("out", "app/globals.css")!;
      writeFileSync(out, result.css);
      console.log(`✓ Wrote ${out}`);
    }

    console.log(`\n  ${result.converted} color value(s) converted to OKLCH.`);
    if (result.extras.length) {
      console.log(`  ${result.extras.length} custom token(s) exposed to Tailwind: ${result.extras.join(", ")}`);
    }
    if (result.missing.length) {
      console.log(`\n  ⚠ ${result.missing.length} shadcn contract token(s) not supplied — components will`);
      console.log(`    fall back to defaults for these (a common source of drift):`);
      console.log(`    ${result.missing.join(", ")}`);
    } else {
      console.log("\n  ✓ Full shadcn color contract covered.");
    }
    break;
  }

  case "-h":
  case "--help":
  case undefined:
    help();
    break;

  default:
    fail(`unknown command "${cmd}". Run token-bridge --help`);
}
