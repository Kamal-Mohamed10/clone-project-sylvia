import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * The live sylviasrestaurant.com/cater page, cloned verbatim (see
 * src/chrome/cater.html): inline styles + body markup with scripts stripped
 * and lazy-loaded images promoted to real src/srcset, plus one inserted
 * placeholder (#catering-booking-mount) where the live site's dead
 * "submit an inquiry" CTA sits — CateringBooking portals a real booking
 * form into it.
 */
export const CATERING_HTML = readFileSync(
  path.join(process.cwd(), "src/chrome/cater.html"),
  "utf8",
);
