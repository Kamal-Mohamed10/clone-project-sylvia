import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * The original Sylvia's page chrome, lifted verbatim from the source clone so
 * the events page reproduces the full site (nav, footer, background image).
 * The events section is replaced by `<div id="events-mount">`, into which the
 * live DB-driven EventsCalendar is portaled on the client.
 */
const dir = path.join(process.cwd(), "src/chrome");

export const BODY_HTML = readFileSync(path.join(dir, "body.html"), "utf8");
export const HEAD_INLINE_CSS = readFileSync(
  path.join(dir, "head-inline.css"),
  "utf8",
);
