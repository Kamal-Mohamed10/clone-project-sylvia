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
