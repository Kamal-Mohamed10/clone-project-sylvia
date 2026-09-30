/**
 * Concierge drink helpers over the full drink menu cloned from the live site
 * (see drinks-data.ts, auto-generated). Powers the `search_drinks` tool.
 *
 * Plain data (no server-only imports) — safe on client + server.
 */
import { DRINKS, type DrinkItem } from "./drinks-data";

export { DRINKS };
export type { DrinkItem };

/** Happy hour runs Mon–Fri, 3–7 PM. */
export const HAPPY_HOUR = "Monday–Friday, 3–7 PM";

function haystack(d: DrinkItem): string {
  return `${d.name} ${d.description ?? ""} ${d.category}`.toLowerCase();
}

/**
 * Drinks matching `query` (name, description, or category). Blank query returns
 * everything. Matches any whitespace-separated word.
 */
export function searchDrinks(query?: string): DrinkItem[] {
  const q = query?.trim().toLowerCase();
  if (!q) return DRINKS;
  const words = q.split(/[^a-z0-9']+/).filter(Boolean);
  if (words.length === 0) return DRINKS;
  return DRINKS.filter((d) => {
    const hay = haystack(d);
    return words.some((w) => hay.includes(w));
  });
}

// Wine names carry a comma-separated region/vintage ("Dante Merlot, California,
// 2023"), but the model often reformats that trailing part when citing one
// (parens, dropped, reordered) — match on the brand+varietal before the first
// comma too, not just the full published string.
function matchStrings(item: DrinkItem): string[] {
  const n = item.name.toLowerCase().replace(/[’‘]/g, "'");
  const out = new Set<string>([n]);
  const comma = n.indexOf(",");
  if (comma !== -1) out.add(n.slice(0, comma));
  return [...out];
}

/**
 * Specific drinks named in a block of assistant text, in the order they appear.
 * Used by the chat widget to render thumbnail cards — same approach as
 * findCitedMenuItems in menu.ts.
 */
export function findCitedDrinkItems(text: string, limit = 8): DrinkItem[] {
  const hay = text.toLowerCase().replace(/[’‘]/g, "'");
  const hits: { item: DrinkItem; idx: number }[] = [];
  for (const item of DRINKS) {
    let best = -1;
    for (const s of matchStrings(item)) {
      const i = hay.indexOf(s);
      if (i !== -1 && (best === -1 || i < best)) best = i;
    }
    if (best !== -1) hits.push({ item, idx: best });
  }
  hits.sort((a, b) => a.idx - b.idx);
  return hits.map((h) => h.item).slice(0, limit);
}
