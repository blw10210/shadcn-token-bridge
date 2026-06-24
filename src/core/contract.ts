/**
 * The shadcn/ui variable contract (Tailwind v4 era).
 *
 * These are the color variables shadcn components read. token-bridge maps your
 * tokens onto this exact set so stock components inherit your brand. Anything
 * you provide beyond this list is passed through as an extra custom token and
 * still exposed to Tailwind via `@theme inline`.
 */
export const SHADCN_COLOR_TOKENS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "destructive-foreground",
  "border",
  "input",
  "ring",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
] as const;

export type ShadcnColorToken = (typeof SHADCN_COLOR_TOKENS)[number];
