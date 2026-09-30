import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * The live sylviasrestaurant.com/drink-menu page, cloned verbatim (see
 * src/chrome/drinks.html): inline styles + body markup with scripts stripped.
 * The live page has no per-drink photos at all (checked: zero <img> tags in
 * its content region) — this is a faithful clone of that, not a gap to fill.
 */
export const DRINKS_HTML = readFileSync(
  path.join(process.cwd(), "src/chrome/drinks.html"),
  "utf8",
);
