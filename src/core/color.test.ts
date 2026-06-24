/**
 * Tiny zero-dependency test runner for the color pipeline.
 * Run with: npm test
 */
import { parseColor, rgbToOklch, toOklchString } from "./color.js";

let failures = 0;

function approx(label: string, got: number, want: number, tol = 0.01) {
  const ok = Math.abs(got - want) <= tol;
  if (!ok) {
    failures++;
    console.error(`✗ ${label}: got ${got}, want ~${want} (tol ${tol})`);
  } else {
    console.log(`✓ ${label}`);
  }
}

function eq(label: string, got: unknown, want: unknown) {
  const ok = got === want;
  if (!ok) {
    failures++;
    console.error(`✗ ${label}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
  } else {
    console.log(`✓ ${label}`);
  }
}

// Reference OKLCH values (from culori / Ottosson reference implementation).
const white = rgbToOklch(parseColor("#ffffff")!);
approx("white L", white.l, 1.0);
approx("white C", white.c, 0.0);

const black = rgbToOklch(parseColor("#000000")!);
approx("black L", black.l, 0.0);
approx("black C", black.c, 0.0);

const red = rgbToOklch(parseColor("#ff0000")!);
approx("red L", red.l, 0.6279, 0.01);
approx("red C", red.c, 0.2577, 0.01);
approx("red H", red.h, 29.23, 0.5);

// shadcn's own default --primary in the new-york light theme is
// oklch(0.205 0 0) which is the hex #1c1c1c-ish neutral. Sanity check a
// mid neutral stays near-zero chroma.
const gray = rgbToOklch(parseColor("#737373")!);
approx("gray C near zero", gray.c, 0.0, 0.005);

// Format + alpha
eq("hex w/ alpha parses", toOklchString("#00000080")!.includes("/ 0.502"), true);
eq("rgb() parses", toOklchString("rgb(255, 0, 0)") !== null, true);
eq("hsl() parses", toOklchString("hsl(0 100% 50%)") !== null, true);
eq("garbage rejected", toOklchString("not-a-color"), null);

// 3-digit hex
approx("#fff == white L", rgbToOklch(parseColor("#fff")!).l, 1.0);

if (failures > 0) {
  console.error(`\n${failures} test(s) failed`);
  process.exit(1);
} else {
  console.log("\nAll color tests passed");
}
